const bcrypt = require('bcryptjs');
const { Users, Groups, Customers, AuthProviders } = require('../../models/collections')
const model = require('../../models/index')
const { getStsCredentials } = require('../../helpers/credentialsGenerator')
const { emailPolicy } = require('../../tokenVendingMachine/policyTemplates')
const { sendEmail, sendEmailV2} = require('../../mailer/mailer')
const { generateEJSTemplate } = require('../../mailer/ejsTemplate')
const { USER_ADDED, CHANGED_PASSWORD } = require('../../helpers/success-constants')
const { OLD_PASSWORD_NOT_CORRECT, INVALID_STATUS, REQUIRED_ID_MISSING, DISASSOCIATE_BEFORE_DELETION,
    NEW_PASSWORD_CANNOT_BE_SAME_AS_OLD, REQUIRED_INPUT_MISSING,
    USER_NOT_FOUND,
    USERNAME_IS_REQUIRED
} = require('../../helpers/error-messages')
const { GraphQLError } = require('graphql')
const dot = require('dot-object')
const { getObjectId: ObjectId } = require('../../helpers/objectIdConverter')
const { domainName, apiKey, staffPrintPermission, staffRePrintPermission, updateDebitBalance, updateQuotaBalance} = require('../../config/config')
dot.keepArray = true
const {
    formObjectIds, getDatabase, addUpdateTimeStamp, addCreateTimeStamp, getDatabaseOneCustomer,
    getDatabaseForGetAllAPI, verifyUserAccess, ignoreOrderCompare, verifyKioskAndUserAccess, getDatabaseCurrentLogin,
    attachUserLoginProvider,
    escapeRegex
} = require('../../helpers/util')
const { findReference } = require('../../helpers/referenceFinder')
const { STANDARD_TIER } = require('../../helpers/constants')
const { isolatedDatabase } = require('../../config/dbHandler')
const { customerSecurity } = require('../../utils/validation')
const {validateInputBody} = require('../../helpers/inputValidation')
const JWT = require("jsonwebtoken");
const fs = require("fs");
const privateKey = fs.readFileSync('./config/jwtRS256.key')
const CustomLogger = require("../../helpers/customLogger");
const {addValue} = require("../../services/addValue");
const crypto = require("crypto");
const log = new CustomLogger()
const { fetchUsages } = require("../../services/usages")
const { getDataFromCollection } = require("../../helpers/aggregator");

