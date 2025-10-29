@activation-code
Feature: Validate Activation Code

  Scenario: Successfully validate activation code
    Given a request with activation code "testActivationCode", serial number "testSerialNumber", and mac address "testMacAddress"
    When the request is made to validate the activation code
    Then the response for activationCode should be:
      | thingTagId  | testThingTagID |
      | tier        | standard       |
      | domainName  | testDomain     |
      | customerId  | 633c4f831d56a2724c9b58d2 |
      | thingId     | 67c070c6fa1ac107e77cde2d    |

  Scenario: Invalid activation code
    Given a request with activation code "invalidActivationCode", serial number "testSerialNumber", and mac address "testMacAddress"
    When the request is made to validate the activation code
    Then an error should be thrown with message for activationCode "ACTIVATION_CODE_NOT_VALID"