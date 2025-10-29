const { Given, When, Then, After, Before } = require("@cucumber/cucumber");
const sinon = require("sinon");
const log = require("../../helpers/customLogger");
const dbHandler = require("../../config/db");
const apiHelpers = require("../../services/api-handler");
const credentialGenerator = require("../../helpers/credentialGenerator");
const iot = require("../../services/iot-handler");
const { getObjectId: ObjectId } = require("../../helpers/objectIdConvertion");
const { expect } = require("chai");
const {
  getStaticCustomizationTexts,
} = require("../../../memoryDb/customizationText");

let req = {},
  res = {},
  send,
  status;
let handler;
let customersCollectionMock,
  publicUploadsCollectionMock,
  devicesCollectionMock,
  thingsCollectionMock,
  groupsCollectionMock,
  usersCollectionMock,
  jobListsCollectionMock;

const jobList = [
  {
    Copies: 1,
    Color: "Grayscale",
    Duplex: false,
    PaperSize: "A4",
    Orientation: "AsSaved",
    TotalPagesPerFile: 1,
    PageRange: "1-1",
    OriginalFileNameWithExt: "sample.pdf",
    NewFileNameWithExt: "6ed26274-dbe6-4a00-bd2b-ff4755894c04.pdf",
    UploadStatus: true,
    Platform:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
    IsDeleted: false,
    IsPrinted: false,
    PrintCounter: 0,
    App: "",
    Staple: "StapleTopLeft",
    UploadedFrom: "web",
  },
];

const customerId = "633c4f831d56a2724c9b58d2";
const thingName = "TestThing";
const deviceName = "canon";
const locationId = "633c4f831d56a2724c9b58d1";
const deviceId = "633c4f831d56a2724c9b58d3";

Before(() => {
  // Reset call history for all collection mocks
  sinon.resetHistory();
  if (dbHandler.getDb.restore) {
    dbHandler.getDb.restore();
  }
});

Given("a valid job update request is prepared for standard customer", () => {
  req = {
    body: {
      fileName: "sample.pdf",
      customerId: customerId,
    },
  };

  // Stub response methods
  send = sinon.spy();
  status = sinon.stub().returnsThis();
  res = { status, send };

  // Stub logging
  sinon.stub(log.prototype, "lambdaSetup");
  sinon.stub(log.prototype, "info");
  sinon.stub(log.prototype, "error");

  sinon
    .stub(apiHelpers, "setSuccessResponse")
    .callsFake((data, resObj) => resObj.send({ ...data, status: 1 }));

  const realSetErrorResponse = apiHelpers.setErrorResponse;
  sinon
    .stub(apiHelpers, "setErrorResponse")
    .callsFake((serverError, error, res, req) => {
      return realSetErrorResponse(serverError, error, res, req);
    });

  // Collection mocks
  customersCollectionMock = {
    findOne: sinon.stub().resolves({
      _id: ObjectId.createFromHexString(customerId),
      DomainName: "org1",
      Tier: "standard",
    }),
  };

  publicUploadsCollectionMock = {
    findOneAndUpdate: sinon.stub().resolves({
      value: {
        _id: ObjectId.createFromHexString(customerId),
        IsProcessedFileName: [
          { FileName: req.body.fileName, IsProcessed: false },
        ],
        JobList: jobList,
      },
    }),
    updateOne: sinon.stub().resolves(),
  };

  devicesCollectionMock = {
    findOne: sinon.stub().resolves(null),
    find: sinon.stub().returns({
      toArray: sinon.stub().resolves([]),
    }),
  };

  thingsCollectionMock = {
    findOne: sinon.stub().resolves(null),
  };

  groupsCollectionMock = {
    findOne: sinon.stub().resolves(null),
  };

  usersCollectionMock = {
    findOne: sinon.stub().resolves(null),
  };

  jobListsCollectionMock = {
    findOne: sinon.stub().resolves(null),
  };

  customizationTextsMock = {
    findOne: sinon.stub().resolves(getStaticCustomizationTexts()),
  };

  // DB stub that returns appropriate mocks by collection name
  const dbMock = {
    collection: sinon.stub().callsFake((collectionName) => {
      switch (collectionName) {
        case "Customers":
          return customersCollectionMock;
        case "PublicUploads":
          return publicUploadsCollectionMock;
        case "Devices":
          return devicesCollectionMock;
        case "Things":
          return thingsCollectionMock;
        case "Groups":
          return groupsCollectionMock;
        case "Users":
          return usersCollectionMock;
        case "JobLists":
          return jobListsCollectionMock;
        case "CustomizationTexts":
          return customizationTextsMock;
        default:
          return {
            findOne: sinon.stub().resolves(null),
          };
      }
    }),
  };

  sinon.stub(dbHandler, "getDb").returns(dbMock);

  sinon.stub(credentialGenerator, "getStsCredentials").resolves({
    Credentials: {
      AccessKeyId: "access-key",
      SecretAccessKey: "secret-key",
      SessionToken: "session-token",
    },
  });

  sinon.stub(iot, "retrieveEndpoint").resolves("iot:endpoint");
  sinon.stub(iot, "publishToTopic").resolves();
  // sinon.stub(utils, "deviceHistoryForPrinting").resolves();

  customersCollectionMock.findOne.resolves({
    _id: customerId,
    DomainName: "org1",
    Tier: "standard",
  });

  handler = require("../../controllers/upload.controller");
});

