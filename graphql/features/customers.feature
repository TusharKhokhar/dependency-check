# customers.feature
@customers
Feature: Customers Management

    Scenario: Retrieve a paginated list of associated customers
        Given a valid GraphQL GetSubCustomers query
        When the user provides valid PaginationData
        When the user executes the GetSubCustomers query to retrieve the list of associated customers
        Then the API should respond with status code 200 and return a filtered list of associated customers

    Scenario: Query to get all associated customers
        Given a valid GraphQL GetSubCustomers query
        When the user does not provide PaginationData
        When the user executes the GetSubCustomers query to retrieve the list of associated customers
        Then The api should respond with status code 200 and all the partner customers

    Scenario: Successfully Sort customer list
        Given a valid GraphQL GetSubCustomers query
        When the user provides a valid input for GetSubCustomers to sort associated customers data in descending order
        When the user executes the GetSubCustomers query to retrieve the list of associated customers
        Then the API response should include the associated customer data sorted in descending order

    Scenario: Successfully search associated customers by CustomerName
        Given a valid GraphQL GetSubCustomers query
        When the user provides a CustomerName to search
        When the user executes the GetSubCustomers query to retrieve the list of associated customers
        Then the API should respond with status code 200 and return the list of associated customers matching the search name

    @onboardCustomer
    Scenario: Successfully onboard a customer with the correct language setting
        Given a valid GraphQL onboardCustomer mutation
        When the user submits an OnboardCustomerInput with CustomerLanguage set to "fr-FR"
        When the user executes the onboardCustomer mutation
        Then the API should respond with a 200 status code
        And the CustomerLanguage field in the database should be set to "fr-FR"