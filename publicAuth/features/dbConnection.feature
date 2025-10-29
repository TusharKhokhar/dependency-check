@DBConnection
Feature: MongoDB connection handling

  Scenario: Should call connectToServer if credential is expired
    Given the DB is already connected
    When the getDb method is called after credentials expired
    Then the connectToServer method should be called