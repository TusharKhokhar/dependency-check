const { getObjectId: ObjectId } = require('../helpers/objectIdConverter')
const Promise = require('bluebird')
const { getUtcTime } = require('../helpers/util');
const CustomLogger = require("../helpers/customLogger");
const log = new CustomLogger();

const Payments = {}

/**
 * Method to get all paymentInformation
 */

Payments.getPaymentInformation = ({
  status, pattern, sort, pageNumber,
  limit, sortKey, customerIds, collection
}) => {
  return new Promise((resolve, reject) => {
    const condition = { IsDeleted: false }
    const searchCondition = {}
    sort = sort === 'dsc' ? -1 : 1
    sortKey = sortKey || 'PaymentName'
    const skips = limit * (pageNumber - 1)
    if (customerIds && customerIds.length > 0) {
      customerIds = customerIds.map(custId => {
        return ObjectId.createFromHexString(custId)
      })
      Object.assign(condition, { CustomerID: { $in: customerIds } })
    }
    if (pattern) {
      Object.assign(searchCondition, {
        $or: [
          { PaymentName: new RegExp(pattern, 'i') },
          { Tags: new RegExp(pattern, 'i') },
          { 'CustomerData.CustomerName': new RegExp(pattern, 'i') },
          { PaymentType: new RegExp(pattern, 'i') }
        ]
      })
    }
    if (status) {
      status = status === 'true'
      Object.assign(condition, { IsActive: status })
    }
    const query = [
      {
        $match: condition
      },
      {
        $lookup: {
          from: 'Customers',
          localField: 'CustomerID',
          foreignField: '_id',
          pipeline: [
            { $project: { _id: 1, CustomerName: 1 } }
          ],
          as: 'CustomerData'
        }
      },
      {
        $unwind: {
          path: '$CustomerData',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $match: searchCondition
      }
    ]
    let totalQuery = query
    totalQuery = totalQuery.concat({ $count: 'total' })
    Promise.props({
      payment: pageNumber && limit
        ? collection.aggregate(query, { collation: { locale: 'en' } })
          .sort({ [sortKey]: sort })
          .skip(skips)
          .limit(limit).toArray()
        : collection.aggregate(query, { collation: { locale: 'en' } })
          .sort({ [sortKey]: sort }).toArray(),
      total: collection.aggregate(totalQuery).toArray()
    }).then(results => {
      results.total = results.total[0] &&
            results.total[0].total
        ? results.total[0].total
        : 0
      resolve(results)
    }).catch(err => {
      console.log(err)
      reject(err)
    })
  })
}

Payments.createPaymentStatus = async (db, paymentStatusData) => {
  try {
    const {
      customerId,
      txId,
      amount,
      status,
      paymentType,
      terminalId,
      device,
      thingId,
    } = paymentStatusData;
    await db.collection("PaymentStats").insertOne({
      CustomerID: ObjectId.createFromHexString(customerId),
      TransactionID: txId,
      Amount: amount,
      Status: status,
      PaymentMethod: paymentType,
      TerminalID: terminalId ? terminalId : null,
      TransactionStartTime: new Date(getUtcTime()),
      Device: device,
      ThingID: ObjectId.createFromHexString(thingId),
      ValueAddedMethod: "Credit Card",
      IsActive: true,
      IsDeleted: false,
    });
  } catch (error) {
    log.info("Error in createPaymentStatus ******", error);
    throw error;
  }
};
// Export Payment model
module.exports = Payments
