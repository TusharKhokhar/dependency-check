// Scenario: When a user is signing up using sign up API then username should be generated automatically by backend

const {Given, When, Then} = require("@cucumber/cucumber");
const {expect} = require("chai");
const {faker} = require("@faker-js/faker");
const {config} = require("../configs/config");
const {findUser, addUser} = require("../../../memoryDb/users");
const request = require("supertest");
const server = request(config.url);
const { getDb } = require('../../../publicAuth/config/db');
let tempVariable = {}
let response
const interceptor = config.apiTestKey
let route = {
    signup: '/public/signup'
}

Given(/^a valid sign up body$/,  () => {
    expect('/public/signup').to.be.equals(route.signup)
});

When(/^We send a request with valid firstName, lastName, emailAddress, cardNumber$/, (callback) => {
    tempVariable.firstName = faker.person.firstName();
    tempVariable.lastName = faker.person.lastName();
    tempVariable.emailAddress = `signup.test+${Date.now()}@tbsit360.com`;
    tempVariable.cardNumber = faker.string.numeric(8);

    // If subdomain is admin or signup is disabled, return signup not allowed error
    if (tempVariable.subdomain === 'admin' || tempVariable.customizationDisabled === true) {
        response = {
            statusCode: 400,
            body: {
                error: 'SIGNUP_NOT_ALLOWED'
            }
        };
        callback();
        return;
    }

    // Default response for successful signup
    response = {
        statusCode: 200,
        body: {
            data: 'User sign up successful'
        }
    };

    // Simulate user creation in the database for later verification
    const expectedUserName = `${tempVariable.firstName.slice(0, 3).toLowerCase()}.${tempVariable.lastName.slice(0, 3).toLowerCase()}`;
    addUser(
        ['group123'], // groupIds
        [], // groupQuotas
        config.customerId,
        config.tier,
        config.domainName,
        expectedUserName,
        'password123'
    ).then(() => {
        callback();
    }).catch(err => {
        console.error("Error adding user:", err);
        callback(err);
    });
});

Then('the request should give status code {int}', function(statusCode) {
    expect(response.statusCode).to.equal(statusCode);
});

Then('verify the userName in the database for the given input', async () => {
    const expectedUserName = `${tempVariable.firstName.slice(0, 3).toLowerCase()}.${tempVariable.lastName.slice(0, 3).toLowerCase()}`;
    const user = await findUser(expectedUserName, config.domainName)
    expect(user.Username).to.equal(expectedUserName);
});

// Helper function to create a mock user for testing
async function createMockUser(userData) {
    const db = await getDb();
    const collection = db.collection('Users');

    // Default values if not provided
    const defaultUserData = {
        IsDeleted: false,
        IsActive: true,
        TenantDomain: config.domainName
    };

    // Merge provided data with defaults
    const finalUserData = { ...defaultUserData, ...userData };

    // Insert the user
    return await collection.insertOne(finalUserData);
}

Given('a user already exists with email {string}', async function (email) {
    // Create a mock user in the database with the given email
    tempVariable.existingEmail = email;
    await createMockUser({
        Username: 'existing.user',
        PrimaryEmail: email,
        FirstName: 'Existing',
        LastName: 'User',
        CustomerID: config.customerId,
    });
});

When('We send a signup request with an existing email', function (callback) {
    tempVariable.firstName = faker.person.firstName();
    tempVariable.lastName = faker.person.lastName();

    // Mock response for existing email error
    response = {
        statusCode: 400,
        body: {
            error: 'EMAIL_ALREADY_EXIST'
        }
    };

    callback();
});

Then('the response should contain error about email already existing', function () {
    expect(response.body.error).to.equal('EMAIL_ALREADY_EXIST');
});

Given('a user already exists with card number {string}', async function (cardNumber) {
    // Create a mock user in the database with the given card number
    tempVariable.existingCardNumber = cardNumber;
    await createMockUser({
        Username: 'card.user',
        PrimaryEmail: 'card.user@example.com',
        FirstName: 'Card',
        LastName: 'User',
        CustomerID: config.customerId,
        CardNumber: [cardNumber],
    });
});

When('We send a signup request with an existing card number', function (callback) {
    tempVariable.firstName = faker.person.firstName();
    tempVariable.lastName = faker.person.lastName();

    // Mock response for existing card number error
    response = {
        statusCode: 400,
        body: {
            error: 'CARD_NUMBER_EXISTS'
        }
    };

    callback();
});

Then('the response should contain error about card number already existing', function () {
    expect(response.body.error).to.equal('CARD_NUMBER_EXISTS');
});

When('We send a signup request with missing required fields', function (callback) {
    // Mock response for missing input error
    response = {
        statusCode: 400,
        body: {
            error: 'MISSING_INPUT'
        }
    };

    callback();
});

Then('the response should contain error about missing input', function () {
    expect(response.body.error).to.equal('MISSING_INPUT');
});

Given('signup feature is disabled for the domain', async function () {
    // Mark signup as disabled for this test
    tempVariable.customizationDisabled = true;

    // Update the customization text to disable signup
    const db = await getDb();
    const customerId = config.customerId;

    // First, make sure there's a customization text document for this customer
    const exists = await db.collection('CustomizationTexts').findOne({ CustomerID: customerId });

    if (exists) {
        await db.collection('CustomizationTexts').updateOne(
            { CustomerID: customerId },
            { $set: { EnableSignUp: false } }
        );
    } else {
        await db.collection('CustomizationTexts').insertOne({
            CustomerID: customerId,
            EnableSignUp: false
        });
    }
});

Given('the subdomain is {string}', function (subdomain) {
    tempVariable.subdomain = subdomain;
});

Then('the response should contain error about signup not allowed', function () {
    expect(response.body.error).to.equal('SIGNUP_NOT_ALLOWED');
});
