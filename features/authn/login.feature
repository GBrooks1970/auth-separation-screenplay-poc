Feature: User Authentication and Token Issuance
  As a User
  I want to authenticate with valid credentials
  So that I am issued a trusted identity token

  Scenario: Authenticate with valid credentials
    Given Alice provides username "alice@example.com" and password "Password123!"
    When she requests authentication from the AuthN API
    Then the response status code should be 200
    And she should receive a valid JWT token and user ID "usr_alice_123"

  Scenario: Authenticate with invalid credentials
    Given Bob provides username "bob@example.com" and password "WrongPassword!"
    When he requests authentication from the AuthN API
    Then the response status code should be 401
