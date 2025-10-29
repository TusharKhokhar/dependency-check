const { Given, When, Then, After} = require('@cucumber/cucumber');
const { expect } = require('chai');
const sinon = require('sinon');
const { Mutation } = require('../../src/resolvers/licensing');
const utilsHelper = require('../../helpers/util');
const CustomLogger = require("../../helpers/customLogger");

let context;
let dbStub;
let logStub;
let result;
let error;

Given('a user with ID {string} and CustomerID {string}', (userId, customerId) => {
    context = {
        data: {
            _id: userId,
            CustomerID: customerId,
            customerIdsStrings: [customerId],
            TenantDomain: 'admin',
            isKiosk: false,
            user: {
                Permissions: ['Update_License']
            }
        },
        operationName: 'UpdateLicense'
    };
    dbStub = sinon.stub(utilsHelper, 'getDatabase').resolves({
        collection: sinon.stub().returns({
            updateOne: sinon.stub().resolves()
        })
    });
    logStub = sinon.stub(CustomLogger.prototype, 'lambdaSetup');
});

When('the user updates the license with ID {string} with the following details:', async (licenseId, dataTable) => {
    const updateLicenseInput = dataTable.rowsHash();
    updateLicenseInput.TranslationServiceOption = {
        Local: updateLicenseInput.TranslationServiceText,
        International: updateLicenseInput.TranslationServiceAudio
    }
    updateLicenseInput.FaxServiceOption = {
        Local: updateLicenseInput.FaxServiceLocal,
        International: updateLicenseInput.FaxServiceInternational
    }
    try {
        result = await Mutation.updateLicense(null, { updateLicenseInput, licenseId }, context);
    } catch (err) {
        error = err;
    }
});

Then('the response should be:', (dataTable) => {
    const expectedResponse = dataTable.rowsHash();
    expect(result).to.be.deep.equal({
        message: expectedResponse.message,
        statusCode: parseInt(expectedResponse.statusCode)
    });
});

Then('an error should be thrown with message {string}', (errorMessage) => {
    expect(error.message).to.equal(errorMessage);
});

After(() => {
    sinon.restore();
});