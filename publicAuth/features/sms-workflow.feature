@sms
Feature: SMS Notification for File Upload
  As a user of the printing service
  I want to receive SMS notifications about my uploaded files
  So that I can know my files are received and get necessary access information

  Background:
    Given the SMS notification service is operational
    And the customer name is "Test Library"

  Scenario: Guest user receives SMS with file count
    Given I am logged in as a guest user "John Doe"
    When I upload 2 files named "document1.pdf" and "document2.pdf"
    Then I should receive an SMS at "+1234567890"
    And the SMS should contain "John Doe"
    And the SMS should mention "2 files"
    And the SMS should contain the customer name "Test Library"

  Scenario: Library card user receives SMS with file count
    Given I am logged in with library card "12345678"
    When I upload 3 files
    Then I should receive an SMS at "+1234567890"
    And the SMS should contain "12345678"
    And the SMS should mention "3 files"
    And the SMS should contain the customer name "Test Library"

  Scenario: User receives SMS with release code
    Given I have a release code "5678"
    When I upload 1 file named "document.pdf"
    Then I should receive an SMS at "+1234567890"
    And the SMS should contain release code "5678"
    And the SMS should mention "1 file"
    And the SMS should contain the customer name "Test Library"

  Scenario: SMS with custom message
    Given I am logged in as a guest user "Jane Smith"
    And there is a custom SMS message "Thank you for using our service!"
    When I upload 2 files
    Then I should receive an SMS at "+1234567890"
    And the SMS should contain "Jane Smith"
    And the SMS should contain "Thank you for using our service!"
    And the SMS should mention "2 files"

  Scenario Outline: Different user types receive appropriate SMS templates
    Given I am logged in as a "<userType>" with identifier "<identifier>"
    When I upload <fileCount> files
    Then I should receive an SMS at "+1234567890"
    And the SMS should contain "<identifier>"
    And the SMS should mention "<fileCount> <fileText>"

    Examples:
      | userType     | identifier | fileCount | fileText |
      | guest        | John Doe   | 1         | file     |
      | library card | 87654321   | 2         | files    |
      | release code | 4321       | 3         | files    |
