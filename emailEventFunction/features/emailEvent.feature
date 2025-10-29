Feature: Email Parsing Lambda Function

    Scenario: Parse valid email And Email flagged as spam or virus
        Given An email is sent to "admin@xyz.com".
        When The email is processed by the lambda function
        Then The simpleParser function correctly parses the email content, including attachments, headers, and HTML.
        And The email is flagged if it's detected as spam or contains a virus.

    Scenario: Attachment limit exceeded
        Given An email with more than 25 attachments is sent
        When The email is processed by the lambda function
        Then A notification is sent about the attachment limit being exceeded

    Scenario: Unsupported file format
        Given An email with an unsupported file format is sent
        When The email is processed by the lambda function
        Then A notification is sent about the unsupported file format

    Scenario: Without attachment with email signature
        Given An email without attachments but with a signature is sent
        When The email is processed by the lambda function
        Then A notification is sent about the 'email.html' file being submitted

    Scenario: Without attachment without email signature
        Given An email without attachments and without a signature is sent
        When The email is processed by the lambda function
        Then A notification is sent about the 'email.html' file being submitted
    
    Scenario: One Attachment with valid size and with email signature
        Given An email with one attachment of valid size and with a signature is sent
        When The email is processed by the lambda function
        Then A notification is sent about the submitted file, including 'email.html' and the attachments

    Scenario: One valid and one invalid size attachment with email signature
        Given An email with one valid and one invalid size attachment, along with a signature, is sent
        When The email is processed by the lambda function
        Then Failed notification should sent and all attachments should not processed

    Scenario: All attachments are valid
        Given An email with all attachments being valid is sent
        When The email is processed by the lambda function
        Then A notification is sent about the list of processed files

    Scenario: All attachments are invalid
        Given An email with all attachments being invalid is sent
        When The email is processed by the lambda function
        Then Two types of notifications are sent: The first includes 'email.html' and The second provides a list of attachments that were not processed

    Scenario: Provided "To" email is invalid
        Given An email is sent with an invalid recipient address.
        When The email is processed by the lambda function
        Then An error is caught, and error it should handle properly.

    Scenario: Provided "To" email is undefine
        Given An email event with undefined to email.
        When The email is processed by the lambda function
        Then The function should process the event without throwing an exception.

    Scenario: Valid attachments from customer Alias  
        Given an email from customer Alias with all attachments being valid is sent  
        When The email is processed by the lambda function  
        Then if customer Alias email address is valid, a notification is sent listing the processed files
    
    Scenario: Valid attachments from location Alias  
        Given an email from location Alias with all attachments being valid is sent  
        When The email is processed by the lambda function  
        Then if location Alias email address is valid, a notification is sent listing the processed files

    Scenario: Valid attachments from default customer Alias  
        Given an email from default customer Alias with all attachments being valid is sent  
        When The email is processed by the lambda function  
        Then if default customer Alias email address is valid, a notification is sent listing the processed files

    Scenario: Valid attachments from default location Alias  
        Given an email from default location Alias with all attachments being valid is sent  
        When The email is processed by the lambda function  
        Then if default location Alias email address is valid, a notification is sent listing the processed files
    Scenario: Email processing with retry logic for file uploads  
        Given an email with multiple file attachments is sent  
        When The email is processed by the lambda function  
        Then the first upload attempt fails and the uploads are retried and succeed