module.exports = {
    getBillingServices: {
      operationName: "GetBillingServices",
      query: `query GetBillingServices($paginationInput: PaginationData) {
            getBillingServices(paginationInput: $paginationInput) {
            services {
                _id
                ServiceID
                ServiceName
                CreatedAt
                IsDeleted
            }
            total
            }
        }`,
      variables: {
        "paginationInput": {
          "pageNumber": 1,
          "limit": 10,
        }
      },
    },
  };
  