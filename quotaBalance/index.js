const {getDb, switchDb} = require("./config/db");
const moment = require('moment')

module.exports.handler = async (req, res) => {
    // database connect
    try {
        let date = new Date();
        let now_utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
            date.getUTCDate(), date.getUTCHours(),
            date.getUTCMinutes(), date.getUTCSeconds());
        const db = await getDb()
        const premiumCustomers = await db.collection('Customers').find({Tier: 'premium', IsDeleted: false, IsActive: true}).toArray()
        if(premiumCustomers){
            await runQuotaBalance(db, now_utc)
            for(let customerPre of premiumCustomers){
                const premData = await switchDb(customerPre.DomainName)
                await runQuotaBalance(premData, now_utc)
            }
        } else {
        await runQuotaBalance(db, now_utc)
        }
    } catch (e) {
        console.log(e);
    }
}

/**
 * CurrentBalance > MaxBalance - Amount
 *
 * @param db
 * @param currentTime
 * @returns {Promise<void>}
 */

const runQuotaBalance  = async (db, currentTime) => {
    let currentDate = moment(currentTime).format('D');
    let currentDay = moment(currentTime).format('dddd');
    let currentDateFormat = moment(currentTime).format('YYYY-MM-DD');
    let groups = await db.collection('Groups').find({IsDeleted: false, IsActive: true, GroupType: 'Quota Balance', 'QuotaBalance.Scheduled': true, $or: [{
            'QuotaBalance.Day': {$in: [currentDay.toLowerCase(), currentDay,  currentDate.toString()]}},
            {'QuotaBalance.Frequency': 'Daily'}
        ]
    }).toArray()
    const dateWiseGroup = await db.collection('Groups').find({IsDeleted: false, IsActive: true, GroupType: 'Quota' +
          ' Balance', 'QuotaBalance.Scheduled': true,
        'QuotaBalance.Dates': currentDateFormat
    }).toArray()
    if (dateWiseGroup?.length > 0) {
        groups = groups?.concat(dateWiseGroup)
    }
    for(let group of groups) {
        let balanceToBeAssigned = group.QuotaBalance.Amount
        let maxBalance = group.QuotaBalance.MaxBalance
        await updateUsersBalance(balanceToBeAssigned, maxBalance, db, group._id, group.CustomerID)
        await auditLogs(db, group)
    }
}

const updateUsersBalance = async (balanceToBeAssigned, maxBalance, db, groupId, customerId) => {
    const usersFound = await db.collection('Users').count({IsDeleted: false, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId})
    console.log(usersFound)
    let batchSize = 900
    let batchNumber = 1
    let skip = 0
    let updateDone = false
    if (usersFound === 0) {
        return
    }
    if (usersFound > 900) {
        while(updateDone){
            batchNumber = batchNumber + 1
            skip = batchNumber + skip
            let users = await fetchUsersInBatches(balanceToBeAssigned, maxBalance, db, groupId, customerId, skip, batchSize)
            updateDone = !users
            await db.collection('Users').updateMany({IsDeleted: false, _id: {$in: users.updateUserNormally}, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId,  }, {$inc: {'GroupQuotas.$.QuotaBalance': balanceToBeAssigned}}, {multi: true})
            await db.collection('Users').updateMany({IsDeleted: false, _id: {$in: users.setUsersBalanceToMax}, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId,  }, {$set: {'GroupQuotas.$.QuotaBalance': maxBalance}}, {multi: true})
        }
    } else {
        let users = await fetchUsersInBatches(balanceToBeAssigned, maxBalance, db, groupId, customerId, skip, batchSize)
        await db.collection('Users').updateMany({IsDeleted: false, _id: {$in: users.updateUserNormally}, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId,  }, {$inc: {'GroupQuotas.$.QuotaBalance': balanceToBeAssigned}}, {multi: true})
        await db.collection('Users').updateMany({IsDeleted: false, _id: {$in: users.setUsersBalanceToMax}, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId,  }, {$set: {'GroupQuotas.$.QuotaBalance': maxBalance}}, {multi: true})
    }
}

const auditLogs = async (db, group) => {
    const date = new Date()
    const nowUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
      date.getUTCDate(), date.getUTCHours(),
      date.getUTCMinutes(), date.getUTCSeconds())
    const currentDate = new Date(new Date(nowUtc).getTime())
    let record = {
        Type: 'QuotaBalance',
        Date: currentDate,
        CustomerID: group.CustomerID,
        QuotaGroupID: group._id,
        QuotaGroupName: group.GroupName
    }
    await db.collection('AuditLogs').insertOne(record)
}

const fetchUsersInBatches = async (balanceToBeAssigned, maxBalance, db, groupId, customerId, skip, limit) => {
    const usersFound = await db.collection('Users').find({IsDeleted: false, CustomerID: customerId,  IsActive: true, 'GroupQuotas.GroupID': groupId})
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit).toArray()
    if(usersFound.length === 0){
        return false
    } else {
        let updateUserNormally = []
        let setUsersBalanceToMax = []
        for (let us of usersFound) {
            us.GroupQuotas.forEach(group => {
                console.log((group.QuotaBalance + balanceToBeAssigned) <= maxBalance);
                if (group.GroupID.toString() === groupId.toString() && group.QuotaBalance < maxBalance && ((group.QuotaBalance + balanceToBeAssigned) <= maxBalance)){
                    updateUserNormally.push(us._id)
                } else if (group.GroupID.toString() === groupId.toString() && group.QuotaBalance < maxBalance && group.QuotaBalance < maxBalance){
                    setUsersBalanceToMax.push(us._id)
                }
            })
        }
        return {updateUserNormally, setUsersBalanceToMax}
    }
}