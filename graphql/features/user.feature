# user.feature
@user
Feature: User Management
  Scenario: calling getUser before updating balance
    Given a valid graphql query for getUser before updating balance
    When user provide a valid input for getUser before updating balance
    When user called the getUser query before updating balance
    Then response should be status 200 for getUser before updating balance
    Then we get the response of that user details before updating balance

  Scenario: It should send correct graphql mutation updateUserBalance
    Given a valid graphql mutation for updateUserBalance
    When user provide a valid mutation input for updateUserBalance
    Then response should be status 200 for updateUserBalance
    Then response will update the user balance for updateUserBalance

  Scenario: It should send correct graphql mutation updateUserBalance when type is Debit
    Given a valid graphql mutation for type Debit
    When user provide a valid mutation input as Debit
    Then response should be status 200 for Type Debit
    Then response will update the user balance for type as Debit

  Scenario: It should contain the updated balance in getUser
    Given a valid graphql query for getUser
    When user provide a valid input for getUser
    When user called the getUser query to check updated balance
    Then response should be status 200 for getUser
    Then we get the response of that user details

  Scenario: It should send set password link via email in addUser
    Given a valid graphql Mutation for addUser
    When user provide a valid input for addUser
    When user called the addUser Mutation to add user
    Then response should be status 200 for addUser
    Then user records should contain ResetPasswordToken untill password is set

  Scenario: It should contain the updated quota group in updateUserV2
    Given a valid graphql mutation for updateUserV2
    When user provide a valid mutation input for updateUserV2
    Then response should be status 200 for updateUserV2
    Then Then response will update the user GroupQuotas for updateUserV2

  Scenario: Successfully validate a valid card number
    Given a valid graphql mutation for validateCardNumber
    When user provide a valid mutation for the validate card number
    Then response should be status 200 for validateCardNumber
    Then response should include a token with a 4-hour expiration time for validating the card number

  Scenario: Successfully validate a valid card number pin
    Given a valid graphql mutation for validateCardNumberPin
    When user provide a valid mutation for the validate card number pin
    Then response should be status 200 for validateCardNumberPin
    Then response should include a token with a 4-hour expiration time for validating the card number pin


  Scenario: Successfully get all Users data in getUsers
      Given a valid graphql query for getUsers
      When user provide a valid input for getUsers
      When user called the getUsers query to get all users data
      Then response should be status 200 for getUsers
      Then response should always contains permission group at 0th index

  Scenario: Successfully get all Users data with groupName sorting in descending order
    Given a valid graphql with pagination query for getUsers in descending order
    When user provide a valid input with pagination for getUsers in descending order
    When user called the getUsers query with pagination data to get all users data in descending order
    Then response should be status 200 for getUsers
    Then response should contain Sort group names in descending order, with starting with "Z" at the top

  Scenario: Successfully get all Users data with groupName sorting in ascending order
    Given a valid graphql with pagination query for getUsers in ascending order
    When user provide a valid input with pagination for getUsers in ascending order
    When user called the getUsers query with pagination data to get all users data in ascending order
    Then response should be status 200 for getUsers
    Then response should contain Sort group names in ascending order, with starting with "A" at the top

  Scenario: Successfully Retrieve User Data in getUserOverview
    Given a valid GraphQL query for getUserOverview
    When the user provides a valid input for getUserOverview
    When the user calls the getUserOverview query to fetch user data
    Then the response status should be 200 for getUserOverview
    And the response should contain the keys: user, transaction, and usage

  Scenario: Successfully Sort Usage Data in getUserOverview
    Given a valid GraphQL query for getUserOverview to sort usage data in ascending order
    When the user provides a valid input for getUserOverview to sort usage data in ascending order
    When the user calls the getUserOverview query to fetch user data
    Then the response should contain usage data sorted in ascending order

  Scenario: Successfully Sort Transaction Data in getUserOverview
    Given a valid GraphQL query for getUserOverview to sort transaction data in descending order
    When the user provides a valid input for getUserOverview to sort transaction data in descending order
    When the user calls the getUserOverview query to fetch user data
    Then the response should contain transaction data sorted in descending order

  Scenario: Successfully Retrieve Paginated Data in getUserOverview
    Given the user requests getUserOverview with pagination input for page 1 and a limit of 2
    When the user calls the getUserOverview query to fetch user data
    Then the response should contain at most 2 usages or transaction entries

  Scenario: Successfully add a new user
    Given I have a valid user input with isActive set to true
    When I send a request to add user
    Then the response of user should have status code 200

  Scenario: Successfully add a new user with uniq primary email
    Given I have a valid user input with isActive set to true
    When I send a request to add user
    Then the response of user should have status code 200
  
  Scenario: add a new user with already existing primary email
    Given I have a valid user input with existing primary email
    When I send a request to create a user with a existing primary email
    And the response should contain an error message indicating that a user already exists with the same

  Scenario: add a new Thing with already existing Label
    Given a valid graphql query for findDataExisting Thing display name
    When the user provides a valid input for add new thing label name is "Test Thing"
    When I send a request to add new thing
    Then the response should contain the message "Data Exists"

  Scenario: Adding first card
    Given the user has no card numbers
    When I update the user with card number "CARD001"
    Then the user should have "CARD001" as the main card
    And the total number of cards should be 1

  Scenario: Adding second card when main card exists
    Given the user has "CARD001" as the main card
    When I update the user with card number "CARD002"
    Then the user should have "CARD002" as the main card
    And "CARD001" should be card 1
    And the total number of cards should be 2

  Scenario: Adding new main card when two cards exist
    Given the user has the following cards in order:
      | CARD001 | CARD002 |
    When I update the user with card number "CARD003"
    Then the user should have "CARD003" as the main card
    And "CARD001" should be card 1
    And "CARD002" should be removed
    And the total number of cards should be 2