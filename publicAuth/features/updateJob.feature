@updateJob
Feature: Update Job API

    Background:
        Given a valid job update request is prepared for standard customer

    Scenario: All Jobs are not processed
        And the job has not all files processed
        When the updateJob API is invoked
        Then the response should be success without print delivery

    Scenario: All jobs processed and automatic print delivery is disabled
        And all jobs are processed and automatic print delivery is disabled
        When the updateJob API is invoked
        Then the job should be marked as processed and notification should be sent
        And the response should be success without print delivery

    Scenario: All jobs processed and automatic print delivery is enabled - only device is selected
        And only device is selected with no location
        When the updateJob API is invoked
        Then the response should be success with print delivery processed

    Scenario: All jobs processed and automatic print delivery is enabled - device and location both are selected
        And device and location both are selected
        When the updateJob API is invoked
        Then the response should be success with print delivery processed

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and PDS is found, AutoSelectPrinter is false
        And only location is selected and PDS is found and only one device attached with thing
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 1 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and PDS is found, AutoSelectPrinter is true, Smart Printing enabled
        And only location is selected and PDS is found and more than one device attached with thing and smart Printing enabled
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 2 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and PDS is found, AutoSelectPrinter is true, Smart Printing disabled
        And only location is selected and PDS is found and more than one device attached with thing and smart Printing disabled
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 2 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and no PDS found on location, AutoSelectPrinter is false
        And only location is selected and PDS is not found on selected location
        And device found on selected location and only one device attached with thing and AutoSelectPrinter is false
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 3 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and no PDS found on location, AutoSelectPrinter is false
        And only location is selected and PDS is not found on selected location
        And device found on selected location and more than one device attached with thing and AutoSelectPrinter is false
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 3 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and no PDS found on location, AutoSelectPrinter is false
        And only location is selected and PDS is not found on selected location
        And device found on selected location and but thing is not associated with device
        When the updateJob API is invoked
        Then the response should be error with THING_NOT_FOUND

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and no PDS found on location, AutoSelectPrinter is true
        And only location is selected and PDS is not found on selected location
        And device found on selected location and only one device attached with thing and AutoSelectPrinter is true
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 1 function

    Scenario: All jobs processed and automatic print delivery is enabled - only location is selected and no PDS found on location, AutoSelectPrinter is true
        And only location is selected and PDS is not found on selected location
        And device found on selected location and more than one device attached with thing and AutoSelectPrinter is true
        When the updateJob API is invoked
        Then the response should be success with print delivery processed
        And it is called from device 2 function