@Illiad
Feature: Illiad

    Scenario: Successfully add a new illiad
        Given I have a valid illiad input
        When I send a request to add the illiad
        Then the response of illiad should have status code 200
        And the response of illiad should contain illiad details

    Scenario: Successfully update an illiad
        Given I have a valid illiad update input
        When I send a request to update the illiad
        Then the response of illiad should have status code 200
        And the response of illiad should contain a success message

    Scenario: Successfully change the status of an illiad
        Given I have a valid illiad status input
        When I send a request to change the illiad status
        Then the response of illiad should have status code 200

    Scenario: Successfully get illiad details
        Given I have a valid illiad ID
        When I send a request to get the illiad
        Then the response of illiad should have status code 200

    Scenario: Successfully delete an illiad
        Given I have a valid illiad delete input
        When I send a request to delete the illiad
        Then the response of illiad should have status code 200
        And the response of illiad should contain a success message