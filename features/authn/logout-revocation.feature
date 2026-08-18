Feature: User Logout and Token Revocation
  As an Authenticated User
  I want to terminate my active session and refresh tokens
  So that subsequent requests using revoked tokens are rejected

  Scenario: Alice terminates active session upon logout
    Given Alice is an authenticated user with an active session
    When she sends a logout request with her bearer access token
    Then the response status code should be 200
    And the session should be revoked
    And subsequent token verification attempts for her token should return status 401

  Scenario: Alice exchanges valid refresh token for a new access token
    Given Alice holds an active refresh token "rfr_alice_valid_001"
    When she requests a token refresh
    Then the response status code should be 200
    And a new JWT access token and refresh token should be returned

  Scenario: Reject token refresh using an invalidated refresh token
    Given Bob attempts token refresh with a revoked refresh token "rfr_revoked_999"
    When he requests a token refresh
    Then the response status code should be 401
    And the error code should be "INVALID_REFRESH_TOKEN"
