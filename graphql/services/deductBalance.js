const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const CustomLogger = require('../helpers/customLogger')
const log = new CustomLogger()

module.exports.deductBalanceFromUsersAccount = async (event, db, customizationTextData) => {
    try {
        const userName = event.Username
        let amount = event.Print.TotalCost
        const decimalPlaces = customizationTextData?.GlobalDecimalSetting ? customizationTextData.GlobalDecimalSetting : 2;
        log.info('decimalPlaces********', decimalPlaces);
        const customerId = ObjectId.createFromHexString(event.CustomerID)
        const userDataQueried = await db.collection('Users').aggregate([
            {
                $match: {
                    Username: userName, CustomerID: customerId, IsDeleted: false
                }
            },
            {
                $lookup: {
                    from: 'Groups',
                    localField: 'GroupQuotas.GroupID',
                    foreignField: '_id',
                    pipeline: [
                        { $project: { GroupName: 1 } }
                    ],
                    as: 'AssociatedGroup'
                }
            }]).toArray()
        const userData = userDataQueried[0]
        log.info("userData ****: ", userData._id)
        const associatedGroupsNames = userDataQueried[0] && userDataQueried[0].AssociatedGroup
        const orderAssociatedGroupsIds = userDataQueried[0] && userDataQueried[0].AssociatedGroup ?
            await userDataQueried[0].AssociatedGroup.map(id => id._id.toString()) : []
        let balance = userData.DebitBalance ? userData.DebitBalance : 0
        //fetch krna padega now from the group permission to get the priorities
        let priorityArray = []
        let permissionGroupId= await userData.GroupID
        let permissionGroupIndex= await userData?.GroupQuotas?.map(gr => gr.GroupID.toString()) || []
        let attachedGroups = await db.collection('Groups').findOne({_id: {$in: permissionGroupId}, IsDeleted: false, GroupType: 'Permissions'})
        let newGroupArray = []
        log.info("attachedGroups ****: ", attachedGroups)
        await attachedGroups.AssociatedQuotaBalance.forEach(quota => {
            if(event.DeductBalance.includes(quota.toString())){
                priorityArray.push(quota)
            } else {
                    permissionGroupIndex.includes(quota.toString()) &&
                    newGroupArray.push(userData.GroupQuotas[permissionGroupIndex.indexOf(quota.toString())])
            }
        })
        event.DeductBalance.includes('debit') ?
            priorityArray.splice(attachedGroups.DebitBalancePriority, 0, 'debit') : []
        let deductBalance = []
        // amount aaya 10$ and kaatne hai 8$ and two accounts are selected
        log.info("amount received ********: ", amount)
        log.info('current debit balance********', balance);
        log.info("priorityArray ****: ",priorityArray)
        
        for (let account of priorityArray) {
            console.log('account********',account);
            let deductInfo = {}
            if(event.DeductBalance.includes(account.toString()) && account.toString().toLowerCase() !== 'debit') {
                let identifiedAccount =  userData.GroupQuotas[permissionGroupIndex.indexOf(account.toString())]
                let associatedGroupsData =  associatedGroupsNames[permissionGroupIndex.indexOf(account.toString())]
                let updateAccount = {}
                let isDeducted
                console.log('inside***',amount);
                console.log('type inside***',typeof amount);
                console.log('quota*',identifiedAccount.QuotaBalance);
                if (amount === 0) {
                    updateAccount.GroupID = ObjectId.createFromHexString(identifiedAccount.GroupID)
                    updateAccount.QuotaBalance = identifiedAccount.QuotaBalance
                    isDeducted = false
                    newGroupArray.push(updateAccount)
                } else if (amount > identifiedAccount.QuotaBalance){
                    isDeducted = identifiedAccount.QuotaBalance !== 0
                    deductInfo.AmountDeducted = identifiedAccount.QuotaBalance
                    amount = parseFloat((amount - identifiedAccount.QuotaBalance).toFixed(decimalPlaces))
                    updateAccount.GroupID = ObjectId.createFromHexString(identifiedAccount.GroupID)
                    updateAccount.QuotaBalance = 0
                    newGroupArray.push(updateAccount)
                } else if (parseFloat(amount).toFixed(decimalPlaces) === parseFloat(identifiedAccount.QuotaBalance).toFixed(decimalPlaces)) {
                    deductInfo.AmountDeducted = amount
                    amount = 0
                    updateAccount.GroupID = ObjectId.createFromHexString(identifiedAccount.GroupID)
                    updateAccount.QuotaBalance = 0
                    isDeducted = true
                    newGroupArray.push(updateAccount)

                } else if (amount < identifiedAccount.QuotaBalance) {
                    // deduct amount and end the loop
                    deductInfo.AmountDeducted = amount
                    updateAccount.GroupID = ObjectId.createFromHexString(identifiedAccount.GroupID)
                    updateAccount.QuotaBalance = parseFloat((identifiedAccount.QuotaBalance - amount).toFixed(decimalPlaces))
                    isDeducted = true
                    amount = 0
                    newGroupArray.push(updateAccount)
                }
                if (isDeducted){
                    deductInfo.GroupID = ObjectId.createFromHexString(identifiedAccount.GroupID)
                    deductInfo.AccountName = associatedGroupsData.GroupName
                    deductInfo.Pages = parseFloat(((event.Print.TotalPages * deductInfo.AmountDeducted) / event.Print.TotalCost).toFixed(decimalPlaces))
                    deductInfo.AmountDeducted = parseFloat(deductInfo.AmountDeducted)
                    deductBalance.push(deductInfo)
                }
            } else if (amount !== 0 && account.toString().toLowerCase() === 'debit') {
                let debitDeducted = { GroupID: null, AccountName: 'Debit', Pages: 0}
                if (parseFloat(amount) > parseFloat(balance)){
                    debitDeducted.AmountDeducted = balance
                    amount = (amount - balance).toFixed(decimalPlaces)
                    balance = 0
                } else if (amount === balance) {
                    debitDeducted.AmountDeducted = amount
                    amount = 0
                    balance = 0
                } else if (parseFloat(amount) < parseFloat(balance)) {
                    balance = (balance - amount).toFixed(decimalPlaces)
                    debitDeducted.AmountDeducted = amount
                    amount = 0
                }
                debitDeducted.Pages = parseFloat(((event.Print.TotalPages * debitDeducted.AmountDeducted) / event.Print.TotalCost).toFixed(decimalPlaces))
                if (debitDeducted.AmountDeducted !== 0) {
                    deductBalance.push(debitDeducted)
                }
            }
        }
        if(amount !== 0){
            return {
                message: 'Insufficient balance',
                statusCode: false
            }
        }  else {
            log.info("deductBalance ****: ", deductBalance)
            log.info("remaining debit balance ****: ", balance)
            const updateQuery = {
              Username: userName,
              CustomerID: ObjectId.createFromHexString(customerId),
              IsDeleted: false,
            };

            const updatePipeline = [];

            deductBalance.forEach((deduction, index) => {
              if (deduction.GroupID) {
                updatePipeline.push({
                  $set: {
                    GroupQuotas: {
                      $map: {
                        input: "$GroupQuotas",
                        as: "quota",
                        in: {
                          $cond: [
                            {
                              $eq: ["$$quota.GroupID", ObjectId.createFromHexString(deduction.GroupID)],
                            },
                            {
                              $mergeObjects: [
                                "$$quota",
                                {
                                  QuotaBalance: {
                                    $round: [
                                      {
                                        $add: ["$$quota.QuotaBalance", -deduction.AmountDeducted],
                                      },
                                      decimalPlaces,
                                    ],
                                  },
                                },
                              ],
                            },
                            "$$quota",
                          ],
                        },
                      },
                    },
                  },
                });
              } else {
                updatePipeline.push({
                  $set: {
                    DebitBalance: {
                      $round: [{ $add: ["$DebitBalance", -deduction.AmountDeducted] }, decimalPlaces],
                    },
                  },
                });
              }
            });

            log.info("updatePipeline ****: ", JSON.stringify(updatePipeline));

            await db.collection("Users").updateOne(updateQuery, updatePipeline);

            return {deductInfo: deductBalance, statusCode: true}
        }
    } catch (error) {
        console.log("error while deductBalanceFromUsersAccount: ",error);
        log.error(error);
        return {message: 'balance failed to deduct', statusCode: false}
    }
}