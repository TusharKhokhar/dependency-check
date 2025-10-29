# fax.feature

Feature: Fax Management

    Scenario: Mutation to add a new fax data
        Given A valid graphql addFax mutation
        When User has provided valid faxInput
        Then The api should respond with status code 200 for addFax
        Then The response contains fax data