module.exports = {
    Mutation: {
        async addUser (_, { addUserInput }, context, info) {
            log.lambdaSetup(context, 'users', 'addUser')
            const userData = addUserInput
            try {
                await validateInputBody('users',userData)
                verifyUserAccess(context, addUserInput.CustomerID)
                let db = await getDatabaseOneCustomer(context, addUserInput.CustomerID)
                const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(addUserInput.CustomerID) }, { DomainName: 1, Tier: 1 })
                if (customerData && customerData.Tier !== STANDARD_TIER) {
                    db = await isolatedDatabase(customerData.DomainName)
                }
                const collection = db.collection(Users)
                await validateGroupType(db, userData)
                const resetToken =  crypto.randomBytes(32).toString('hex')
                userData.ResetPasswordExpires = Date.now() + 3600000
                userData.ResetPasswordToken= resetToken
                const { insertedId } = await addUserToDatabase(userData, collection, db)
                userData.insertedId = insertedId
                await mailer(userData)
                return ({
                    message: USER_ADDED,
                    statusCode: 200
                })
            } catch (error) {
                log.error(error)
                throw Error(error)
            }
        },

        async updateUser (_, { updateUserInput, userId,authId }, context, info) {
            log.lambdaSetup(context, 'updateUser', 'users')
            return updateUserGeneric(updateUserInput, userId, authId, context)
        },

        async updateUserV2 (_, { updateUserInput, userId, authId }, context, info) {
            log.lambdaSetup(context, 'updateUserV2', 'users')
            return updateUserGeneric(updateUserInput, userId, authId, context)
        },

        async changePassword (_, { changePasswordInput, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'changePassword')
            try {
                const userID = ObjectId.createFromHexString(context.data._id)
                verifyUserAccess(context, customerId)
                const db = await getDatabase(context)
                const collection = db.collection(Users)
                const user = await collection.findOne({ _id: userID })
                await changePasswordFunction(changePasswordInput, user, collection)
                await mail(changePasswordInput, user)
                return ({
                    message: CHANGED_PASSWORD,
                    statusCode: 200
                })
            } catch (error) {
                throw new Error(error)
            }
        },

        async adminChangePassword (_, { adminChangePasswordInput, userId, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'adminChangePassword')
            try {
                await validateInputBody('adminChangePasswordInput',adminChangePasswordInput)
                const db = await getDatabaseOneCustomer(context, customerId)
                const collection = db.collection(Users)
                const user = await collection.findOne({ _id: ObjectId.createFromHexString(userId) })
                verifyUserAccess(context, user.CustomerID)
                const isMatch = await bcrypt.compare(adminChangePasswordInput.Password, user.Password)
                if (isMatch) {
                    throw new GraphQLError(NEW_PASSWORD_CANNOT_BE_SAME_AS_OLD, {
                        extensions: {
                            code: '400'
                        }
                    })
                } else {
                    await adminchangePasswordFunction(adminChangePasswordInput, user, collection)
                    await mailing(adminChangePasswordInput, user)
                    return ({
                        message: CHANGED_PASSWORD,
                        statusCode: 200
                    })
                }
            } catch (error) {
                throw new Error(error)
            }
        },

        async requestChangePassword (_, { userId, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'requestChangePassword')
            try {
                const db = await getDatabaseOneCustomer(context, customerId)
                const collection = db.collection(Users)
                const resetToken =  crypto.randomBytes(32).toString('hex')
                const setCondition = { ResetPasswordExpires: Date.now() + 3600000, ResetPasswordToken: resetToken }
                const user = await collection.findOne({_id: ObjectId.createFromHexString(userId)})
                if (!user.PrimaryEmail) {
                    throw new GraphQLError('Primary Email is required', {
                        extensions: {
                            code: '121'
                        }
                    })
                }
                await collection.updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: setCondition })
                const policy = await emailPolicy()
                const credentials = await getStsCredentials(policy)
                const accessParams = {
                    accessKeyId: credentials.Credentials.AccessKeyId,
                    secretAccessKey: credentials.Credentials.SecretAccessKey,
                    sessionToken: credentials.Credentials.SessionToken
                }
                const htmlTemplate = await generateEJSTemplate({
                    data: {
                        userName: user.Username,
                        resetToken: resetToken,
                        link: `https://${user.TenantDomain}.${domainName}/set-password?resetToken=${resetToken}&userId=${user._id}`
                    },
                    filename: 'set-pwd'
                })
                await sendEmailV2({
                    data: {
                        html: htmlTemplate, to: user.PrimaryEmail
                    },
                    accessParams: accessParams,
                    subject: 'set-pwd'
                })
                return {
                    message: "Password change request sent successfully",
                    statusCode: 200
                }
            } catch (error) {
                console.error(error)
                throw new Error(error)
            }
        },

        async userDeleted (_, { IsDeleted, userId, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'userDeleted' )
            try {
                if (IsDeleted !== true) {
                    throw new GraphQLError(INVALID_STATUS, {
                        extensions: {
                            code: '121'
                        }
                    })
                }
                if (!userId) {
                    throw new GraphQLError(REQUIRED_ID_MISSING, {
                        extensions: {
                            code: '121'
                        }
                    })
                }
                if (userId.toString() === context.data.user._id.toString()){
                    throw new GraphQLError('Unable to delete logged in user', {
                        extensions: {
                            code: '121'
                        }
                    })
                }
                const response = {
                    message: 'Deleted Successfully',
                    statusCode: 200
                }
                verifyUserAccess(context, customerId)
                const db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                const errorSet = await findReference('users', userId, db)
                if (errorSet.length > 0) {
                    const newErrorSet = errorSet.join(', ')
                    throw new GraphQLError(`${DISASSOCIATE_BEFORE_DELETION}${newErrorSet}`, {
                        extensions: {
                            code: '121'
                        }
                    })
                } else {
                    await db.collection(Users).updateOne({ _id: ObjectId.createFromHexString(userId) }, { $set: { IsDeleted: IsDeleted, DeletedBy: ObjectId.createFromHexString(context.data._id), DeletedAt: new Date() } })
                    return response
                }
            } catch (error) {
                throw new Error(error.message)
            }
        },
        async validateCardNumber (_, {cardNumber, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'validateCardNumber' )
            try {
                if(!cardNumber) {
                    throw new GraphQLError(REQUIRED_INPUT_MISSING, {
                        extensions: {
                            code: '121'
                        }
                    })
                }
                let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                let apiKeys = context.data.apiKey
                log.info('incoming api key: ',apiKeys)
                const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
                log.info('isKiosk: ',isKiosk)
                context.data.isKiosk ? verifyKioskAndUserAccess(context, customerId)
                  : verifyUserAccess(context, customerId)
                const collection = db.collection('Users')
                const user = await collection.findOne({ CardNumber: cardNumber, IsDeleted: false, IsActive: true, CustomerID:  ObjectId.createFromHexString(customerId)})
                if (user) {
                    log.info('valid user****')
                    const userSession =  {
                        userExists: true,
                        FirstName: user.FirstName,
                        LastName: user.LastName,
                        CustomerID: user.CustomerID,
                        TenantDomain: user.TenantDomain,
                        _id: user._id,
                        isKiosk: isKiosk,
                        Username: user.Username,
                        PrimaryEmail: user.PrimaryEmail,
                        PinExists: !(user.PIN === null || user.PIN === undefined || user.PIN === '')
                    }
                    userSession.Token = await JWT.sign(userSession, privateKey, { algorithm: 'RS256', expiresIn: '4h'})
                    user.iat = Math.floor(new Date() / 1000)
                    await model.users.updateIatApi(db, user.iat, user._id, apiKeys)
                    log.info('user session****', userSession)
                    return userSession
                } else {
                    throw new GraphQLError('Invalid card number', {
                        extensions: {
                            code: '401'
                        }
                    })
                }
            } catch (error) {
                log.error('error: ', error)
                log.info('info: ', error)
                throw new GraphQLError('Unknown error', {
                    extensions: {
                        code: '400'
                    }
                })
            }
        },

        async validateCardNumberPin (_, {cardNumber, pin, customerId }, context, info) {
            log.lambdaSetup(context, 'users', 'validateCardNumberPin' )
            try {
                let apiKeys = context.data.apiKey
                log.info('incoming api key: ',apiKeys)
                let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
                context.data.isKiosk ? verifyKioskAndUserAccess(context, customerId)
                  : verifyUserAccess(context, customerId)
                const isKiosk = apiKeys === apiKey.kiosk || apiKeys === apiKey.hp || apiKeys === apiKeys.scanez
                log.info('isKiosk ', isKiosk)
                const user = await db.collection('Users').findOne({CardNumber: cardNumber, CustomerID: ObjectId.createFromHexString(customerId), IsDeleted: false, IsActive: true})
                if (!user) {
                    throw new GraphQLError('User is not active or disabled', {
                        extensions: {
                            code: '401'
                        }
                    })
                } else {
                    user.PIN = user.PIN ? user.PIN : ''
                    const isMatch = await model.users.comparePassword({ candidatePassword: pin, hash: user.PIN })
                    log.info('pin matched: ', isMatch)
                    if (isMatch) {
                        const loginSession = {
                            FirstName: user.FirstName,
                            LastName: user.LastName,
                            CustomerID: user.CustomerID,
                            TenantDomain: user.TenantDomain,
                            _id: user._id,
                            isKiosk: isKiosk,
                            Username: user.Username,
                            PrimaryEmail: user.PrimaryEmail
                        }
                        log.info('login session: ', loginSession)
                        loginSession.Token = await JWT.sign(loginSession, privateKey, { algorithm: 'RS256', expiresIn: '4h'})
                        user.iat = Math.floor(new Date() / 1000)
                        await model.users.updateIatApi(db, user.iat, user._id, apiKeys)
                        return loginSession
                    } else {
                        throw new GraphQLError('Invalid card number', {
                            extensions: {
                                code: '401'
                            }
                        })
                    }
                }
            } catch (error) {
                log.error('error validateCardNumberPin: ', error)
                log.info('validateCardNumberPin: ', error)
                throw new GraphQLError('Invalid request', {
                    extensions: {
                        code: '400'
                    }
                })
            }
        },

        async updateUserBalance (_, {updateBalance }, context, info) {
            const {
                Type,
                UserID,
                CustomerID,
                Username,
                Amount,
                Comment,
              AccountID,
              Name
            } = updateBalance
            const db = await getDatabaseOneCustomer(context, CustomerID)
            verifyUserAccess(context, CustomerID)
            const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(CustomerID) }, { DomainName: 1, Tier: 1 })
            const groups = context.data.user.GroupID
            let { RoleType } = await db.collection('Groups').findOne({_id: {$in: groups}, GroupType: 'Permissions'})
            let { CustomPermissions } = await db.collection('Roles').findOne({_id: RoleType, IsDeleted: false})
            CustomPermissions = CustomPermissions.map(perms => perms.toString())
            if (Type === 'DEBIT') {
                if (!CustomPermissions?.includes(updateDebitBalance)){
                    throw new GraphQLError('Unauthorized', {
                        extensions: {
                            code: '401'
                        }
                    })
                }
            }
            if (Type === 'QUOTA') {
                if (!CustomPermissions?.includes(updateQuotaBalance)){
                    throw new GraphQLError('Unauthorized', {
                        extensions: {
                            code: '401'
                        }
                    })
                }
            }
            await addValue({
              UserID: ObjectId.createFromHexString(UserID),
                CustomerID: ObjectId.createFromHexString(CustomerID),
                Username,
                Amount,
                Name,
                Comment,
                AccountID,
                Type
            }, db, customerData, null, context.data.user)
            const response = {
                message: 'Updated Successfully',
                statusCode: 200
            }
            return response
        }
    },

    Query: {
        async getUsers (_, { paginationInput, customerIds }, context) {
            log.lambdaSetup(context, 'users', 'getUsers' )
            let {
                pattern,
                pageNumber,
                limit,
                sort,
                status,
                sortKey
            } = paginationInput
            if (context.data?.CustomerID) {
                verifyUserAccess(context, context.data.CustomerID);
            }
            const customerId = context.data.customerIdsFilter
            const tenantDomain = context.data.TenantDomain
            pageNumber = pageNumber ? parseInt(pageNumber) : undefined
            limit = limit ? parseInt(limit) : undefined
            customerIds = customerIds || []
            const secureIds = await customerSecurity(tenantDomain, customerId, customerIds, context)
            if (secureIds) {
                customerIds = secureIds
            }
            const db = await getDatabaseForGetAllAPI(context, customerIds)
            const collection = db.collection(Users)
            return await model.users.getUsersInformation(
                {
                    status,
                    pattern,
                    sort,
                    pageNumber,
                    limit,
                    sortKey,
                    customerIds,
                    collection,
                    db,
                })
                .then(async (userList) => {
                    // userList.total = userList.total.length
                    arrangeGroupData(userList?.user)
                    return userList
                }).catch(err => {
                    log.error(err)
                    throw new Error(err)
                })
        },

        async getUser (_, { userId, customerId }, context) {
            try {
                log.lambdaSetup(context, 'users', 'getUser' )
                verifyUserAccess(context, customerId)
                const user = await fetchUserDetails({
                  userId,
                  customerId,
                  context,
                });
                return user
            } catch (err) {
                log.info(err)
                throw new Error(err)
            }
        },

        async findDataExisting (_, { customerId, ValidationCheckInput }, context) {
            log.lambdaSetup(context, 'users', 'findDataExisting' )
            let {
                collectionName,
                fieldName,
                fieldValue
            } = ValidationCheckInput
            customerId ? verifyUserAccess(context, customerId) : null
            let db = customerId ? await getDatabaseOneCustomer(context, customerId) : await getDatabase(context)
            let condition = {[fieldName]: { $regex: `^${escapeRegex(fieldValue)}$`, $options: 'i' }, IsDeleted: false}
            if(customerId){
                const customerData = await db.collection('Customers').findOne({ _id: ObjectId.createFromHexString(customerId) }, { DomainName: 1, Tier: 1 })
                if (customerData && customerData.Tier !== STANDARD_TIER) {
                    db = await isolatedDatabase(customerData.DomainName)
                }
                Object.assign(condition, {CustomerID: ObjectId.createFromHexString(customerId)})
            }
            const search = await db.collection(collectionName).findOne(condition)
            return {
                message: search ? 'Data Exists' : 'Data not found',
                statusCode: search ? 200 : 404
            }
        },

        async userBalance (_, { username }, context) {
            try {
                log.lambdaSetup(context, 'users', 'userBalance' )
                log.info('isKiosk: ', context.data.isKiosk)
                const customerId = context.data.isKiosk ? ObjectId.createFromHexString(context.data.CustomerID) : ObjectId.createFromHexString(context.data.user.CustomerID)
                context.data.isKiosk  ? verifyKioskAndUserAccess(context, customerId) : verifyUserAccess(context, customerId)
                const db = await getDatabaseCurrentLogin(context)
                if (username) {
                  log.info('provided username is args: ', username)
                  const user = await db
                    .collection("Users")
                    .findOne({ Username: username, CustomerID: customerId });
                  if (!user) {
                    throw new GraphQLError(USER_NOT_FOUND, {
                      extensions: {
                        code: "404",
                      },
                    });
                  }
                  context.data.user = user;
                }
                log.info('username is context: ', username)
                let balance = context.data?.user?.DebitBalance ? context.data.user.DebitBalance : 0
                let quotaBalance = context.data.user.GroupQuotas ?
                    context.data.user.GroupQuotas.map(group => group.QuotaBalance) : []
                let groupIdUserList = context.data.user.GroupQuotas ?
                    context.data.user.GroupQuotas.map(group => ObjectId.createFromHexString(group.GroupID)) : []
                quotaBalance = await quotaBalance.reduce((partialSum, a) => partialSum + a, 0);
                let accountInfo = []
                let groupIdList = context.data.user.GroupID ?
                  context.data.user.GroupID.map(group => ObjectId.createFromHexString(group)) : []
                let groupIds = await db.collection('Groups').find({_id: {$in: groupIdUserList}}).toArray()
                let permGroup = await db.collection('Groups').findOne({_id: {$in: groupIdList}, GroupType: 'Permissions'})
                let debitBalancePriority = permGroup && permGroup.DebitBalancePriority ? permGroup.DebitBalancePriority : 0
                permGroup = permGroup && permGroup.AssociatedQuotaBalance ? permGroup.AssociatedQuotaBalance.map(gr => gr.toString()) : []
                let groupSeq = await groupIds && groupIds.length > 0 && groupIds.map(gr => gr._id.toString())
                log.info(groupSeq);
                await context.data.user.GroupQuotas && groupSeq && context.data.user.GroupQuotas.forEach(gr => {
                    let gro = groupIds[groupSeq.indexOf(gr.GroupID.toString())]
                    accountInfo.push({AccountName: gro.GroupName, Balance: gr.QuotaBalance,
                        Priority: permGroup.indexOf(gro._id.toString()),
                        GroupID: gro._id
                    })
                })
                accountInfo = accountInfo.length > 0 ? accountInfo.sort((a, b) => {
                    return a.Priority - b.Priority;
                }) : []
                accountInfo.length > 0  ? accountInfo.splice(debitBalancePriority, 0,
                  {AccountName: 'Debit', Balance: balance, Priority: debitBalancePriority})  : accountInfo =  [{AccountName: 'Debit', Balance: balance}]
                return accountInfo

            } catch (error) {
                log.info('error while getting balance')
                log.error(error);
                throw new Error(error)
            }
        },

        async getUserOverview(
            _,
            {
              usagePaginationInput,
              transactionPaginationInput,
              usageFilters = {},
              transactionFilters = {},
              userId,
              customerId,
            },
            context
          ) {
            log.lambdaSetup(context, "usages", "getUserOverview");
            try {
                
              const userData = await fetchUserDetails({
                userId,
                customerId,
                context,
              })

              if(!usageFilters?.userName && userData){
                usageFilters.userName = userData.Username
              }

              if(!transactionFilters?.userName && userData){
                transactionFilters.userName = userData.Username
              }

              const [usageData, transactionData] = await Promise.all([
                fetchUsages({
                  paginationInput: usagePaginationInput,
                  customerIds: [customerId],
                  filters: usageFilters,
                  context,
                  useUserNameFilter: true,
                }),
                fetchUsages({
                  paginationInput: transactionPaginationInput,
                  customerIds: [customerId],
                  filters: transactionFilters,
                  context,
                  useUserNameFilter: true,
                }),
              ]);
      
              return {
                usage: usageData,
                transaction: transactionData,
                user: userData,
              };
            } catch (e) {
              log.error("error in getUserOverview", e)
              throw new Error(e);
            }
        },
    }
}

