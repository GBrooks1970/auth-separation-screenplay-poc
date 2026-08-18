Feature: Role-Based Access Control Evaluation
  As an Authorisation Service
  I want to evaluate user identity assertions against defined RBAC policies
  So that application resources are protected from unpermitted access

  Scenario: Admin is permitted to update user roles
    Given Alice is an authenticated user with role "SecurityAdmin"
    When she requests permission to "UPDATE" on resource "UserRole"
    Then the AuthZ API should respond with status 200
    And the access decision outcome should be "PERMITTED"
    And the reason should indicate "SecurityAdmin role has full UPDATE grant on UserRole"

  Scenario: Standard user is permitted to read public resources
    Given Bob is an authenticated user with role "StandardUser"
    When he requests permission to "READ" on resource "UserProfile"
    Then the AuthZ API should respond with status 200
    And the access decision outcome should be "PERMITTED"

  Scenario: Standard user is denied access to modify security policies
    Given Bob is an authenticated user with role "StandardUser"
    When he requests permission to "DELETE" on resource "SecurityPolicy"
    Then the AuthZ API should respond with status 403
    And the access decision outcome should be "DENIED"

  Scenario: Guest user is denied administrative actions
    Given Charlie is an authenticated user with role "Guest"
    When he requests permission to "CREATE" on resource "UserRole"
    Then the AuthZ API should respond with status 403
    And the access decision outcome should be "DENIED"
