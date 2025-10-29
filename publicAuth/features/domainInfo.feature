# domainInfo.feature
@global @domainInfo
Feature: domain info api is designed to return all the meta data about a customer. This includes
  themes, profiles, logos, job lists, customerData, locations, license etc

  Scenario: Domain info api should return all profiles including profile settings if exists
    Given a valid route for the domainInfo API
    When I send a GET request to get domainInfo
    Then I should receive a response that contains profile and profile data if exists

  Scenario: Domain info API should match domain case-insensitively but exactly
    Given a valid request for the domainInfo API with "<domainNameCase>" domain
    When I send a GET request to get domainInfo
    Then I should receive a response with the correct customer data
    Examples:
          | domainNameCase  |
          | capital         |
          | small           |
          | camelcase       |

  Scenario: Domain info API should match invalid domain name
    Given a request with invalid domain name for the domainInfo API
    When I send a GET request to get domainInfo
    Then I should receive an error message like "Customer Not Found"

  Scenario: Verify Sip2Config is included in authProvider
    Given a customer has Sip2 as an authProvider
    When I send a GET request to get domainInfo
    Then the response should include Sip2Config inside the authProvider details