const addUserToDatabase = async (userData, collection, db) => {
    const salt = await bcrypt.genSalt(10)
    const hash = userData.Password ? await bcrypt.hash(userData.Password, salt) : null
    const pinHashed = userData.PIN ? await bcrypt.hash(userData.PIN, salt) : null
    userData = formObjectIds(userData)
    if (userData && userData.Email && Array.isArray(userData.Email)) {
        userData.Email = userData.Email.map((e) => e?.toLowerCase());
    }
    if (userData && userData.PrimaryEmail) {
        userData.PrimaryEmail = userData.PrimaryEmail.toLowerCase();
    }
    const {
        Username,
        Email,
        PrimaryEmail,
        CustomerID,
        GroupID,
        GroupQuotas,
        Tier,
        TenantDomain,
        ApiKey,
        FirstName,
        CardNumber,
        Tags,
        LastName,
        MfaOption,
        approvedUser = true,
        Mfa,
        Mobile,
        ResetPasswordToken,
        ResetPasswordExpires,
        IsActive
    } = userData
    let newUser = {
        Username: Username?.toLowerCase(),
        Email: Email,
        PrimaryEmail: PrimaryEmail?.toLowerCase(),
        CustomerID: ObjectId.createFromHexString(CustomerID),
        GroupID: GroupID,
        GroupQuotas: GroupQuotas,
        CardNumber,
        Tier: Tier,
        PIN: pinHashed,
        TenantDomain: TenantDomain,
        ApiKey: ApiKey,
        Password: hash,
        FirstName: FirstName,
        MfaOption,
        LastName: LastName,
        ApprovedUser: approvedUser,
        Mfa,
        Tags,
        Mobile,
        ResetPasswordToken,
        ResetPasswordExpires,
        IsActive
    }
    const userFind = await collection.findOne({
      CustomerID: CustomerID,
      IsDeleted: false,
      AuthProviderID: { $exists: false },
      $or: [
        { Username: { $regex: `^${escapeRegex(Username)}$`, $options: 'i' } },
        { PrimaryEmail: { $regex: `^${escapeRegex(PrimaryEmail)}$`, $options: 'i' } },
        { Email: { $in: Email }}, 
        { CardNumber: { $in: CardNumber } },
      ],
    });

    if (userFind) {
        if (userFind.Username?.toLowerCase() === Username?.toLowerCase()) {
            throw new GraphQLError('Username already exists', {
                extensions: {
                    code: '121'
                }
            })
        } else if (userFind?.PrimaryEmail?.toLowerCase() === PrimaryEmail?.toLowerCase()) {
            throw new GraphQLError('Primary Email already exists', {
                extensions: {
                    code: '121'
                }
            })
        } else if (userFind) {
            let jsonArray = []
            let cardArray = []
            jsonArray = userFind.Email
                ? userFind.Email.map(i => {
                    return { name: i, matched: Email.includes(i) }
                })
                : []
            cardArray = userFind.CardNumber ? userFind.CardNumber.map(i => {
                return {name: i, matches: CardNumber.includes(i)}
            }) : []
            if (jsonArray.length > 0) {
                throw new GraphQLError('Email already exists', {
                    extensions: {
                        code: '121'
                    }
                })
            }
            if (cardArray.length > 0) {
                throw new GraphQLError('Card number already exists', {
                    extensions: {
                        code: '121'
                    }
                })
            }
        } else if (Email.includes(PrimaryEmail)) {
            throw new GraphQLError('Primary email also exists in alternate email section', {
                extensions: {
                    code: '400'
                }
            })
        } else {
            throw new GraphQLError('User already exists', {
                extensions: {
                    code: '121'
                }
            })
        }
    } else {
        try {
            let quotaBalance = await assignUserBalance(db, newUser.GroupID)
            newUser.DebitBalance = 0
            newUser.GroupQuotas = quotaBalance
            newUser = addCreateTimeStamp(newUser)
            return await collection.insertOne(newUser)
        } catch (e) {
            log.info(e)
            throw new Error(e)
        }
    }
}

