#location Management

Feature: location Management

@importLocation
Scenario: calling importLocation api for csv template
Given a valid graphql query for importLocation
When user provide a valid input for importLocation
When user called the importLocation query
Then response should be status 200 for importLocation api
Then we get the base64 as the response for importLocation api

@addLocation
Scenario: Mutation to add a new location data
Given A valid graphql addLocation mutation
When User has provided valid locationInput
Then The api should respond with status code 200 for addLocation
Then The response contains location data

@getLocations
Scenario: It should send correct graphql query getLocations
Given a valid graphql query for getLocations
When User has provided valid pagination input for getLocations
Then The response status should be 200 for getLocations
Then The response will contain total number of locations and location object in an array
