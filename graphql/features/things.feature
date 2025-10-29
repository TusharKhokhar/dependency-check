#thing Management
@Things

Feature: Thing Management

    Scenario: calling importThing api for csv template
        Given a valid graphql query for importThing
        When user provide a valid input for importThing
        When user called the importThing query
        Then response should be status 200 for importThing api
        Then we get the base64 as the response for importThing api

    Scenario: calling the addThing API to add a new thing
        Given a valid GraphQL query for addThing
        When the user provides a valid input for addThing
        And the user calls the addThing query
        Then the response should have a status of 200 for the addThing API
        And the response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName

    Scenario: calling the updateThing API to update a thing
        Given a valid GraphQL query for updateThing
        When the user provides a valid input for updateThing
        And the user calls the updateThing query
        Then the response should have a status of 200 for the updateThing API
        And the response should include the following updateThing fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName

    Scenario: calling the getThings API to get a thing list
        Given a valid GraphQL query for getThings
        When the user provides a valid input for getThings
        And the user calls the getThings query
        Then the response should have a status of 200 for the getThings API
        And the getThings response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName

    Scenario: calling the getThing API to get a thing data
        Given a valid GraphQL query for getThing
        When the user provides a valid input for getThing
        And the user calls the getThing query
        Then the response should have a status of 200 for the getThing API
        And the getThing response should include the following fields: PromptForAccount, EmailAsReleaseCode, SerialNumber, Firmware, IpAddress, MacAddress, and ComputerName

    Scenario: calling the getThing API to get a thing data
        Given a valid GraphQL query for getThing
        When the user provides a valid input for getThing
        And the user calls the getThing query
        Then the response should have a status of 200 for the getThing API
        And the getThing response should include the following fields in LoginOptions: ExternalCardValidation, ExternalCardIdp

    Scenario: Successfully add a new Thing
        Given I have a valid addThing input with isActive set to true
        When I send a request to add Thing
        Then the response of Thing should have status code 200
        And the response of Thing should have isActive set to true

    Scenario: Successfully search a Thing by Label
        Given a valid GraphQL query for getThings
        And the user provides a valid getThings input with search pattern for display name "Test thing 1"
        When the user calls the getThings query
        Then the response should have a status of 200 for the getThings API
        And the response should include at least one Thing with Label equal to "Test thing 1"
