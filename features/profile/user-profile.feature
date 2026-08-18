Feature: User Profile Retrieval
  As an Authenticated User
  I want to view stored profile details and application settings
  So that I can verify my user profile information

  Scenario: Alice retrieves her profile details
    Given Alice is an authenticated user with user ID "usr_alice_123"
    When she requests her profile from the User Profile API
    Then the response status code should be 200
    And the profile name should be "Alice Smith"
    And the profile email should be "alice@example.com"
    And the profile preferences locale should be "en-GB"

  Scenario: Attempting to retrieve a non-existent profile
    Given Bob is an authenticated user
    When he requests profile details for non-existent user "usr_nonexistent_999"
    Then the response status code should be 404
    And the error code should be "PROFILE_NOT_FOUND"

  Scenario: Unauthenticated caller cannot access profile endpoint
    Given an unauthenticated request without a bearer token
    When requesting profile details for user "usr_alice_123"
    Then the response status code should be 401
