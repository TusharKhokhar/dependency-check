const { Given, When, Then } = require('@cucumber/cucumber');
const sinon = require('sinon');
const { expect } = require('chai');
const proxyquire = require('proxyquire').noCallThru();

let dbStub, fetchAllOfflineThingsStub, fetchAllDuplicateThingStub, handler;

const offlineDevices = [{
  thingName: 'Thing1',
  connectivity: {
    connected: false,
    timestamp: Date.now() - 3600000,
    disconnectReason: 'CLIENT_INITIATED_DISCONNECT'
  }
}];

const duplicateThingLogs = [
  {
    clientId: 'Thing1',
    details: 'A new connection was established with the same client ID',
    reason: 'DUPLICATE_CLIENT_ID',
    sourceIp: '192.168.1.1'
  },
  {
    clientId: 'Thing1',
    details: 'A new connection was established with the same client ID',
    reason: 'DUPLICATE_CLIENT_ID',
    sourceIp: '192.168.1.2'
  }
];

const thingsData = [
  { 
    _id: 'thing1',
    PrimaryRegion: { ThingName: 'Thing1' },
    CustomerID: 'customer1',
    Label: 'Test Thing 1',
    Thing: "thing1",
    ThingType: 'TestType'
  }
];

const customersData = [{
  _id: 'customer1',
  CustomerName: 'Test Customer',
  Tier: 'standard'
}];

const premiumCustomersData = [{
  _id: 'customer2',
  CustomerName: 'Premium Customer',
  Tier: 'premium',
  IsDeleted: false,
  IsActive: true,
  DomainName: 'premium1'
}];

Given('there are offline devices in AWS IoT', function () {
  fetchAllOfflineThingsStub = sinon.stub().resolves(offlineDevices);
});

Given('there are duplicate thing connections in CloudWatch logs', function () {
  fetchAllDuplicateThingStub =  sinon.stub().resolves(duplicateThingLogs);
});

Given('the database contains Things and Customers data', function () {
  dbStub = {
    collection: sinon.stub()
  };

  // Create spies
  this.bulkWriteSpy = sinon.spy(async () => ({ result: { ok: 1 } }));
  this.updateManySpy = sinon.spy(async () => ({ modifiedCount: 1 }));

   const premiumCustomersFindStub = sinon.stub().returns({
    project: sinon.stub().returns({
      toArray: sinon.stub().resolves(premiumCustomersData)
    })
  });


  // Setup Customers collection stub
  const customersFindStub = sinon.stub().returns({
    project: sinon.stub().returns({
      toArray: sinon.stub().resolves(customersData)
    })
  });

   const thingsFindStub = sinon.stub().returns({
    skip: (skipCount) => ({
      limit: (limitCount) => ({
        toArray: async () => skipCount === 0 ? thingsData : [] // Return data only for first page
      })
    }),
    project: () => ({
      toArray: async () => thingsData
    })
  });

  // Wire up collection stubs
  dbStub.collection
    .withArgs('Things').returns({ find: thingsFindStub })
    .withArgs("Customers")
    .withArgs('Customers').returns({
      find: (query) => {
        // Handle premium customers query
        if (query && query.Tier === 'premium') {
          return {
            toArray: async () => premiumCustomersData
          };
        }
        // Handle queries by _id
        if (query && query._id && query._id.$in) {
          return {
            project: () => ({
              toArray: async () => customersData.filter(c => 
                query._id.$in.includes(c._id)
              )
            })
          };
        }
        // Default case
        return {
          project: () => ({
            toArray: async () => customersData
          })
        };
      }
    })
    .withArgs('AuditLogs').returns({
      bulkWrite: this.bulkWriteSpy,
      updateMany: this.updateManySpy
    });

  // Setup handler with all required stubs
  handler = proxyquire('../../index', {
    './services/iot-handler': {
      fetchAllOfflineThings: fetchAllOfflineThingsStub,
      fetchAllDuplicateThing: fetchAllDuplicateThingStub
    },
    './config/db': {
      getDb: () => Promise.resolve(dbStub),
      switchDb: () => Promise.resolve(dbStub)
    },
    './services/policy': {
      iotPolicy: () => ({}),
      cloudWatchFilterLogsPolicy: sinon.stub().returns({})
    },
    './helpers/credentialGenerator': {
      getStsCredentials: () => Promise.resolve({
        Credentials: {
          AccessKeyId: 'test-key',
          SecretAccessKey: 'test-secret',
          SessionToken: 'test-token'
        }
      })
    },
    './config/config': {
      region: 'us-east-1'
    },
    './helpers/customLogger': class {
      error = sinon.stub()
      info = sinon.stub()
    }
  }).handler;
});

When('the monitoring handler runs', async function () {
  await handler({}, { 
    status: () => ({ send: () => {} })
  });
});

Then('audit logs should be created for offline devices', async function () {
  expect(this.bulkWriteSpy.called).to.be.true;
  const bulkOps = this.bulkWriteSpy.firstCall.args[0];
  
  const offlineOp = bulkOps.find(op => 
    op.updateOne.filter.ThingName === 'Thing1' && 
    op.updateOne.update.$set.Type === 'ThingOfflineAlert'
  );
  
  expect(offlineOp).to.exist;
  expect(offlineOp.updateOne.update.$set.DisconnectReason)
    .to.equal('CLIENT_INITIATED_DISCONNECT');
});

Then('audit logs should be created for duplicate connections', async function () {
  const bulkOps = this.bulkWriteSpy.getCalls()
    .flatMap(call => call.args[0])
    .filter(op => op.updateOne.update.$set.Type === 'DuplicateClientConnection');
  
  expect(bulkOps).to.have.length.greaterThan(0);
  expect(bulkOps[0].updateOne.filter.ThingName).to.equal('Thing1');
  expect(bulkOps[0].updateOne.update.$set.IPAddress)
    .to.deep.equal(['192.168.1.1',"192.168.1.2"]);
});

Then('existing audit logs should be cleared for non-duplicate things', function () {
  expect(this.updateManySpy.called).to.be.true;
  const updateFilter = this.updateManySpy.firstCall.args[0];
  const updateOp = this.updateManySpy.firstCall.args[1];
  
  expect(updateFilter.Type).to.equal('DuplicateClientConnection');
  expect(updateOp.$set.IPAddress).to.deep.equal([]);
  expect(updateOp.$set.DuplicateConnectionCount).to.equal(0);
});