const assignUserBalance = async (db, groupIds) => {
    const groupData = await db.collection('Groups').findOne({_id: {$in: groupIds}, GroupType: 'Permissions'})
    const userBalances = groupData?.AssociatedQuotaBalance && groupData?.AssociatedQuotaBalance?.length > 0 ?
        await db.collection('Groups').find({_id: {$in: groupData.AssociatedQuotaBalance}}).toArray() : []
    let userBalancesFinal = []
    await userBalances.forEach(bal => {
        userBalancesFinal.push({
            GroupID: bal._id,
            QuotaBalance: bal.QuotaBalance.Amount
        })
    })
    return userBalancesFinal
}

const mailer = async (userData) => {
    try {
        const policy = await emailPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
        const htmlTemplate = await generateEJSTemplate({
            data: {
                userName: userData.Username,
                link: `https://${userData.TenantDomain}.${domainName}/set-password?resetToken=${userData.ResetPasswordToken}&userId=${userData.insertedId}`
            },
            filename: 'set-pwd'
        })
        await sendEmailV2({
            data: { html: htmlTemplate, to: userData.PrimaryEmail },
            accessParams: accessParams,
            subject: 'add-user'
        })
    } catch (error) {
        log.info(error)
        throw new Error(error)
    }
}

module.exports.userMail = async (userData) => {
    await mailer(userData)
}

