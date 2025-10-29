@license
Feature: Update License

  Scenario: Successfully update a license
    Given a user with ID "testUserId" and CustomerID "67c070c6fa1ac107e77cde2d"
    When the user updates the license with ID "67c070c6fa1ac107e77cde2d" with the following details:
      | CustomerID   | 67c070c6fa1ac107e77cde2d |
      | RegisterDate | 2023-01-01     |
      | RegisteredTo | 2023-12-31     |
      | TranslationServiceText | true    |
      | TranslationServiceAudio | true    |
      | FaxServiceLocal | true    |
      | FaxServiceInternational | true    |
    Then the response should be:
      | message            | Updated successfully |
      | statusCode         | 200                  |