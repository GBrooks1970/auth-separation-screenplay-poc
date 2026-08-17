Feature: Cross-Service Audit Event Logging
  As an Audit Event Store
  I want to receive event notifications from AuthN, AuthZ, and Profile services
  So that all security-sensitive actions are recorded in an immutable audit log

  Scenario: Audit event logged on access decision
    Given Alice evaluates an access decision for user "usr_alice_123"
    When the AuthZ API processes the request
    Then an asynchronous audit event "AccessDecisionLogged" should be emitted
    And the event payload should contain user ID "usr_alice_123" and decision "PERMITTED"
