@network
Feature: network

    Scenario: Successfully add a new network
        Given I have a valid network input
        When I send a request to add the network
        Then the response of network should have status code 200 and response should have network details

    Scenario: Successfully update an network
        Given I have a valid network update input
        When I send a request to update the network
        Then the response of network should have status code 200 and the response should contain a success message

    Scenario: Successfully change the status of an network
        Given I have a valid network status input
        When I send a request to change the network status
        Then the response of network should have status code 200

    Scenario: Successfully get network details
        Given I have a valid network ID
        When I send a request to get the network
        Then the response of network should have list of network

    Scenario: Successfully delete an network
        Given I have a valid network delete input
        When I send a request to delete the network
        Then the response of network deletion should have status code 200 and the response should contain a success message
