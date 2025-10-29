@textExtraction
Feature: Extract text from translated files
  As a translation service user
  I want to extract text from my translated documents
  So that I can use it for text-to-speech conversion

  Scenario: Extract text and generate audio when audio flag is enabled
    Given the translated files are available for audio generation
    And the GenerateAudio flag is set to true
    When the translation lambda handler is invoked for text extraction
    Then the text extraction process is initiated
    And audio files are created using text-to-speech service
    And audio files are stored in S3
    And the database is updated with audio generation status
    And download links are added to the response

  Scenario: Skip audio generation when flag is not enabled
    Given the translated files are available for audio generation
    And the GenerateAudio flag is not set or is false
    When the translation lambda handler is invoked for text extraction
    Then the audio generation process is skipped
    And the regular file delivery process continues normally