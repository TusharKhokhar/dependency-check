const Promise = require("bluebird");
const { getObjectId: ObjectId } = require('../helpers/objectIdConverter');
const { escapeRegex, normalizeValue } = require("../helpers/util");
const Usage = {}

Usage.getUsageInformation = ({sort, pageNumber, limit, sortKey, customerIds,
                                 collection, filters }) => {
    return new Promise((resolve, reject) => {
        const condition = { IsDeleted: false }
        sort = sort === 'dsc' ? -1 : 1
        sortKey = sortKey || 'UpdatedAt'
        const skips = limit * (pageNumber - 1)
        if (customerIds && customerIds.length > 0) {
            customerIds = customerIds.map(custId => {
                return ObjectId.createFromHexString(custId)
            })
            Object.assign(condition, { CustomerID: { $in: customerIds } })
        }
        if (filters.dateTo && filters.dateFrom) {
            Object.assign(condition, {TransactionDate: {"$gte": filters.dateFrom, "$lte": filters.dateTo}})
        }
        if (filters.reportType) {
            Object.assign(condition, {Type: filters.reportType})
        }
        if (filters.device && filters.device.length > 0) {
            filters.device = filters.device.map(de => ObjectId.createFromHexString(de))
            Object.assign(condition, {
                'Print.DeviceID': {$in: filters.device}
            })
        }
        if (filters.documentName && filters.documentName.length > 0) {
          filters.documentName = filters.documentName.map((name) => ({
            "Print.DocumentName": new RegExp(escapeRegex(name), "i"),
          }));
          Object.assign(condition, { $or: filters.documentName });
        }
        if (filters.userName) {
            Object.assign(condition, {'Username': filters.userName })
        }
        if (filters.customerIds && filters.customerIds.length > 0) {
            filters.customerIds = filters.customerIds.map(loc => ObjectId.createFromHexString(loc))
            Object.assign(condition, {CustomerID: {"$in": filters.customerIds}})
        }
        if (filters.duplex && filters.duplex.length > 0) {
            Object.assign(condition, {'Print.Duplex': {"$in": filters.duplex}})
        }
        if (filters.colorType && filters.colorType.length > 0) {
            filters.colorType = filters.colorType.map(color => normalizeValue(color))
            Object.assign(condition, {'Print.ColorType': {"$in": filters.colorType}})
        }
        if (filters.documentType && filters.documentType.length > 0 && filters.reportType !== 'print') {
            Object.assign(condition, {'Print.DocumentType': {"$in": filters.documentType}})
        }
        if (filters.documentType && filters.documentType.length > 0 && filters.reportType === 'print') {
            filters.documentType = filters.documentType.map(document => normalizeValue(document))
            Object.assign(condition, {'Print.PaperSize': {"$in": filters.documentType}})
        }
        if (filters.transactionBy) {
          Object.assign(condition, {
            $or: [
              {
                "AddValue.ValueAddedBy": new RegExp(escapeRegex(filters.transactionBy), "i"),
              },
              { Username: new RegExp(escapeRegex(filters.transactionBy), "i") },
            ],
          });
        }
        if (filters.amount) {
            Object.assign(condition, {'AddValue.AddValueAmount':  filters.amount})
        }
        if (filters.balanceAfter) {
            Object.assign(condition, {'AddValue.UpdatedBalance':  filters.balanceAfter})
        }
        if (filters.transactionType && filters.transactionType.length > 0) {
            filters.transactionType = filters.transactionType.map((item) =>
              item === "credit_card" ? normalizeValue("Credit Card") : item
            );
            Object.assign(condition, {'AddValue.ValueAddedMethod':  {$in: filters.transactionType}})
        }
        const query = [
            {
                $match: condition
            }
        ]
        let totalQuery = query
        totalQuery = totalQuery.concat({ $count: 'total' })
        Promise.props({
            usage: pageNumber && limit ? collection.aggregate(query, { collation: { locale: 'en' } })
              .sort({ [sortKey]: sort })
              .skip(skips)
              .limit(limit).toArray() : collection.aggregate(query, { collation: { locale: 'en' } })
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

// Export EasyBookingUsage model
module.exports = Usage
