# billingServices.feature
@ThirdPartySupportedLanguages
Feature: ThirdPartySupportedLanguages

    Scenario: Successfully get languages list
        Given I have valid request parameters for ThirdPartySupportedLanguages
        When I send a request to get the ThirdPartySupportedLanguages
        Then the response of ThirdPartySupportedLanguages should have status code 200
        And the response should contain a list of ThirdPartySupportedLanguages
