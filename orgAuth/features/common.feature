@Common
Feature: Common controller

    Scenario: Valid Redirect URL
        Given the redirect URI "<redirectURI>"
        When the function is executed
        Then the redirect should be allowed
        Examples:
          | redirectURI                               |
          | https://${orgId}.${domainName}            |
          | https://api.${domainName}                 |
          | https://${orgId}.eprintitsaas.org         |
          | https://eprintit.com                      |
          | ponauth://oauthredirect                   |
          | https://mobile.${domainName}              |
          | http://127.0.0.1:12000/index.html         |
          | https://pwa.${domainName}                 |

    Scenario: Invalid Redirect URL
        Given the redirect URI "<redirectURI>"
        When the function is executed
        Then the redirect should be blocked
    
        Examples:
          | redirectURI                               |
          | https://random.org                        |