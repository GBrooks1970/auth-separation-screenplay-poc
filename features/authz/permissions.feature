Feature: Role-Based Access Control Evaluation
  As an Authorization API
  I want to evaluate user identity assertions against policies
  So that application resources are protected from unauthorized access

  Scenario: Admin is permitted to update roles
    Given Alice is an authenticated user with role "SecurityAdmin"
    When she requests permission to "UPDATE" on resource "UserRole"
    Then the AuthZ API should respond with status 200
    And the access decision outcome should be "PERMITTED"

  Scenario: Standard user is denied access to security policies
    Given Bob is an authenticated user with role "StandardUser"
    When he requests permission to "DELETE" on resource "SecurityPolicy"
    Then the AuthZ API should respond with status 403
    And the access decision outcome should be "DENIED"
