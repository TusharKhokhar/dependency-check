module.exports = {
  getSubCustomers: {
    query: `query GetSubCustomers($customerId: ID, $paginationInput: PaginationData) {
      getSubCustomers(customerId: $customerId, paginationInput: $paginationInput) {
        total
        customer {
          CustomerName
          CustomerType
          DisplayName
          DomainName
          IsActive
          Partner
          IsApproved
          LocationCount
        }
      }
    }`,
    variables: {
      paginationInput: {
        pattern: "test",
      },
      customerId: "test",
    },
    operationName: "GetSubCustomers"
  },
};