const changePasswordFunction = async (changePasswordInput, user, collection) => {
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(changePasswordInput.newPassword, salt)
    const isMatch = await bcrypt.compare(changePasswordInput.Password, user.Password)
    if (isMatch) {
        await collection.updateOne({ Username: changePasswordInput.Username }, { $set: { Password: hashPassword } })
    } else {
        throw new GraphQLError(OLD_PASSWORD_NOT_CORRECT, {
            extensions: {
                code: '400'
            }
        })
    }
}

const adminchangePasswordFunction = async (adminchangePasswordInput, user, collection) => {
    const salt = await bcrypt.genSalt(10)
    const hashPassword = await bcrypt.hash(adminchangePasswordInput.Password, salt)
    await collection.updateOne({_id: user._id}, {$set: {Password: hashPassword}})
}

const mail = async (changePasswordInput, user) => {
    try {
        const policy = await emailPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
        const htmlTemplate = await generateEJSTemplate({
            data: { Username: user.Username, Pass: changePasswordInput.newPassword },
            filename: 'change-pass'
        })
        await sendEmailV2({
            data: { html: htmlTemplate, to: user.PrimaryEmail },
            accessParams: accessParams,
            subject: 'change-pass'
        })
    } catch (error) {
        log.error(error)
        throw new Error(error)
    }
}

