const { Given, When, Then } = require('@cucumber/cucumber');
const chai = require('chai');
const {config} = require("../configs/config");
const {handler} = require("../../graphql");
const {addProton, protonDeleted, protonStatus, updateProton} = require("../mutations/proton.mutation");
const {getProton} = require("../queries/proton");
const expect = chai.expect;

let response,globalResponse = {};

Given('I have a valid proton input', function () {
    return addProton.variables.addProtonInput;
});

Given('I have a valid proton update input', function () {
    return addProton.variables.addProtonInput;

});

Given('I have a valid proton delete input', function () {
    return protonDeleted.variables
});

Given('I have a valid proton status input', function () {
    return protonStatus.variables
});

Given('I have a valid proton get input', function () {
    return getProton.variables
});

When('I send a request to add the proton', async function () {
    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(addProton),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

When('I send a request to update the proton', async function () {
    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(updateProton),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

When('I send a request to delete the proton', async function () {
    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(protonDeleted),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

When('I send a request to change the proton status', async function () {
    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(protonStatus),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

When('I send a request to get the proton', async function () {
    const event = {
        version: "2.0",
        routeKey: "POST /graphql",
        rawPath: "/graphql",
        rawQueryString: "",
        headers: {
            apikey: config.apiTestKey,
            tier: config.tier,
            authorization: config.token,
            subdomain: config.domainName,
            "content-type": "application/json",
        },
        requestContext: {
            http: {
                method: "POST",
                path: "/graphql",
            },
        },
        body: JSON.stringify(getProton),
        isBase64Encoded: false,
    };

    const context = {};

    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

Then('the response should have status code {int}', function (statusCode) {
    expect(statusCode).to.equal(globalResponse.response.statusCode);
});

Then('the response should contain the new proton details', function () {
    const proton = globalResponse.response.body.data.addProton;
    expect(proton).to.include(proton);
});

Then('the response should contain a success message', function () {
    const result = globalResponse.response.body.data.updateProton ||
      globalResponse.response.body.data.protonDeleted || globalResponse.response.body.data.protonStatus;
    expect(result.message).to.exist;
});

Then('the response should contain the proton details', function () {
    const proton = response.body.data.getProton;
});