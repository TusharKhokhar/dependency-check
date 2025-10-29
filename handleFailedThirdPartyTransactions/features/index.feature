Feature: Retry Failed Third-Party Transactions

  Scenario: Successfully retry failed transactions
    Given there are failed transactions in the AuditLogs collection for active and non-deleted Proton configurations
    When the handler function is invoked
    Then the failed transactions are retried
    Then their statuses are updated to Success if processed successfully
    Then their retry count is incremented if they fail again

  Scenario: No failed transactions to retry
    Given there are no failed transactions in the AuditLogs collection
    When the handler function is invoked
    Then no transactions are retried
    And the function completes without errors

  Scenario: Configuration error during transaction processing
    Given there is a configuration error while processing transactions
    When the handler function is invoked
    Then the failed transactions remain in the Failed status