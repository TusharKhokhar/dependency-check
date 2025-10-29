@translation
# bucket.feature

Feature: Translation Management

    Scenario: Mutation to add uploadMultipleFile data
    Given a valid graphql uploadMultipleFile mutation
    When User has provided valid uploadMultipleFile input
    Then The api should respond with status code 200 for uploadMultipleFile when license configured for translation
    Then The response contains uploadMultipleFile data
    Then The response contains uploadMultipleFile post request signed urls
    When User has provided valid uploadMultipleFile input but license not configured for translation
    Then The response contains uploadMultipleFile license error

    Scenario: Mutation to add confirmFileUpload data
    Given a valid graphql confirmFileUpload mutation
    When User has provided valid confirmFileUpload input
    Then The api should respond with status code 200 for confirmFileUpload
    Then The response contains confirmFileUpload data

