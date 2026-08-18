Feature: User Profile Update and Preference Modification
  As an Authenticated User
  I want to update my profile attributes and personal preferences
  So that my account settings reflect current information

  Scenario: Full profile replacement via PUT
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she replaces her profile with name "Alice Johnson", email "alice.j@example.com", and theme "dark"
    Then the response status code should be 200
    And the updated profile name should be "Alice Johnson"
    And the updated profile email should be "alice.j@example.com"
    And the profile preferences theme should be "dark"

  Scenario: Partial profile update via PATCH
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she patches her profile preferences with theme "light" and email notifications false
    Then the response status code should be 200
    And the profile preferences theme should be "light"
    And the profile preferences email notifications should be false

  Scenario: Validation error on malformed email address
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she attempts to update her profile with invalid email "not-an-email"
    Then the response status code should be 400
    And the validation error details should highlight field "email"

  Scenario: Profile deletion upon user request
    Given Bob is an authenticated user with user ID "usr_bob_456"
    When he requests deletion of his profile
    Then the response status code should be 204
    And subsequent retrieval of profile "usr_bob_456" should return status 404
