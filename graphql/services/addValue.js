const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const { v4: uuidv4 } = require('uuid');

const getUtcTime = () => {
    let utc = new Date(new Date().toUTCString());
    return utc;
};

module.exports.addValue = async (data, db, customer, thing, loggerInUser) => {
    try {
        let usageAmount = 0
        let startBalance = 0
        let updatedBalance = 0
        const { GlobalDecimalSetting } = await db
          .collection("CustomizationTexts")
          .findOne(
            {
              CustomerID: ObjectId.createFromHexString(data?.CustomerID),
              IsDeleted: false,
              IsActive: true,
            },
            { projection: { GlobalDecimalSetting: 1 } }
          );
        const decimalPlaces = GlobalDecimalSetting ? GlobalDecimalSetting : 2;
        let user = await db.collection('Users').findOne({
            _id: ObjectId.createFromHexString(data?.UserID),
            CustomerID: ObjectId.createFromHexString(data?.CustomerID),
            Username: data?.Username,
            IsDeleted: false,
            IsActive: true
        })
        if (data.Type === 'QUOTA') {
            user?.GroupQuotas?.forEach(group => {
                if (group.GroupID.toString() === data.AccountID.toString()) {
                    startBalance = group.QuotaBalance
                    updatedBalance = parseFloat((Number(group.QuotaBalance) + Number(data?.Amount)).toFixed(2))
                    usageAmount = parseFloat(data?.Amount)
                }
            })
        }
        data.Type === 'DEBIT' ? await db.collection('Users')?.updateOne({
            _id: ObjectId.createFromHexString(data?.UserID),
            CustomerID: ObjectId.createFromHexString(data?.CustomerID),
            Username: data?.Username,
            IsDeleted: false,
            IsActive: true
        },[{
            $set: {
                DebitBalance: { $round: [{ $add: ['$DebitBalance', parseFloat(data?.Amount)] }, decimalPlaces ]}
            }
          }
        ]) :
          await db.collection('Users').updateOne({
                _id: ObjectId.createFromHexString(data?.UserID),
                CustomerID: ObjectId.createFromHexString(data?.CustomerID), IsDeleted: false,
                'GroupQuotas.GroupID': ObjectId.createFromHexString(data.AccountID)},
            {$set: {'GroupQuotas.$.QuotaBalance': updatedBalance}})

        const debitBalance = user?.DebitBalance ? user?.DebitBalance : 0.0
        const amount = data?.Amount ? data?.Amount : 0.0

        await db.collection('Usage').insertOne({
            Type: 'add_value',
            TransactionDate: getUtcTime(),
            TransactionStartTime: getUtcTime(),
            TransactionEndTime: getUtcTime(),
            TransactionID: uuidv4(),
            Customer: customer.CustomerName,
            CustomerID: data?.CustomerID,
            FullName: data?.Name,
            EmailAddress: user?.PrimaryEmail,
            AddValue: {
                ValueAddedBy: loggerInUser?.Username,
                ValueAdded: true,
                ValueAddedByID: ObjectId.createFromHexString(loggerInUser?._id),
                SelfAdded: false,
                AccountID: data?.AccountID !== 'debit' ? ObjectId.createFromHexString(data.AccountID) : 'debit',
                ThingID: thing ? thing?._id : null,
                ThingName: thing ? thing?.ThingName : null,
                ValueAddedMethod: 'internal',
                PaymentMethod: 'internal',
                Comment : data.Comment,
                AddValueAmount: parseFloat(data?.Amount),
                StartingBalance: data?.AccountID !== 'debit' ? startBalance : parseFloat(Number(debitBalance).toFixed(2)),
                UpdatedBalance: data?.AccountID !== 'debit' ? updatedBalance : parseFloat((Number(debitBalance) + Number(amount)).toFixed(2)),
            },
            Username: data?.Username,
            UserID: user?._id,
            createdAt: getUtcTime(),
            updatedAt: getUtcTime(),
            IsDeleted: false
        })
    } catch (e) {
        console.log(e)
        throw new Error(e)
    }
}