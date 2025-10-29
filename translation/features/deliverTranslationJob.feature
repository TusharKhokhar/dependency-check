@deliverTranslatedFiles
Feature: Translation lambda handler deliver the translated files to the S3 bucket
  As a translation lambda handler
  I want to deliver the translated files to the user over email or to the IoT Things

  Scenario: Deliver the translated files when Delivery method defined as email
    Given the translated files are available
    When the translation lambda handler is invoked
    Then the translated files are delivered to the user over email if the delivery method is email

  Scenario: Deliver the translated files when Delivery method defined as Thing
    Given the translated files are available
    When the translation lambda handler is invoked
    Then the translated files are delivered to the IoT Thing if the delivery method was selected as Thing

  Scenario: Deliver the translated files when Delivery method defined as both Thing and Email
    Given the translated files are available
    When the translation lambda handler is invoked
    Then the translated files are delivered to the IoT Thing
    Then the translated files are delivered to the user over email