# signup user with auto generated user name
@global
@signup
Feature: Signup API allows end users to sign up as a user if their customer has allowed it

  @auto-username
  Scenario: When a user is signing up using sign up API then username should be generated automatically by backend
    Given a valid sign up body
    When We send a request with valid firstName, lastName, emailAddress, cardNumber
    Then the request should give status code 200
    Then verify the userName in the database for the given input

  @duplicate-email
  Scenario: Signup API should reject registration with existing email address
    Given a valid sign up body
    And a user already exists with email "existing@example.com"
    When We send a signup request with an existing email
    Then the request should give status code 400
    And the response should contain error about email already existing

  @duplicate-card
  Scenario: Signup API should reject registration with existing card number
    Given a valid sign up body
    And a user already exists with card number "12345678"
    When We send a signup request with an existing card number
    Then the request should give status code 400
    And the response should contain error about card number already existing

  @missing-fields
  Scenario: Signup API should validate required fields
    Given a valid sign up body
    When We send a signup request with missing required fields
    Then the request should give status code 400
    And the response should contain error about missing input

  @disabled-signup
  Scenario: Signup API should respect signup enabled setting
    Given a valid sign up body
    And signup feature is disabled for the domain
    When We send a request with valid firstName, lastName, emailAddress, cardNumber
    Then the request should give status code 400
    And the response should contain error about signup not allowed

  @admin-domain
  Scenario: Signup API should not allow signup on admin domain
    Given a valid sign up body
    And the subdomain is "admin"
    When We send a request with valid firstName, lastName, emailAddress, cardNumber
    Then the request should give status code 400
    And the response should contain error about signup not allowed
 