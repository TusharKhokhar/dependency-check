@permissions
Feature: Custom Permissions

Scenario: As a user when I call get custom permission api I should receive the permissions in sorted order by least to most restrictive

    Given I have custom permissions saved in database
    When I call get custom permissions api
    Then I should receive the following permissions in sorted order by least to most restrictive