Given("the job has not all files processed", () => {});

When("the updateJob API is invoked", async () => {
  try {
    await handler.updateJob(req, res);
  } catch (e) {
    console.error("Error in updateJob API:", e);
  }
});

Given("all jobs are processed and automatic print delivery is disabled", () => {
  publicUploadsCollectionMock.findOneAndUpdate.resolves({
    value: {
      _id: ObjectId.createFromHexString(customerId),
      IsProcessedFileName: [{ FileName: req.body.fileName, IsProcessed: true }],
      JobList: jobList,
      AutomaticPrintDelivery: false,
    },
  });
});

Given("only device is selected with no location", () => {
  publicUploadsCollectionMock.findOneAndUpdate.resolves({
    value: {
      _id: ObjectId.createFromHexString(customerId),
      IsProcessedFileName: [{ FileName: req.body.fileName, IsProcessed: true }],
      JobList: jobList,
      AutomaticPrintDelivery: true,
      DeviceID: ObjectId.createFromHexString(),
      DeviceName: deviceName,
    },
  });
  thingsCollectionMock.findOne.resolves({
    PrimaryRegion: { ThingName: thingName },
  });
  devicesCollectionMock.findOne.resolves({
    _id: ObjectId.createFromHexString(),
    LocationID: ObjectId.createFromHexString(locationId),
  });
});

Given("device and location both are selected", () => {
  publicUploadsCollectionMock.findOneAndUpdate.resolves({
    value: {
      _id: ObjectId.createFromHexString(customerId),
      IsProcessedFileName: [{ FileName: req.body.fileName, IsProcessed: true }],
      JobList: jobList,
      AutomaticPrintDelivery: true,
      DeviceID: ObjectId.createFromHexString(),
      DeviceName: deviceName,
      LocationID: ObjectId.createFromHexString(locationId),
    },
  });
  thingsCollectionMock.findOne.resolves({
    PrimaryRegion: { ThingName: thingName },
  });
});

Given(
  "only location is selected and PDS is found and only one device attached with thing",
  () => {
    publicUploadsCollectionMock.findOneAndUpdate.resolves({
      value: {
        _id: ObjectId.createFromHexString(customerId),
        IsProcessedFileName: [
          { FileName: req.body.fileName, IsProcessed: true },
        ],
        JobList: jobList,
        AutomaticPrintDelivery: true,
        LocationID: ObjectId.createFromHexString(locationId),
      },
    });
    thingsCollectionMock.findOne.onFirstCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: false,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [ObjectId.createFromHexString()],
    });
    devicesCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(),
      ThingId: ObjectId.createFromHexString(),
      Device: deviceName,
    });
  }
);

Given(
  "only location is selected and PDS is found and more than one device attached with thing and smart Printing enabled",
  () => {
    publicUploadsCollectionMock.findOneAndUpdate.resolves({
      value: {
        _id: ObjectId.createFromHexString(customerId),
        IsProcessedFileName: [
          { FileName: req.body.fileName, IsProcessed: true },
        ],
        JobList: jobList,
        AutomaticPrintDelivery: true,
        LocationID: ObjectId.createFromHexString(locationId),
      },
    });
    thingsCollectionMock.findOne.onFirstCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: true,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [
        ObjectId.createFromHexString(),
        ObjectId.createFromHexString(),
      ],
    });
    devicesCollectionMock.find().toArray.resolves([
      {
        _id: ObjectId.createFromHexString(),
        ThingId: ObjectId.createFromHexString(),
        Device: deviceName,
        ColorEnabled: true,
        Color: {
          GrayScale: true,
        },
      },
    ]);
  }
);

Given(
  "only location is selected and PDS is found and more than one device attached with thing and smart Printing disabled",
  () => {
    publicUploadsCollectionMock.findOneAndUpdate.resolves({
      value: {
        _id: ObjectId.createFromHexString(customerId),
        IsProcessedFileName: [
          { FileName: req.body.fileName, IsProcessed: true },
        ],
        JobList: jobList,
        AutomaticPrintDelivery: true,
        LocationID: ObjectId.createFromHexString(locationId),
      },
    });
    thingsCollectionMock.findOne.onFirstCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: true,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [
        ObjectId.createFromHexString(),
        ObjectId.createFromHexString(),
      ],
    });
    devicesCollectionMock.find().toArray.resolves([
      {
        _id: ObjectId.createFromHexString(),
        ThingId: ObjectId.createFromHexString(),
        Device: deviceName,
        ColorEnabled: false,
        Color: {
          GrayScale: false,
        },
      },
    ]);
    devicesCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(),
      ThingId: ObjectId.createFromHexString(),
      Device: deviceName,
    });
  }
);

