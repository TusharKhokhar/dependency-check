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

