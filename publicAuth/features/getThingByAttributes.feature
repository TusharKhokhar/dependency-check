@thing-attributes
Feature: Get Thing by attributes the api is responsible to return thingTagId and tier of a thing by its serial number
  and mac address

  Scenario: Successfully get thing by attributes
    Given a request with serial number "testSerialNumber" and mac address "testMacAddress"
    When the request is made to get thing by attributes
    Then the response should be:
      | ThingTagID | testThingTagID |
      | Tier       | standard       |

  Scenario: Missing serial number or mac address
    Given a request with serial number "" and mac address ""
    When the request is made to get thing by attributes
    Then an error should be thrown with message "MISSING_INPUT"