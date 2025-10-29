module.exports = {
    getDropdowns: {
      operationName: "GetDropdowns",
      query: `query GetDropdowns {
            getDropdowns {
                _id
                ThirdPartySoftwareType
                DeviceType
                ThingType
                PaperSize
                ThingTypeUpdateSupport
                TermsOfService
                AuditLogsType {
                    title
                    value
                }
                }
        }`,
      variables: {}
    },
};
  