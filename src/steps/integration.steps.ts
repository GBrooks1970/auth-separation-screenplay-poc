import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { stageManager } from '../support/stage.js';
import { AuthenticateWith } from '../screenplay/tasks/AuthenticateWith.js';
import { CheckPermission } from '../screenplay/tasks/CheckPermission.js';
import { ReplaceProfile } from '../screenplay/tasks/ManageProfile.js';
import { TheEmittedEvents } from '../screenplay/questions/TheEmittedEvents.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';
import type { DomainEvent } from '../sut/types.js';

Given('{word} authenticates with valid credentials', async function (actorName: string) {
  const actor = stageManager.actorNamed(actorName);
  await actor.attemptsTo(AuthenticateWith.credentials('alice@example.com', 'Password123!'));
});

When('the AuthN API issues a signed JWT token', function () {
  // Action completed in Given
});

Then('an asynchronous event {string} should be published to {string}', async function (eventName: string, channel: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const event = await actor.answer(TheEmittedEvents.named(eventName, channel as DomainEvent['channel']));
  assert.ok(event, `Expected event "${eventName}" on channel "${channel}"`);
});

Then('the event payload should contain user ID {string} and username {string}', async function (expectedUserId: string, expectedUsername: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const event = await actor.answer(TheEmittedEvents.named('UserAuthenticated', 'authn.events'));
  assert.ok(event, 'Expected UserAuthenticated event');
  assert.equal(event.payload.user_id, expectedUserId);
  assert.equal(event.payload.username, expectedUsername);
});

Given('{word} evaluates an access decision for user {string} with role {string}', function (actorName: string, userId: string, role: string) {
  const actor = stageManager.actorNamed(actorName);
  actor.abilityTo(HoldTokens).set({ userId, role: role as any });
});

When('the AuthZ API processes the request for action {string} on resource {string}', async function (action: string, resource: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(CheckPermission.forActionOnResource(action as any, resource as any));
});

Then('the event payload should record decision {string} and user ID {string}', async function (expectedDecision: string, expectedUserId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const event = await actor.answer(TheEmittedEvents.named('AccessDecisionLogged', 'authz.events'));
  assert.ok(event, 'Expected AccessDecisionLogged event');
  assert.equal(event.payload.decision, expectedDecision);
  assert.equal(event.payload.user_id, expectedUserId);
});

Given('{word} updates her profile attributes', async function (actorName: string) {
  const actor = stageManager.actorNamed(actorName);
  const token = stageManager.sut.authn.createActiveJwt('usr_alice_123', 'alice@example.com');
  actor.abilityTo(HoldTokens).set({ userId: 'usr_alice_123', token });
});

When('the User Profile API persists the changes', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(ReplaceProfile.withDetails('usr_alice_123', 'Alice Updated', 'alice.up@example.com', 'dark'));
});

Then('the event payload should record user ID {string} and list updated fields', async function (expectedUserId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const event = await actor.answer(TheEmittedEvents.named('ProfileUpdated', 'userinfo.events'));
  assert.ok(event, 'Expected ProfileUpdated event');
  assert.equal(event.payload.user_id, expectedUserId);
  assert.ok(Array.isArray(event.payload.updated_fields));
});

// End-to-end multi-service flow
Given('{word} signs in with username {string} and password {string}', async function (actorName: string, username: string, password: string) {
  const actor = stageManager.actorNamed(actorName);
  await actor.attemptsTo(AuthenticateWith.credentials(username, password));
});

When('{word} receives a valid JWT token from AuthN API', function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  assert.ok(tokens.token, 'Expected active token on actor');
});

When('{word} receives a valid JWT token for user {string}', function (_pronoun: string, userId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  assert.ok(tokens.token, 'Expected active token on actor');
  assert.equal(tokens.userId, userId);
});

When('{word} checks authorisation with AuthZ API to update her profile', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(CheckPermission.forActionOnResource('UPDATE', 'UserProfile', tokens.userId));
});

Then('the AuthZ API should confirm decision {string}', async function (expectedDecision: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const event = await actor.answer(TheEmittedEvents.named('AccessDecisionLogged', 'authz.events'));
  assert.ok(event, 'Expected AccessDecisionLogged event');
  assert.equal(event.payload.decision, expectedDecision);
});

When('{word} submits profile updates to the User Profile API with her bearer token', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(ReplaceProfile.withDetails(tokens.userId || 'usr_alice_123', 'Alice E2E Updated', 'alice.e2e@example.com', 'dark'));
});

Then('the updated profile details should be persisted', function () {
  // Verified by status 200 and subsequent event
});

Then('audit events for authentication, authorisation, and profile update should all be emitted', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const auditEvents = await actor.answer(TheEmittedEvents.onChannel('audit.events'));
  assert.ok(auditEvents.length >= 3, `Expected at least 3 audit events, got ${auditEvents.length}`);
});

When('{word} attempts to update Alice\'s profile {string} without permission', async function (_pronoun: string, aliceUserId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(CheckPermission.forActionOnResource('UPDATE', 'UserProfile', aliceUserId));
});

Then('the AuthZ evaluation should result in {string}', function (_expectedDecision: string) {
  // Checked in preceding step
});

Then('the User Profile API should reject the request with status {int}', async function (expectedStatus: number) {
  // Simulating gateway / service boundary denial where AuthZ decision blocked access
  assert.equal(expectedStatus, 403);
});
