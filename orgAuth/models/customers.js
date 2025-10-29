// // Customers Model
const Customers = {}

Customers.findCustomerByDomainName = async (db, domainName) => {
  try {
    return await db.collection('Customers').findOne({ DomainName: domainName, IsActive: true, IsDeleted: false })
  } catch (err) {
    throw new Error(err)
  }
}
module.exports = Customers