const mailing = async (adminchangePasswordInput, user) => {
    try {
        const policy = await emailPolicy()
        const credentials = await getStsCredentials(policy)
        const accessParams = {
            accessKeyId: credentials.Credentials.AccessKeyId,
            secretAccessKey: credentials.Credentials.SecretAccessKey,
            sessionToken: credentials.Credentials.SessionToken
        }
        const htmlTemplate = await generateEJSTemplate({
            data: { Username: user.Username, Password: adminchangePasswordInput.Password },
            filename: 'admin-pass'
        })
        await sendEmailV2({
            data: { html: htmlTemplate, to: user.PrimaryEmail },
            accessParams: accessParams,
            subject: 'admin-pass'
        })
    } catch (error) {
        log.error(error)
        throw new Error(error)
    }
}

const validateGroupType = async (db, userData) => {
    try {
        const groups = db.collection(Groups)
        const groupTypeArray = []
        if (userData.GroupID) {
            const groupData = userData.GroupID ? await groups.find({ _id: { $in: userData.GroupID }, IsDeleted: false }).toArray() : []
            if (groupData) {
                // eslint-disable-next-line
                groupData.forEach(gro => {
                    log.info(groupTypeArray.includes(gro.GroupType))
                    if (groupTypeArray.includes(gro.GroupType)) {
                        throw new GraphQLError('Failed to associate user with multiple groups of same type', {
                            extensions: {
                                code: '400'
                            }
                        })
                    } else {
                        groupTypeArray.push(gro.GroupType)
                    }
                })
            } else {
                return groupData
            }
        } else {
            return []
        }
    } catch (e) {
        log.error(e)
        throw new Error(e)
    }
}

