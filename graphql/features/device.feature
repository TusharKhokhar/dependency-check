#device Management

Feature: Device Management

@device
Scenario: calling getDevice api to fetch customerName
Given a valid graphql query for getDevice
When user provide a valid input for getDevice
When user called the getDevice query
Then response should be status 200 for getDevice api
Then we get the customerName of that device details in getDevice api

@importDevice
Scenario: calling importDevice api for csv template
Given a valid graphql query for importDevice
When user provide a valid input for importDevice
When user called the importDevice query
Then response should be status 200 for importDevice api
Then we get the base64 as the response for importDevice api
