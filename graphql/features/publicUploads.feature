#PublicUploads

Feature: publicUpload Management

@getPublicUploads
  Scenario: It should send correct graphql query getPublicUploads
    Given a valid graphql query for getPublicUploads
    When user provide a valid input for getPublicUploads
    When User has provided valid pagination input for getPublicUploads
    Then The response status should be 200 for getPublicUploads
    Then The response will contain the data
