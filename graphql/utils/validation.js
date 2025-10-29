const { GraphQLError } = require('graphql')
const { UNAUTHORIZED} = require('../helpers/error-messages')
module.exports.validateUsageInput = (
  type, transactionDate, customer
) => {
  const errors = {}
  if (customer.trim() === '') {
    errors.customer = 'Customer cannot be empty'
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1
  }
}
//customer id mei all allowed customer id ayengi and in customerIds mei jo user ne filter ke liye bheji hai
module.exports.customerSecurity = async (tenantDomain, customerId, customerIds, context) => {
  let allowedIds = context.data.customerIdsStrings
  if (tenantDomain !== 'admin') {
    if(!customerIds.every(v => allowedIds.includes(v))){
      throw new GraphQLError(UNAUTHORIZED, {
        extensions: {
          code: '403'
        }
      })
    } else {
      if (customerId && customerId.length === 1 && customerIds.includes(customerId[0].toString())) {
        console.log('Not adding any Id as id is already present')
      } else if (context.data.user.IsPartner && customerIds.length === 1) {
        const customerIdString = customerId.map(cus => cus.toString())
        if (customerIdString.indexOf(customerIds[0]) === -1) {
          throw new GraphQLError(UNAUTHORIZED, {
            extensions: {
              code: '403'
            }
          })
        } else {
          console.log('Not adding any Id as user is partner')
        }
      } else {
        customerIds = customerIds.concat(customerId)
        return customerIds
      }
    }
  }
}