Given(
  "only location is selected and PDS is not found on selected location",
  () => {
    publicUploadsCollectionMock.findOneAndUpdate.resolves({
      value: {
        _id: ObjectId.createFromHexString(customerId),
        IsProcessedFileName: [
          { FileName: req.body.fileName, IsProcessed: true },
        ],
        JobList: jobList,
        AutomaticPrintDelivery: true,
        LocationID: ObjectId.createFromHexString(locationId),
      },
    });
    thingsCollectionMock.findOne.onFirstCall().resolves(null);
    devicesCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(),
      ThingId: ObjectId.createFromHexString(),
      Device: deviceName,
    });
  }
);

Given(
  "device found on selected location and but thing is not associated with device",
  () => {
    thingsCollectionMock.findOne.onSecondCall().resolves(null);
  }
);

Given(
  "device found on selected location and only one device attached with thing and AutoSelectPrinter is false",
  () => {
    thingsCollectionMock.findOne.onSecondCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: false,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [ObjectId.createFromHexString()],
    });
  }
);

Given(
  "device found on selected location and more than one device attached with thing and AutoSelectPrinter is false",
  () => {
    devicesCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(),
      ThingId: ObjectId.createFromHexString(),
      Device: deviceName,
    });
    thingsCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: false,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [
        ObjectId.createFromHexString(),
        ObjectId.createFromHexString(),
      ],
    });
  }
);

Given(
  "device found on selected location but no thing found for this device",
  () => {
    devicesCollectionMock.findOne.resolves({
      _id: ObjectId.createFromHexString(deviceId),
      ThingId: ObjectId.createFromHexString(),
      Device: deviceName,
    });
    thingsCollectionMock.findOne.resolves(null);
  }
);

Given(
  "device found on selected location and only one device attached with thing and AutoSelectPrinter is true",
  () => {
    thingsCollectionMock.findOne.onSecondCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: true,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [ObjectId.createFromHexString()],
    });
  }
);

Given(
  "device found on selected location and more than one device attached with thing and AutoSelectPrinter is true",
  () => {
    thingsCollectionMock.findOne.onFirstCall().resolves({
      _id: ObjectId.createFromHexString(),
      LocationID: ObjectId.createFromHexString(locationId),
      AutoSelectPrinter: true,
      PrimaryRegion: { ThingName: thingName },
      DeviceID: [
        ObjectId.createFromHexString(),
        ObjectId.createFromHexString(),
      ],
    });
    devicesCollectionMock.find().toArray.resolves([
      {
        _id: ObjectId.createFromHexString(),
        ThingId: ObjectId.createFromHexString(),
        Device: deviceName,
        ColorEnabled: true,
        Color: {
          GrayScale: true,
        },
      },
    ]);
  }
);

Then("the response should be success without print delivery", () => {
  expect(send.calledOnce).to.be.true;
  expect(send.firstCall.args[0]).to.deep.equal({
    message: "updated",
    status: 1,
  });
});

Then(
  "the job should be marked as processed and notification should be sent",
  () => {
    sinon.assert.calledWith(
      publicUploadsCollectionMock.findOneAndUpdate,
      sinon.match.any,
      {
        $set: { IsJobProcessed: true },
      }
    );
  }
);

Then("the response should be success with print delivery processed", () => {
  expect(send.calledOnce).to.be.true;
  expect(send.firstCall.args[0]).to.deep.equal({
    message: "updated",
    status: 1,
  });

  const expectedTopic = `cmd/eprintit/${customerId}/${locationId}/${thingName}/printdelivery`;

  sinon.assert.calledWithExactly(
    log.prototype.info,
    "Topic Name: ",
    expectedTopic
  );

  const infoCalls = log.prototype.info.getCalls();
  const messageFormedCall = infoCalls.find(
    (call) => call.args[0] === "Message Formed: "
  );

  expect(messageFormedCall).to.not.be.undefined;
  const dataArg = messageFormedCall.args[1];
  expect(dataArg.Device).to.be.a("string").and.not.empty;
});

Then("it is called from device 1 function", () => {
  sinon.assert.calledWithMatch(
    log.prototype.info,
    "called from device 1 function: ",
    deviceName
  );
});

Then("it is called from device 2 function", () => {
  sinon.assert.calledWithMatch(
    log.prototype.info,
    "called from device 2 function"
  );
});

Then("the response should be error with THING_NOT_FOUND", () => {
  expect(send.calledOnce).to.be.true;
  expect(send.firstCall.args[0]).to.deep.equal({
    error: {
      code: -105,
      message: "Check thing configuration for the device",
    },
    status: 0,
  });
});

Then(
  "the thing not found error should be logged and error response sent",
  () => {
    expect(send.calledOnce).to.be.true;
    expect(send.firstCall.args[0]).to.deep.equal({
      error: {
        code: -522,
        message: "Database error is occur or something went wrong",
      },
      status: 0,
    });

    sinon.assert.calledWithExactly(
      log.prototype.error,
      `Error: thing not found for device ${deviceId}.`
    );
  }
);

Then("it is called from device 3 function", () => {
  sinon.assert.calledWithMatch(
    log.prototype.info,
    "called from device 3 function"
  );
});

After(() => {
  sinon.restore();
});
