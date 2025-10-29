@HandwriteRecognition
Feature: HandwriteRecognition

    Scenario: Successfully add a new handwriting recognition
        Given I have a valid handwriting recognition input
        When I send a request to add the handwriting recognition
        Then the response of handwriting recognition should have status code 200
        And the response of handwriting recognition should contain handwriting recognition details

    Scenario: Successfully update an handwriting recognition
        Given I have a valid handwriting recognition update input
        When I send a request to update the handwriting recognition
        Then the response of handwriting recognition should have status code 200
        And the response of handwriting recognition should contain a success message

    Scenario: Successfully change the status of an handwriting recognition
        Given I have a valid handwriting recognition status input
        When I send a request to change the handwriting recognition status
        Then the response of handwriting recognition should have status code 200

    Scenario: Successfully get handwriting recognition details
        Given I have a valid handwriting recognition ID
        When I send a request to get the handwriting recognition
        Then the response of handwriting recognition should have status code 200

    Scenario: Successfully delete an handwriting recognition
        Given I have a valid handwriting recognition delete input
        When I send a request to delete the handwriting recognition
        Then the response of handwriting recognition should have status code 200
        And the response of handwriting recognition should contain a success message