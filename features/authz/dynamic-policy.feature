Feature: Dynamic Attribute and Resource Ownership Policy Evaluation
  As an Authorisation Service
  I want to evaluate resource ownership attributes and context variables
  So that users can manage their own resources while preventing unauthorised cross-tenant access

  Scenario: User is permitted to update their own profile resource
    Given Bob is an authenticated user with user ID "usr_bob_456" and role "StandardUser"
    When he requests permission to "UPDATE" on resource "UserProfile" with resource owner "usr_bob_456"
    Then the AuthZ API should respond with status 200
    And the access decision outcome should be "PERMITTED"

  Scenario: User is denied updating another user's profile resource
    Given Bob is an authenticated user with user ID "usr_bob_456" and role "StandardUser"
    When he requests permission to "UPDATE" on resource "UserProfile" with resource owner "usr_alice_123"
    Then the AuthZ API should respond with status 403
    And the access decision outcome should be "DENIED"

  Scenario: Querying user roles and compiled permissions
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she requests her assigned roles from the AuthZ API
    Then the AuthZ API should respond with status 200
    And the returned roles list should contain "SecurityAdmin"
    And the permissions list should include "UserRole:UPDATE"
