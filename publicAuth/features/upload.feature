@global
Feature: Confirm File Upload API

  This api will be used to confirm file upload with all the required meta data for each file uploaded through signed
  urls

  @upload
  Scenario: Confirm file upload body contains device id and device name
    Given a request body with deviceId and deviceName
    When I send a POST request to confirmFileUpload
    Then The HTTP response status should be 200 for confirm file upload