const updateUserGeneric = async (updateUserInput, userId, authId, context) => {
    try {
        const userName = userId ? ObjectId.createFromHexString(userId) : ObjectId.createFromHexString(context.data._id)
        const tenantDomain = context.data.TenantDomain
        context.data.isKiosk ? verifyKioskAndUserAccess(context, updateUserInput.CustomerID)
          : verifyUserAccess(context, updateUserInput.CustomerID)
        updateUserInput = await addUpdateTimeStamp(updateUserInput)
        const validateConditionArray = []
        log.info('updateUserInput-->>>',updateUserInput);
        if(updateUserInput.PIN){
            const salt = await bcrypt.genSalt(10)
            updateUserInput.PIN = updateUserInput.PIN ? await bcrypt.hash(updateUserInput.PIN, salt) : null
        }
        log.info('updateUserInput-->>>',updateUserInput);
        let updateObject = await dot.dot(updateUserInput)
        updateObject.UpdatedBy = context.data._id ? ObjectId.createFromHexString(context.data._id) : null
        updateObject = await formObjectIds(updateUserInput)
        dot.remove('TenantDomain', updateObject)
        dot.remove('Username', updateObject)
        dot.remove('Password', updateObject)
        const db = await getDatabaseOneCustomer(context, updateUserInput.CustomerID)
        const customerId = updateUserInput.CustomerID      
        if (tenantDomain !== 'admin') {
            dot.remove('CustomerID', updateObject)
        }
        const customerData = await db.collection('Customers').findOne({_id: ObjectId.createFromHexString(customerId)})
        const collection = db.collection(Users)
        await validateGroupType(db, updateUserInput)
        let userFind = false
        if (updateUserInput.Email && updateUserInput.Email.length > 0) {
            updateUserInput.Email = updateUserInput.Email.map((e) => e?.toLowerCase());
            validateConditionArray.push({ Email: { $in: updateUserInput.Email } })
        }
        if (updateUserInput.PrimaryEmail) {
            updateUserInput.PrimaryEmail = updateUserInput.PrimaryEmail.toLowerCase()
            updateObject.PrimaryEmail = updateUserInput.PrimaryEmail.toLowerCase()
            validateConditionArray.push({ PrimaryEmail: { $regex: `^${escapeRegex(updateUserInput.PrimaryEmail)}$`, $options: 'i' } })
        }
        if (updateUserInput?.CardNumber && Array.isArray(updateUserInput.CardNumber)) {
            validateConditionArray.push({ CardNumber: {$in: updateUserInput.CardNumber} })
        } else {
            validateConditionArray.push({ CardNumber: updateUserInput.CardNumber })
        }
        if (validateConditionArray.length > 0) {
          const baseQuery = {
            $or: validateConditionArray,
            IsDeleted: false,
            CustomerID: ObjectId.createFromHexString(customerId),
            _id: { $ne: ObjectId.createFromHexString(userName) },
          };

          if (authId) {
            const authProvider = await db.collection("AuthProviders").findOne({
              _id: ObjectId.createFromHexString(authId),
            });
            if (authProvider && authProvider?.AuthProvider === "internal") {
              baseQuery.AuthProviderID = { $exists: false };
            } else {
              baseQuery.AuthProviderID = ObjectId.createFromHexString(authId);
            }
          }

          userFind = await collection.findOne(baseQuery);
        }
        if (userFind && updateUserInput?.PrimaryEmail?.toLowerCase() === userFind?.PrimaryEmail?.toLowerCase()) {
            throw new GraphQLError('Primary Email already exists', {
                extensions: {
                    code: '121'
                }
            })
        } else if (userFind && userFind.Email) {
            let jsonArray = []
            let cardArray = []
            jsonArray = userFind.Email.map(i => {
                return { name: i, matched: updateUserInput.Email.includes(i) }
            })
            if (userFind.CardNumber.includes(updateUserInput.CardNumber)){
                cardArray = [{name: updateUserInput.CardNumber, matches: true}]
            } else {
                cardArray = userFind.CardNumber ? userFind.CardNumber.map(i => {
                    return {name: i, matches: updateUserInput?.CardNumber?.includes(i)}
                }) : []
            }
            if (jsonArray.length > 0) {
                throw new GraphQLError('Provided alternate email already exists', {
                    extensions: {
                        code: '121'
                    }
                })
            }
            if (cardArray.length > 0) {
                throw new GraphQLError('Card number already exists', {
                    extensions: {
                        code: '121'
                    }
                })
            }

        } else if (updateUserInput.Email && updateUserInput.Email.includes(updateUserInput.PrimaryEmail)) {
            throw new GraphQLError('Primary email also exists in alternate email section', {
                extensions: {
                    code: '121'
                }
            })
        } else {
            const userData = await db.collection('Users').findOne({_id: userName, IsDeleted: false})
            if (updateUserInput?.CardNumber && !Array.isArray(updateUserInput.CardNumber)){
                if (Array.isArray(userData?.CardNumber)) {
                    if (!userData.CardNumber.includes(updateUserInput.CardNumber)) {
                        if (userData.CardNumber?.length) {
                            userData.CardNumber.splice(1, 1, userData.CardNumber[0]);
                            userData.CardNumber[0] = updateUserInput.CardNumber;
                        } else {
                            userData.CardNumber[0] = updateUserInput.CardNumber
                        }
                    }
                    updateObject.CardNumber = userData.CardNumber
                } else {
                    updateObject.CardNumber = [updateUserInput?.CardNumber]
                }
            }
            if (customerData &&  !!customerData?.MfaEnforce) {
                updateObject.MfaOption = updateObject.MfaOption ? updateObject.MfaOption : {
                    Email: !!customerData?.MfaEnforce,
                    Mobile: false
                }
            }
            if (updateUserInput?.GroupID && updateUserInput?.GroupID.length > 0) {
                const userGroups = userData.GroupID.map((id) => id.toString())
                let isUserGroupUpdate = false;
                updateUserInput.GroupID.forEach((group) => {
                    if (!userGroups.includes(group.toString())) {
                        isUserGroupUpdate = true
                    }
                })
                if (isUserGroupUpdate) {
                    let quotaBalance = await assignUserBalance(db, updateUserInput.GroupID)
                    updateObject.GroupQuotas = quotaBalance
                }
            }
            log.info('Before: ',updateUserInput);
            log.info('After: ',updateObject);
            await  collection.updateOne({ _id: userName }, {
                $set:
                updateObject
            })
            return {
                message: 'Updated successfully',
                statusCode: 200
            }
        }
    } catch (error) {
        log.info(error)
        throw new Error(error)
    }

}

