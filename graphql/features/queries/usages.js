module.exports = {
  dashboard: {
    query: `query Dashboard($timeZone: String) {
                dashboard(timeZone: $timeZone) {
                    DayWiseData {
                        date
                        count
                    }
                    DeliveryWiseData {
                        driver {
                            count
                        }
                        web {
                            count
                        }
                        mobile {
                            count
                        }
                        desktop {
                            count
                        }
                        kiosk {
                            count
                        }
                        email {
                            count
                        }
                    }
                    DeliveryByDateWiseData {
                        web {
                            date
                            count
                        }
                        mobile {
                            date
                            count
                        }
                        desktop {
                            date
                            count
                        }
                        kiosk {
                            date
                            count
                        }
                        email {
                            date
                            count
                        }
                        driver {
                            date
                            count
                        }
                    }
                }
            }`,
    variables: {
        timeZone: "Asia/Kolkata",
    },
    operationName: "Dashboard",
  },
  getUsagesWithTransactionTypeFilters: {
    query: `query GetUsages($filters: FilterUsage, $customerIds: [ID], $paginationInput: PaginationData) {
      getUsages(filters: $filters, customerIds: $customerIds, paginationInput: $paginationInput) {
        total
        usage {
          AddValue {
            AddToBalance
            AddValueAmount
            SelfAdded
            ThingID
            ThingName
            UpdatedBalance
            ValueAdded
            ValueAddedBy
            ValueAddedByID
            ValueAddedFrom
            ValueAddedMethod
          }
          Print {
            DocumentName
            TotalPages
            TotalCost
            SystemFileName
            Staple
            ReleaseCode
            PaymentType
            PaperSize
            Orientation
            JobType
            JobDeliveryMethod
            Duplex
            DeviceID
            Device
            ColorType
            ColorPages
            ColorCost
            DocumentSize
            GrayscalePages
            GrayscaleCost
          }
          Customer
          CustomerID
          EmailAddress
          TransactionDate
          TransactionEndTime
          TransactionID
          TransactionStartTime
          Type
          UserID
          UserType
          Username
          _id
        }
      }
    }`,
    variables: {
      customerIds: "",
      filters: {
        transactionType: "",
        reportType: "",
        userName: "testUser",
      },
      paginationInput: {},
    },
    operationName: "GetUsages",
  },
};
