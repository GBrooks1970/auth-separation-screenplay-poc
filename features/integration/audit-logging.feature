Feature: Cross-Service Asynchronous Audit Event Logging
  As an Audit Event Store
  I want to receive event notifications from AuthN, AuthZ, and User Profile services
  So that all security-sensitive actions are recorded in an immutable audit trail

  Scenario: Audit event emitted on successful authentication
    Given Alice authenticates with valid credentials
    When the AuthN API issues a signed JWT token
    Then an asynchronous event "UserAuthenticated" should be published to "authn.events"
    And the event payload should contain user ID "usr_alice_123" and username "alice@example.com"

  Scenario: Audit event emitted on access control decision
    Given Alice evaluates an access decision for user "usr_alice_123" with role "SecurityAdmin"
    When the AuthZ API processes the request for action "UPDATE" on resource "UserRole"
    Then an asynchronous event "AccessDecisionLogged" should be published to "authz.events"
    And the event payload should record decision "PERMITTED" and user ID "usr_alice_123"

  Scenario: Audit event emitted on profile mutation
    Given Alice updates her profile attributes
    When the User Profile API persists the changes
    Then an asynchronous event "ProfileUpdated" should be published to "userinfo.events"
    And the event payload should record user ID "usr_alice_123" and list updated fields
