import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { stageManager } from '../support/stage.js';
import { RetrieveProfile, ReplaceProfile, PatchProfile, DeleteProfile } from '../screenplay/tasks/ManageProfile.js';
import { TheProfileDetails } from '../screenplay/questions/TheProfileDetails.js';
import { TheLastResponse } from '../screenplay/questions/TheLastResponse.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';

Given('{word} is an authenticated user with user ID {string}', function (actorName: string, userId: string) {
  const actor = stageManager.actorNamed(actorName);
  const token = stageManager.sut.authn.createActiveJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ userId, token, username: `${actorName.toLowerCase()}@example.com` });
});

Given('{word} is an authenticated user', function (actorName: string) {
  const actor = stageManager.actorNamed(actorName);
  const userId = actorName === 'Alice' ? 'usr_alice_123' : 'usr_bob_456';
  const token = stageManager.sut.authn.createActiveJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ userId, token, username: `${actorName.toLowerCase()}@example.com` });
});

Given('an unauthenticated request without a bearer token', function () {
  const actor = stageManager.actorNamed('Anonymous');
  actor.abilityTo(HoldTokens).clear();
});

When('{word} requests her profile from the User Profile API', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(RetrieveProfile.forUser(tokens.userId || 'usr_alice_123'));
});

When('{word} requests profile details for non-existent user {string}', async function (_pronoun: string, userId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(RetrieveProfile.forUser(userId));
});

When('requesting profile details for user {string}', async function (userId: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(RetrieveProfile.forUser(userId, true));
});

Then('the profile name should be {string}', async function (expectedName: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const name = await actor.answer(TheProfileDetails.name());
  assert.equal(name, expectedName);
});

Then('the profile email should be {string}', async function (expectedEmail: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const email = await actor.answer(TheProfileDetails.email());
  assert.equal(email, expectedEmail);
});

Then('the profile preferences locale should be {string}', async function (expectedLocale: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const locale = await actor.answer(TheProfileDetails.locale());
  assert.equal(locale, expectedLocale);
});

When(
  '{word} replaces her profile with name {string}, email {string}, and theme {string}',
  async function (_pronoun: string, name: string, email: string, theme: string) {
    const actor = stageManager.theActorInTheSpotlight();
    const tokens = actor.abilityTo(HoldTokens);
    await actor.attemptsTo(ReplaceProfile.withDetails(tokens.userId || 'usr_alice_123', name, email, theme as any));
  }
);

Then('the updated profile name should be {string}', async function (expectedName: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const name = await actor.answer(TheProfileDetails.name());
  assert.equal(name, expectedName);
});

Then('the updated profile email should be {string}', async function (expectedEmail: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const email = await actor.answer(TheProfileDetails.email());
  assert.equal(email, expectedEmail);
});

Then('the profile preferences theme should be {string}', async function (expectedTheme: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const theme = await actor.answer(TheProfileDetails.theme());
  assert.equal(theme, expectedTheme);
});

When(
  '{word} patches her profile preferences with theme {string} and email notifications false',
  async function (_pronoun: string, theme: string) {
    const actor = stageManager.theActorInTheSpotlight();
    const tokens = actor.abilityTo(HoldTokens);
    await actor.attemptsTo(PatchProfile.withPreferences(tokens.userId || 'usr_alice_123', theme as any, false));
  }
);

Then('the profile preferences email notifications should be false', async function () {
  const actor = stageManager.theActorInTheSpotlight();
  const notifs = await actor.answer(TheProfileDetails.emailNotifications());
  assert.equal(notifs, false);
});

When('{word} attempts to update her profile with invalid email {string}', async function (_pronoun: string, invalidEmail: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(ReplaceProfile.withRawPayload(tokens.userId || 'usr_alice_123', { email: invalidEmail }));
});

When('{word} requests deletion of his profile', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(DeleteProfile.forUser(tokens.userId || 'usr_bob_456'));
});

Then('subsequent retrieval of profile {string} should return status {int}', async function (userId: string, expectedStatus: number) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(RetrieveProfile.forUser(userId));
  const status = await actor.answer(TheLastResponse.statusCode());
  assert.equal(status, expectedStatus);
});
