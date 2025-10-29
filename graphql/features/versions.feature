# versions.feature
@versions

Feature: Version Management

    Scenario: Add new Version without specifying IsActive
        Given the input does not include the IsActive field
        When the user calls the addVersion mutation with the provided VersionInput
        Then the response should contain the Version data with IsActive set to false

    Scenario: Add new Version with IsActive set to false
        Given the input includes IsActive set to false
        When the user calls the addVersion mutation with the provided VersionInput
        Then the response should contain the Version data with IsActive set to false

    Scenario: Add new Version with IsActive set to true
        Given the input includes IsActive set to true
        When the user calls the addVersion mutation with the provided VersionInput
        Then the response should contain the Version data with IsActive set to true

