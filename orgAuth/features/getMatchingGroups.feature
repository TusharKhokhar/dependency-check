@GetMatchingGroups
Feature: getMatchingGroups Function Testing

    This feature tests the getMatchingGroups function across all authentication providers (SIP2, Sirsi, Polaris, Innovative)
    to ensure proper group assignment based on EasyBooking group conditions and priority.

    Background:
        Given the getMatchingGroups function is available
        And the database connection is mocked
        And the logger is mocked

    Scenario: getMatchingGroups returns highest priority group when multiple groups match
        Given multiple EasyBooking groups exist with different priorities:
            | GroupName           | Priority | Field         | Condition | Value | SingleMatch |
            | High Priority Group | 1        | institutionId | equal     | TBS   | true        |
            | Low Priority Group  | 5        | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should return group IDs for "High Priority Group"
        And the group with priority 1 should be selected first

    Scenario: getMatchingGroups returns empty array when no groups match conditions
        Given EasyBooking groups exist with conditions that don't match:
            | GroupName      | Priority | Field         | Condition | Value   | SingleMatch |
            | Specific Group | 1        | institutionId | equal     | NOMATCH | true        |
        And the groups collection returns these groups
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should return empty array

    Scenario: getMatchingGroups handles SingleMatch true condition correctly
        Given an EasyBooking group exists with SingleMatch true:
            | GroupName         | Priority | Field | Condition | Value | SingleMatch |
            | SingleMatch Group | 1        | roles | equal     | ADMIN | true        |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload containing array values:
            | Field | Value      |
            | roles | ADMIN,USER |
        Then the function should check only the first value "ADMIN"
        And the function should return group IDs for "SingleMatch Group"

    Scenario: getMatchingGroups handles SingleMatch false condition correctly
        Given an EasyBooking group exists with SingleMatch false:
            | GroupName        | Priority | Field | Condition | Value | SingleMatch |
            | MultiMatch Group | 1        | roles | equal     | ADMIN | false       |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload containing array values:
            | Field | Value      |
            | roles | USER,ADMIN |
        Then the function should check all values in the array
        And the function should return group IDs for "MultiMatch Group"

    Scenario: getMatchingGroups skips inactive groups
        Given both active and inactive EasyBooking groups exist:
            | GroupName      | Priority | IsActive | Field         | Condition | Value | SingleMatch |
            | Inactive Group | 1        | false    | institutionId | equal     | TBS   | true        |
            | Active Group   | 2        | true     | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        And the model.groups.getGroup returns the active group
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should skip inactive groups
        And the function should return group IDs for "Active Group"

    Scenario: getMatchingGroups skips inactive EasyBookingGroups
        Given an EasyBooking group exists with inactive subgroups:
            | GroupName   | Priority | SubgroupActive | Field         | Condition | Value | SingleMatch |
            | Mixed Group | 1        | false          | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should skip inactive subgroups
        And the function should return empty array

    Scenario Outline: getMatchingGroups handles different condition types correctly
        Given an EasyBooking group exists with condition type "<conditionType>":
            | GroupName       | Priority | Field   | Condition       | Value        | SingleMatch |
            | Condition Group | 1        | <field> | <conditionType> | <matchValue> | true        |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload:
            | Field   | Value          |
            | <field> | <payloadValue> |
        Then the function should evaluate the "<conditionType>" condition correctly
        And the function should return <expectedResult>

        Examples:
            | conditionType | field         | matchValue | payloadValue | expectedResult                  |
            | equal         | status        | ACTIVE     | ACTIVE       | group IDs for "Condition Group" |
            | equal         | status        | ACTIVE     | INACTIVE     | empty array                     |
            | equal         | accountNumber | 12,13,14   | 13           | group IDs for "Condition Group" |
            | equal         | accountNumber | 12,13,14   | 15           | empty array                     |
            | not_equal     | status        | BLOCKED    | ACTIVE       | group IDs for "Condition Group" |
            | not_equal     | status        | BLOCKED    | BLOCKED      | empty array                     |
            | not_equal     | accountNumber | 10,11,12   | 13           | group IDs for "Condition Group" |
            | not_equal     | accountNumber | 10,11,12   | 11           | empty array                     |
            | greater_than  | age           | 18         | 25           | group IDs for "Condition Group" |
            | greater_than  | age           | 18         | 15           | empty array                     |
            | less_than     | score         | 100        | 85           | group IDs for "Condition Group" |
            | less_than     | score         | 100        | 105          | empty array                     |
            | starts_with   | userCode      | STU        | STUDENT123   | group IDs for "Condition Group" |
            | starts_with   | userCode      | STU        | FACULTY456   | empty array                     |

    Scenario: getMatchingGroups handles between condition correctly
        Given an EasyBooking group exists with between condition:
            | GroupName   | Priority | Field | Condition | MinValue | MaxValue | SingleMatch |
            | Range Group | 1        | grade | between   | 70       | 90       | true        |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload:
            | Field | Value |
            | grade | 80    |
        Then the function should evaluate the between condition with range 70-90
        And the function should return group IDs for "Range Group"

    Scenario: getMatchingGroups handles missing fields in payload
        Given an EasyBooking group exists requiring a specific field:
            | GroupName      | Priority | Field         | Condition | Value | SingleMatch |
            | Required Field | 1        | requiredField | equal     | VALUE | true        |
        And the groups collection returns these groups
        When I call getMatchingGroups with payload missing the required field:
            | Field      | Value |
            | otherField | test  |
        Then the function should skip groups with missing field conditions
        And the function should return empty array

    Scenario: getMatchingGroups handles multiple conditions with AND logic
        Given an EasyBooking group exists with multiple conditions:
            | GroupName       | Priority | Conditions                                                 |
            | Multi Condition | 1        | institutionId=TBS AND patronType=STUDENT AND status=ACTIVE |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with payload matching all conditions:
            | Field         | Value   |
            | institutionId | TBS     |
            | patronType    | STUDENT |
            | status        | ACTIVE  |
        Then the function should verify all conditions match
        And the function should return group IDs for "Multi Condition"

    Scenario: getMatchingGroups fails when any condition in AND logic fails
        Given an EasyBooking group exists with multiple conditions:
            | GroupName       | Priority | Conditions                                                 |
            | Multi Condition | 1        | institutionId=TBS AND patronType=FACULTY AND status=ACTIVE |
        And the groups collection returns these groups
        When I call getMatchingGroups with payload where one condition fails:
            | Field         | Value   |
            | institutionId | TBS     |
            | patronType    | STUDENT |
            | status        | ACTIVE  |
        Then the function should fail when patronType doesn't match FACULTY
        And the function should return empty array

    Scenario: getMatchingGroups includes PrintConfigurationGroupID when present
        Given an EasyBooking group exists with PrintConfigurationGroupID:
            | GroupName          | Priority | Field         | Condition | Value | SingleMatch |
            | Print Config Group | 1        | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        And the model.groups.getGroup returns group with PrintConfigurationGroupID "printConfig1"
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should return both permission group and print configuration group
        And the result should contain both group IDs

    Scenario: getMatchingGroups handles comma-separated string values
        Given an EasyBooking group exists for comma-separated values:
            | GroupName | Priority | Field | Condition | Value | SingleMatch |
            | CSV Group | 1        | roles | equal     | ADMIN | false       |
        And the groups collection returns these groups
        And the matching group exists in the system
        When I call getMatchingGroups with comma-separated payload:
            | Field | Value              |
            | roles | USER, ADMIN, GUEST |
        Then the function should split the comma-separated string
        And the function should evaluate each value separately
        And the function should return group IDs for "CSV Group"

    Scenario: getMatchingGroups handles database errors gracefully
        Given the database query fails with an error
        When I call getMatchingGroups with any payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should handle the database error gracefully
        And the function should return undefined

    Scenario: getMatchingGroups handles model.groups.getGroup errors gracefully
        Given an EasyBooking group exists:
            | GroupName   | Priority | Field         | Condition | Value | SingleMatch |
            | Error Group | 1        | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        And the model.groups.getGroup throws an error
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should handle the getGroup error gracefully
        And the function should return empty array

    Scenario: getMatchingGroups returns empty array when no EasyBooking groups exist
        Given no EasyBooking groups exist in the database
        When I call getMatchingGroups with any payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should return empty array

    Scenario: getMatchingGroups handles null and undefined payload values
        Given an EasyBooking group exists:
            | GroupName  | Priority | Field         | Condition | Value | SingleMatch |
            | Test Group | 1        | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        When I call getMatchingGroups with null payload values:
            | Field         | Value |
            | institutionId | null  |
        Then the function should skip groups with null field values
        And the function should return empty array

    Scenario: getMatchingGroups stops at first matching group after priority sorting
        Given multiple EasyBooking groups exist that could match:
            | GroupName       | Priority | Field         | Condition | Value | SingleMatch |
            | First Priority  | 1        | institutionId | equal     | TBS   | true        |
            | Second Priority | 2        | institutionId | equal     | TBS   | true        |
            | Third Priority  | 3        | institutionId | equal     | TBS   | true        |
        And the groups collection returns these groups
        And the model.groups.getGroup returns the first priority group
        When I call getMatchingGroups with payload:
            | Field         | Value |
            | institutionId | TBS   |
        Then the function should sort groups by priority
        And the function should stop after finding the first match
        And the function should return group IDs for "First Priority"
        And the function should not process lower priority groups