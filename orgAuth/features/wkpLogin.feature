@WkpLogin
Feature: WKP Login

  Scenario: Invalid request body for WKP login
    Given a request body "<requestBody>" to login with wkp
    When I send a POST request to login with wkp
    Then The response status should be <status> in login with wkp
    And The response should contain "<expectedMessage>" in login with wkp

    Examples:
      | requestBody                     | status | expectedMessage                                                                           | comment              |
      | without authId                  | 400    | Auth provider is not configured                                                           | internal error       |
      | without pin or with invalid pin | 400    | worldKeyPin: Invalid number of characters - world key pin must be 6 characters in length. | API validation error |
      | with valid pin                  | 200    | success                                                                                   | API success response |

    Scenario: Incorrect authProvider configuration for wkp login
      Given an authProvider "<configuration>" to login with wkp
      When I send a POST request to login with wkp
      Then The response status should be <status> in login with wkp
      And The response should contain "<expectedMessage>" in login with wkp

      Examples:
          | configuration                       | status | expectedMessage                                                                                             |
          | with invalid ClientId               | 400    | request.ClientId: Invalid Client Id                                                                         |
          | with invalid ClientSecret           | 400    | Invalid provider configuration                                                                              |
          | with invalid OcpApimSubscriptionKey | 400    | Access denied due to invalid subscription key. Make sure to provide a valid key for an active subscription. |
