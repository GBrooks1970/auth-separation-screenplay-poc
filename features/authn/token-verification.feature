Feature: JWT Token Verification and Key Discovery
  As a Downstream Service or API Gateway
  I want to verify JWT identity tokens and inspect public verification keys
  So that user identity assertions are verified without coupling to credential stores

  Scenario: Verify active signed JWT token
    Given Alice holds an active signed JWT access token for user "usr_alice_123"
    When she submits the token to the AuthN verification endpoint
    Then the response status code should be 200
    And the verification outcome should indicate valid
    And the returned user ID should be "usr_alice_123"

  Scenario: Reject expired JWT token
    Given Bob holds an expired JWT token for user "usr_bob_456"
    When he submits the token to the AuthN verification endpoint
    Then the response status code should be 401
    And the error code should be "TOKEN_EXPIRED"

  Scenario: Reject malformed or tampered JWT token
    Given Charlie holds a tampered JWT token with an invalid signature
    When he submits the token to the AuthN verification endpoint
    Then the response status code should be 401
    And the error code should be "INVALID_TOKEN"

  Scenario: Retrieve JWKS public verification keys
    When Alice requests public verification keys from "/.well-known/jwks.json"
    Then the response status code should be 200
    And the JWKS key set should contain at least 1 RSA verification key
    And the key algorithm should be "RS256"
