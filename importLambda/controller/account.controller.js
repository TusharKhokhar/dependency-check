const { addCreateTimeStamp } = require("../utils");
const { getDb } = require("../config/db");

const validateAndInsertAccount = async (accountInput, customerId) => {
    try {
        const  {
            AccountId,
            Description, 
            AccountName,
            Tags
        } = accountInput
        if (!AccountId) throw new Error('Missing required fields');
        const db = await getDb();
        let validateAccount = await db.collection('Accounts').findOne({
            AccountId: AccountId, CustomerID: customerId, IsDeleted: false
        })
        if (validateAccount) throw new Error('Account already exists');
        let newAccount = {
            AccountId, Description, AccountName, CustomerID: customerId, IsDeleted: false, IsActive: true, Tags: Tags && Tags!== '' ? Tags?.split(',') : []
        }
        newAccount = await addCreateTimeStamp(newAccount);
        newAccount.IsBulkImport = true;
        const { insertedId } = await db.collection('Accounts').insertOne(newAccount);
        return newAccount;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

module.exports = { validateAndInsertAccount }
