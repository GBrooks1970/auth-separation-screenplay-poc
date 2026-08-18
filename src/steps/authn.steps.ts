import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { stageManager } from '../support/stage.js';
import { AuthenticateWith } from '../screenplay/tasks/AuthenticateWith.js';
import { VerifyToken } from '../screenplay/tasks/VerifyToken.js';
import { TerminateSession, RefreshToken } from '../screenplay/tasks/TerminateSession.js';
import { DiscoverKeys } from '../screenplay/tasks/ManageProfile.js';
import { TheLastResponse } from '../screenplay/questions/TheLastResponse.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';

Given('{word} provides username {string} and password {string}', function (actorName: string, username: string, password: string) {
  const actor = stageManager.actorNamed(actorName);
  (actor as any).pendingCredentials = { username, password };
});

Given('{word} provides username {string} and an empty password', function (actorName: string, username: string) {
  const actor = stageManager.actorNamed(actorName);
  (actor as any).pendingCredentials = { username, password: '' };
});

When('{word} requests authentication from the AuthN API', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const creds = (actor as any).pendingCredentials || { username: 'alice@example.com', password: 'Password123!' };
  await actor.attemptsTo(AuthenticateWith.credentials(creds.username, creds.password));
});

Then('{word} should receive a valid JWT token and user ID {string}', async function (_pronoun: string, expectedUserId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(body.token, 'Expected JWT token in response');
  assert.equal(body.user_id, expectedUserId, `Expected user_id ${expectedUserId}`);
});

Then('the token type should be {string}', async function (expectedTokenType: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.equal(body.token_type, expectedTokenType);
});

Then('a refresh token should be issued', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(body.refresh_token, 'Expected refresh token in response');
});

Given('{word} holds an active signed JWT access token for user {string}', function (actorName: string, userId: string) {
  const actor = stageManager.actorNamed(actorName);
  const authn = stageManager.sut.authn;
  const token = authn.createActiveJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ token, userId, username: `${actorName.toLowerCase()}@example.com` });
});

Given('{word} holds an expired JWT token for user {string}', function (actorName: string, userId: string) {
  const actor = stageManager.actorNamed(actorName);
  const authn = stageManager.sut.authn;
  const token = authn.createExpiredJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ token, userId, username: `${actorName.toLowerCase()}@example.com` });
});

Given('{word} holds a tampered JWT token with an invalid signature', function (actorName: string) {
  const actor = stageManager.actorNamed(actorName);
  const fakeToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfdGFtcGVyZWQifQ.fake_tampered_signature';
  actor.abilityTo(HoldTokens).set({ token: fakeToken, userId: 'usr_tampered' });
});

When('{word} submits the token to the AuthN verification endpoint', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(VerifyToken.currentToken());
});

Then('the verification outcome should indicate valid', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.equal(body.valid, true);
});

Then('the returned user ID should be {string}', async function (expectedUserId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.equal(body.user_id, expectedUserId);
});

When('{word} requests public verification keys from {string}', async function (actorName: string, _endpoint: string) {
  const actor = stageManager.actorNamed(actorName);
  await actor.attemptsTo(DiscoverKeys.fromJwks());
});

Then('the JWKS key set should contain at least {int} RSA verification key', async function (count: number) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(Array.isArray(body.keys) && body.keys.length >= count);
  assert.equal(body.keys[0].kty, 'RSA');
});

Then('the key algorithm should be {string}', async function (expectedAlg: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.equal(body.keys[0].alg, expectedAlg);
});

Given('{word} is an authenticated user with an active session', async function (actorName: string) {
  const actor = stageManager.actorNamed(actorName);
  await actor.attemptsTo(AuthenticateWith.credentials('alice@example.com', 'Password123!'));
});

When('{word} sends a logout request with her bearer access token', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(TerminateSession.viaLogout());
});

Then('the session should be revoked', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.equal(body.revoked, true);
});

Then('subsequent token verification attempts for her token should return status {int}', async function (expectedStatus: number) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(VerifyToken.currentToken());
  const status = await actor.answer(TheLastResponse.statusCode());
  assert.equal(status, expectedStatus);
});

Given('{word} holds an active refresh token {string}', function (actorName: string, refreshToken: string) {
  const actor = stageManager.actorNamed(actorName);
  actor.abilityTo(HoldTokens).set({ refreshToken });
});

When('{word} requests a token refresh', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(RefreshToken.currentSession());
});

Then('a new JWT access token and refresh token should be returned', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(body.token);
  assert.ok(body.refresh_token);
});

Given('{word} attempts token refresh with a revoked refresh token {string}', function (actorName: string, refreshToken: string) {
  const actor = stageManager.actorNamed(actorName);
  actor.abilityTo(HoldTokens).set({ refreshToken });
});
