const generateAddUsage = (releaseCode, systemFileName, orientation, customerId) => ({
  query: `mutation addUsage($addUsageInput: UsageInput) {
            addUsage(addUsageInput: $addUsageInput) {
              BillingAccountId,
              BillingAccountName,
              Print {
                TotalCost
                Orientation
              }
            }
          }`,
  variables: {
    addUsageInput: {
      Customer: null,
      CustomerID: customerId,
      DeductBalance: null,
      Location: null,
      LocationID: null,
      ReleaseCode: releaseCode,
      Thing: null,
      ThingID: null,
      TimeZone: null,
      TransactionDate: new Date(),
      TransactionEndTime: new Date(),
      TransactionID: null,
      TransactionStartTime: new Date(),
      Type: "print",
      Username: null,
      BillingAccountId: "12345",
      BillingAccountName: "Test Account",
      Print: {
        ColorCost: 0,
        ColorPages: 1,
        ColorType: "Color",
        Copies: 1,
        Device: null,
        DeviceID: null,
        DocumentName: "1234.pdf",
        DocumentSize: 223,
        Duplex: false,
        GrayscaleCost: 0,
        GrayscalePages: 1,
        JobDeliveryMethod: null,
        JobPrinted: true,
        JobType: null,
        PaperSize: "A4",
        PaymentBy: null,
        PrintJobSubmitted: null,
        ReleaseCode: releaseCode,
        SystemFileName: systemFileName,
        TotalCost: 0,
        TotalPages: 2,
        PaymentType: "free",
        Orientation: orientation,  // The orientation is now dynamic
      },
    },
  },
  operationName: "addUsage",
});

const addUsage = generateAddUsage("12345678", "systemfilename.pdf", "Landscape");
const orientationUnset = generateAddUsage("12345679", "systemfilename1.pdf", null);
const orientationSetAsSaved = generateAddUsage("12345679", "systemfilename1.pdf", "AsSaved");

module.exports = { addUsage, orientationUnset, orientationSetAsSaved };
