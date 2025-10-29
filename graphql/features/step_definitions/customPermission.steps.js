const { Given, When, Then } = require("@cucumber/cucumber");
const chai = require("chai");
const { handler } = require("../../graphql");
const { getEvent } = require("../mocks/event");
const {getCustomPermissions} = require("../queries/customPermission");
const expect = chai.expect;

globalResponse = {};
const context = {};

Given("I have custom permissions saved in database", function () {
    return getCustomPermissions
});

When("I call get custom permissions api", async () => {
    const event = getEvent(getCustomPermissions);
    try {
        const response = await handler(event, context);
        response.body = JSON.parse(response.body);
        console.log(response.body);
        globalResponse.response = response;
    } catch (error) {
        console.error("Error in Lambda Handler:", error);
        throw error;
    }
});

When("I should receive the following permissions in sorted order by least to most restrictive", function () {
    expect(200).to.equal(globalResponse.response.statusCode);
    const result = globalResponse.response.body.data.getCustomPermissions.customPermission[0];
    expect(result).to.not.be.empty;
    expect(result).to.have.property("PermissionName");
    expect(result).to.have.property("ChildPerms");
    result?.ChildPerms.forEach(element => {
        expect(element).to.have.property("PermissionName");
        expect(element).to.have.property("Enum");
        expect(element).to.have.property("_id");
    })
});