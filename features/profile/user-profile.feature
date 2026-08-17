Feature: User Profile Management
  As an Authenticated User
  I want to view my profile details
  So that I can verify my application settings

  Scenario: Retrieve profile details for authenticated user
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she requests her profile from the User Profile API
    Then the response status code should be 200
    And the profile name should be "Alice Smith"
    And the profile email should be "alice@example.com"
