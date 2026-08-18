Feature: User Authentication and Token Issuance
  As a User
  I want to authenticate with valid credentials
  So that I receive a cryptographically signed identity token and user identifier

  Scenario: Alice authenticates with valid credentials
    Given Alice provides username "alice@example.com" and password "Password123!"
    When she requests authentication from the AuthN API
    Then the response status code should be 200
    And she should receive a valid JWT token and user ID "usr_alice_123"
    And the token type should be "Bearer"
    And a refresh token should be issued

  Scenario: Bob attempts authentication with an incorrect password
    Given Bob provides username "bob@example.com" and password "WrongPassword!"
    When he requests authentication from the AuthN API
    Then the response status code should be 401
    And the error code should be "INVALID_CREDENTIALS"

  Scenario: Charlie attempts authentication with an unregistered username
    Given Charlie provides username "unknown@example.com" and password "Password123!"
    When he requests authentication from the AuthN API
    Then the response status code should be 401
    And the error code should be "INVALID_CREDENTIALS"

  Scenario: Malformed login request with missing password
    Given Alice provides username "alice@example.com" and an empty password
    When she requests authentication from the AuthN API
    Then the response status code should be 400
    And the validation error details should highlight field "password"
