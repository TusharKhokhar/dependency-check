@Group
Feature: Group API Management

  Scenario: Ensure each PrintGroup entry includes _id when updating the print configuration group using printer group
    Given a PrintGroups array is configured to print using a printer group
    When the updateGroup API is called
    Then each PrintGroup entry should contain a valid _id

  Scenario: Users with null or missing GroupQuotas are assigned an empty array before updating
    Given the users exist in the database with null GroupQuotas
    When the updateGroup API is called
    Then users that previously had null or missing GroupQuotas should now have empty array

  Scenario: Add quota group to permission group
    Given a request to add a quota group to a specific permission group
    When the updateGroup API is called
    Then the quota group should be added to the permission group and to all users associated with that permission group

  Scenario: Remove quota group from permission group
    Given a request to remove a quota group from a specific permission group
    When the updateGroup API is called
    Then the quota group should be removed from the permission group and from all users associated with that quota group

  Scenario: Successfully add a new group with EasyBooking enabled
    Given a request to add a EasyBooking group with valid input data
    When the addGroup API is called for EasyBooking
    Then the response should contain the group with EasyBooking settings

  Scenario: Successfully update an existing EasyBooking group
    Given a request to update an existing EasyBooking group with new details
    When the updateGroup API is called for EasyBooking
    Then the response should reflect the updated EasyBooking settings

  Scenario: Successfully fetch an EasyBooking group by ID
    Given a request to fetch an existing EasyBooking group by ID
    When the getGroup API is called for EasyBooking
    Then the response should contain the correct EasyBooking group details

  Scenario: Successfully update EasyBooking group priorities
    Given multiple EasyBooking groups exist with priorities
    When the updateEasyBookingGroupPriorities API is called with reordered group IDs
    Then the groups should be updated with new priorities based on array index

  Scenario: Validate EasyBooking group priorities update with missing groups
    Given some EasyBooking groups exist in database
    When the updateEasyBookingGroupPriorities API is called with incomplete group IDs list
    Then the API should return an error about missing groups

  Scenario: Validate EasyBooking group priorities update with invalid group IDs
    Given some EasyBooking groups exist in database  
    When the updateEasyBookingGroupPriorities API is called with invalid group IDs
    Then the API should return an error about invalid groups

  Scenario: Successfully rearrange EasyBooking priorities when group is deleted
    Given multiple EasyBooking groups exist with sequential priorities
    When an EasyBooking group with middle priority is deleted
    Then the remaining groups with higher priorities should be decremented by 1

  Scenario: Filter groups by EasyBooking type using getGroups API
    Given multiple groups of different types exist including EasyBooking groups
    When the getGroups API is called with groupTypes filter for EasyBooking
    Then only EasyBooking groups should be returned

  Scenario: Get EasyBooking groups sorted by priority
    Given multiple EasyBooking groups exist with different priorities
    When the getGroups API is called with groupTypes EasyBooking and sort by Priority
    Then the groups should be returned sorted by priority field

  Scenario: Prevent deletion of EasyBooking group when it has references
    Given an EasyBooking group exists with associated references
    When the groupDeleted API is called to delete the referenced group
    Then the API should return an error about disassociating references first

  Scenario: Successfully delete EasyBooking group without references and rearrange priorities
    Given multiple EasyBooking groups exist without references
    When the groupDeleted API is called to delete a group without references
    Then the group should be deleted successfully and remaining priorities should be rearranged
    
  Scenario: Add a Permission group with EasyBookingGroupID association
    Given an existing EasyBooking group in the database
    And a request to add a Permission group with EasyBookingGroupID reference
    When the addGroup API is called for Permission group
    Then the response should contain the Permission group with EasyBookingGroupID
    And the Permission group should be successfully associated with the EasyBooking group

  Scenario: Update a Permission group to associate with EasyBookingGroupID
    Given an existing Permission group without EasyBookingGroupID
    And an existing EasyBooking group in the database
    When the updateGroup API is called to add EasyBookingGroupID association
    Then the Permission group should be updated with the EasyBookingGroupID
    And the association should be properly established

  Scenario: Get a Permission group with EasyBookingGroupID association
    Given an existing Permission group with EasyBookingGroupID association
    When the getGroup API is called for the Permission group
    Then the response should contain the Permission group details
    And the EasyBookingGroupID should be included in the response

  Scenario: Prevent adding EasyBooking group with duplicate priority
    Given an existing EasyBooking group with priority 1 for duplicate test
    And a request to add another EasyBooking group with the same priority 1
    When the addGroup API is called for EasyBooking
    Then the API should return an error about duplicate priority

  Scenario: Validate EasyBooking group priority bounds on creation
    Given existing EasyBooking groups with priorities 1 and 2
    And a request to add EasyBooking group with priority 0
    When the addGroup API is called for EasyBooking
    Then the API should return an error about invalid priority value

  Scenario: Validate EasyBooking group priority upper bound on creation
    Given existing EasyBooking groups with priorities 1 and 2
    And a request to add EasyBooking group with priority 5
    When the addGroup API is called for EasyBooking
    Then the API should return an error about invalid priority value

  Scenario: Successfully add EasyBooking group with valid priority within bounds
    Given existing EasyBooking groups with priorities 1 and 2
    And a request to add EasyBooking group with priority 3
    When the addGroup API is called for EasyBooking
    Then the response should contain the group with EasyBooking settings

  Scenario: Verify priority is not updatable via updateGroup API
    Given an existing EasyBooking group with priority 1 for update test
    And a request to update the EasyBooking group with new priority 2
    When the updateGroup API is called for EasyBooking
    Then the group priority should remain unchanged