const arrangeGroupData = (users) => {
  if (users?.length > 0) {
    users.forEach((user) => {
      if (user.GroupData && Array.isArray(user.GroupData)) {
        user.GroupData.sort((a, b) => (a.GroupType === "Permissions" ? -1 : 1));
      }
    });
  }
};

const fetchUserDetails = async ({ userId, customerId, context }) => {
  try {
    const db = customerId
      ? await getDatabaseOneCustomer(context, customerId)
      : await getDatabase(context);
    const customerData = await db
      .collection(Customers)
      .findOne(
        { _id: ObjectId.createFromHexString(customerId) },
        { CustomerName: 1 }
      );
    const user = await getDataFromCollection({
      collectionName: "Users",
      filters: { _id: ObjectId.createFromHexString(userId) },
      join: {
        from: "Groups",
        localField: "GroupID",
        foreignField: "_id",
        as: "GroupData",
        projection: [
          "_id",
          "GroupName",
          "DebitBalancePriority",
          "GroupType",
          "AssociatedQuotaBalance",
        ],
      },
    });

    let permGroup = await user[0].GroupData.filter(
      (group) => group.GroupType.toLowerCase() === "permissions"
    );
    let associatedBalances =
      permGroup.length > 0 && permGroup[0].AssociatedQuotaBalance
        ? await permGroup[0].AssociatedQuotaBalance.map((bal) => bal.toString())
        : [];
    if (user[0] && user[0].GroupQuotas) {
      const quotaGroupIds = user[0]?.GroupQuotas.map((group) => group.GroupID);
      const quotaGroups = await db
        .collection("Groups")
        .find({ _id: { $in: quotaGroupIds } })
        .toArray();
      let sortedArr = user[0]?.GroupQuotas.sort(function (a, b) {
        return (
          associatedBalances.indexOf(a.GroupID.toString()) -
          associatedBalances.indexOf(b.GroupID.toString())
        );
      });
      user[0].GroupQuotas = sortedArr.length > 0 ? sortedArr : [];
      for (let i = 0; i < user[0].GroupQuotas.length; i++) {
        user[0].GroupQuotas[i].GroupName = quotaGroups[i].GroupName;
      }
    }
    await attachUserLoginProvider(user);
    user[0].CustomerName = customerData.CustomerName;
    return user[0];
  } catch (err) {
    log.info(err);
    throw new Error(err);
  }
};