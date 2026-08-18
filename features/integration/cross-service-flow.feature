Feature: End-to-End Cross-Service Workflow
  As a Client Application
  I want to authenticate with AuthN, check permissions with AuthZ, and update data in User Profile
  So that service boundaries remain decoupled while delivering a cohesive user journey

  Scenario: Complete authenticated and authorised profile update flow
    Given Alice signs in with username "alice@example.com" and password "Password123!"
    When she receives a valid JWT token from AuthN API
    And she checks authorisation with AuthZ API to update her profile
    Then the AuthZ API should confirm decision "PERMITTED"
    When she submits profile updates to the User Profile API with her bearer token
    Then the User Profile API should respond with status 200
    And the updated profile details should be persisted
    And audit events for authentication, authorisation, and profile update should all be emitted

  Scenario: Unauthorised profile mutation attempt across service boundary
    Given Bob signs in with username "bob@example.com" and password "Password123!"
    When he receives a valid JWT token for user "usr_bob_456"
    And he attempts to update Alice's profile "usr_alice_123" without permission
    Then the AuthZ evaluation should result in "DENIED"
    And the User Profile API should reject the request with status 403
