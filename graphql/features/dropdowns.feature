# dropDowns.feature
@DropDowns
Feature: DropDowns

    Scenario: Customer with both permission Add_Proton and Add_Account_Sync
        Given the customer has only both permission
        When I request the dropdown values
        Then the response should include only these two options in ThirdPartySoftwareType

    Scenario: Customer with only the Add_Proton permission
        Given the customer has only the "Add_Proton" permission
        When I request the dropdown values with only one permission
        Then the response should include only "Proton Integration" in ThirdPartySoftwareType
