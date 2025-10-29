# customizationText.feature

@customizationTexts

Feature: customizationTexts

    Scenario: Successfully add a new customizationTexts
        Given I have a valid customizationTexts input
        When I send a request to add the customizationTexts
        Then the response of customizationTexts should have status code 200
        And the response of customizationTexts should contain customizationTexts details
