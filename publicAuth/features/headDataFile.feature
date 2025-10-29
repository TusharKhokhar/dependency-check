@headDataFile
Feature: Head Data File Processing

  This feature covers the headDataFile function which retrieves and processes S3 object metadata
  to update file page count information and handle various file format edge cases.

  Background:
    Given a valid S3 client instance is available
    And a file object with basic properties is provided

  @pageCountMatching
  Scenario: Page count matches between metadata and file object
    Given S3 metadata contains pagecount of 5
    And the file object has TotalPagesPerFile of 5
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with the original file object
    And no page count modifications should be made

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - pub extension
    Given S3 metadata contains pagecount of 8
    And the file object has TotalPagesPerFile of 5
    And the file has OriginalFileNameWithExt ending with ".pub"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 8
    And PageRange should be set to "1-8"

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - htm extension
    Given S3 metadata contains pagecount of 3
    And the file object has TotalPagesPerFile of 1
    And the file has OriginalFileNameWithExt ending with ".htm"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 3
    And PageRange should be set to "1-3"

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - html extension
    Given S3 metadata contains pagecount of 7
    And the file object has TotalPagesPerFile of 2
    And the file has OriginalFileNameWithExt ending with ".html"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 7
    And PageRange should be set to "1-7"

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - xps extension
    Given S3 metadata contains pagecount of 15
    And the file object has TotalPagesPerFile of 10
    And the file has OriginalFileNameWithExt ending with ".xps"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 15
    And PageRange should be set to "1-15"

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - ods extension
    Given S3 metadata contains pagecount of 4
    And the file object has TotalPagesPerFile of 6
    And the file has OriginalFileNameWithExt ending with ".ods"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 4
    And PageRange should be set to "1-4"

  @unsureFormatsPageCountUpdate
  Scenario: Page count update for unsure format files - odp extension
    Given S3 metadata contains pagecount of 12
    And the file object has TotalPagesPerFile of 8
    And the file has OriginalFileNameWithExt ending with ".odp"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 12
    And PageRange should be set to "1-12"

  @emailUploadPageCountUpdate
  Scenario: Page count update for email uploaded files
    Given S3 metadata contains pagecount of 6
    And the file object has UploadedFrom set to "email"
    And the file has OriginalFileNameWithExt ending with ".pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 6
    And PageRange should be set to "1-6"

  @emailUploadPageCountUpdate
  Scenario: Page count update for email uploaded files with mixed case
    Given S3 metadata contains pagecount of 9
    And the file object has UploadedFrom set to "EMAIL"
    And the file has OriginalFileNameWithExt ending with ".docx"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 9
    And PageRange should be set to "1-9"

  @sureFormatsMorePages
  Scenario: S3 shows more pages than recorded for sure formats with single page range
    Given S3 metadata contains pagecount of 10
    And the file object has TotalPagesPerFile of 8
    And the file object has PageRange of "1-1"
    And the file has OriginalFileNameWithExt ending with ".pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 10

  @sureFormatsMorePages
  Scenario: S3 shows more pages than recorded for sure formats with matching page range end
    Given S3 metadata contains pagecount of 15
    And the file object has TotalPagesPerFile of 12
    And the file object has PageRange of "3-12"
    And the file has OriginalFileNameWithExt ending with ".docx"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 15
    And PageRange should be set to "3-15"

  @sureFormatsMorePages
  Scenario: S3 shows more pages than recorded for sure formats with non-matching page range end
    Given S3 metadata contains pagecount of 20
    And the file object has TotalPagesPerFile of 15
    And the file object has PageRange of "5-10"
    And the file has OriginalFileNameWithExt ending with ".xlsx"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should remain 15
    And PageRange should remain "5-10"

  @sureFormatsFewerPages
  Scenario: S3 shows fewer pages than recorded for sure formats with matching page range end
    Given S3 metadata contains pagecount of 8
    And the file object has TotalPagesPerFile of 12
    And the file object has PageRange of "2-12"
    And the file has OriginalFileNameWithExt ending with ".pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 8
    And PageRange should be set to "2-8"

  @sureFormatsFewerPages
  Scenario: S3 shows fewer pages than recorded for sure formats with non-matching page range end
    Given S3 metadata contains pagecount of 5
    And the file object has TotalPagesPerFile of 10
    And the file object has PageRange of "1-8"
    And the file has OriginalFileNameWithExt ending with ".docx"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 5
    And PageRange should remain "1-8"

  @bugFixTest
  Scenario: Bug fix - S3 fewer pages should check original TotalPagesPerFile before updating
    Given S3 metadata contains pagecount of 8
    And the file object has TotalPagesPerFile of 12
    And the file object has PageRange of "3-12"
    And the file has OriginalFileNameWithExt ending with ".pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 8
    And PageRange should be set to "3-8"

  @errorHandling
  Scenario: S3 HeadObjectCommand returns an error
    Given S3 HeadObjectCommand will return an error
    When headDataFile is called with valid S3 parameters
    Then the function should reject with the S3 error

  @missingMetadata
  Scenario: S3 metadata does not contain pagecount
    Given S3 metadata does not contain pagecount property
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with the original file object
    And no page count modifications should be made

  @invalidPageCount
  Scenario: S3 metadata contains invalid pagecount value
    Given S3 metadata contains pagecount of "invalid"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with the original file object
    And no page count modifications should be made

  @complexFileExtensions
  Scenario: File with multiple dots in filename - pdf extension
    Given S3 metadata contains pagecount of 7
    And the file object has TotalPagesPerFile of 5
    And the file has OriginalFileNameWithExt of "my.document.final.pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And the page count logic should be applied based on pdf extension

  @complexFileExtensions
  Scenario: File with multiple dots in filename - pub extension
    Given S3 metadata contains pagecount of 4
    And the file object has TotalPagesPerFile of 2
    And the file has OriginalFileNameWithExt of "newsletter.final.pub"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 4
    And PageRange should be set to "1-4"

  @edgeCasePageRanges
  Scenario: Page range adjustment with start page greater than 1 for more pages scenario
    Given S3 metadata contains pagecount of 20
    And the file object has TotalPagesPerFile of 15
    And the file object has PageRange of "5-15"
    And the file has OriginalFileNameWithExt ending with ".pdf"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 20
    And PageRange should be set to "5-20"

  @edgeCasePageRanges
  Scenario: Page range adjustment with start page greater than 1 for fewer pages scenario
    Given S3 metadata contains pagecount of 8
    And the file object has TotalPagesPerFile of 12
    And the file object has PageRange of "3-12"
    And the file has OriginalFileNameWithExt ending with ".docx"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 8
    And PageRange should be set to "3-8"

  @emailAndUnsureFormats
  Scenario: Email uploaded file with unsure format should prioritize email logic
    Given S3 metadata contains pagecount of 6
    And the file object has UploadedFrom set to "email"
    And the file has OriginalFileNameWithExt ending with ".pub"
    When headDataFile is called with valid S3 parameters
    Then the function should resolve with updated file object
    And TotalPagesPerFile should be set to 6
    And PageRange should be set to "1-6"