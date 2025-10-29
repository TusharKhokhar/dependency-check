@RestorePictures
Feature: RestorePictures

    Scenario: Successfully add a new restore pictures
        Given I have a valid restore pictures input
        When I send a request to add the restore pictures
        Then the response of restore pictures should have status code 200
        And the response of restore pictures should contain restore pictures details

    Scenario: Successfully update an restore pictures
        Given I have a valid restore pictures update input
        When I send a request to update the restore pictures
        Then the response of restore pictures should have status code 200
        And the response of restore pictures should contain a success message

    Scenario: Successfully change the status of an restore pictures
        Given I have a valid restore pictures status input
        When I send a request to change the restore pictures status
        Then the response of restore pictures should have status code 200

    Scenario: Successfully get restore pictures details
        Given I have a valid restore pictures ID
        When I send a request to get the restore pictures
        Then the response of restore pictures should have status code 200

    Scenario: Successfully delete an restore pictures
        Given I have a valid restore pictures delete input
        When I send a request to delete the restore pictures
        Then the response of restore pictures should have status code 200
        And the response of restore pictures should contain a success message