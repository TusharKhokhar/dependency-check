@dashboard
Feature: Dashboard API

  Scenario: Fetch dashboard reports successfully
    Given a valid graphql query for dashboard
    When user provide a valid timeZone for dashboard api
    Then user should get the dashboard reports
    Then structure of the response should be correct
    Then DayWiseData should only contain date and count fields
    Then DeliveryWiseData should contain only expected keys with count field
    Then DeliveryByDateWiseData should contain only expected keys with date and count fields

   Scenario: Fetch dashboard reports successfully for a specific customer
    Given a valid graphql query for dashboard
    When user provides a valid CustomerID and timeZone for dashboard API
    Then user should get the dashboard reports
    Then structure of the response should be correct
    Then DayWiseData should only contain date and count fields
    Then DeliveryWiseData should contain only expected keys with count field
    Then DeliveryByDateWiseData should contain only expected keys with date and count fields

  Scenario: Error occurs while fetching dashboard data
    Given a valid graphql query for dashboard
    When an error occurs in the dashboard resolver
    Then the error should be logged and an error should be thrown


