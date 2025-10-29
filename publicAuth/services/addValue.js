const { getObjectId: ObjectId } = require("../helpers/objectIdConvertion")

const getUtcTime = () => {
    let utc = new Date(new Date().toUTCString());
    return utc;
};

module.exports.addValue = async (data, db, customer, thing) => {
    try {
        let user = await db.collection('Users').findOne({
            _id: ObjectId.createFromHexString(data?.UserID),
            CustomerID: ObjectId.createFromHexString(data?.CustomerID),
            Username: data?.Username,
            IsDeleted: false,
            IsActive: true
        })
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
        await db.collection('Users')?.updateOne({
            _id: ObjectId.createFromHexString(data?.UserID),
            CustomerID: ObjectId.createFromHexString(data?.CustomerID), 
            Username: data?.Username, 
            IsDeleted: false,
            IsActive: true
        }, [{
              $set: {
                DebitBalance: { $round: [{ $add: ["$DebitBalance", parseFloat(data?.Amount)] }, decimalPlaces]},
              },
            },
        ])

        const debitBalance = user?.DebitBalance ? user?.DebitBalance : 0.0
        const amount = data?.Amount ? data?.Amount : 0.0

        await db.collection('Usage').insertOne({
            Type: 'add_value',
            TransactionDate: getUtcTime(),
            TransactionStartTime: data?.TransactionStartTime,
            TransactionEndTime: data?.TransactionEndTime,
            TransactionID: data?.TransactionID,
            Customer: customer.CustomerName,
            CustomerID: data?.CustomerID,
            FullName: data?.Name,
            EmailAddress: data?.Email,
            AddValue: {
                ValueAddedBy: 'Self',
                ValueAdded: true,
                ValueAddedByID: user?._id,
                SelfAdded: true,
                ThingID: thing ? thing?._id : null,
                ThingName: thing ? thing?.ThingName : null,
                ValueAddedMethod: data?.ValueAddedMethod,
                PaymentMethod: data?.PaymentMethod,
                AddValueAmount: parseFloat(data?.Amount),
                StartingBalance: parseFloat(Number(debitBalance).toFixed(2)),
                UpdatedBalance: parseFloat((Number(debitBalance) + Number(amount)).toFixed(2)),
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