import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { stageManager } from '../support/stage.js';
import { CheckPermission } from '../screenplay/tasks/CheckPermission.js';
import { TheAccessDecision } from '../screenplay/questions/TheAccessDecision.js';
import { TheLastResponse } from '../screenplay/questions/TheLastResponse.js';
import { HoldTokens } from '../screenplay/abilities/HoldTokens.js';
import type { ActionVerb, ResourceName, UserRole } from '../sut/types.js';

Given('{word} is an authenticated user with role {string}', function (actorName: string, role: string) {
  const actor = stageManager.actorNamed(actorName);
  const userId = actorName === 'Alice' ? 'usr_alice_123' : actorName === 'Bob' ? 'usr_bob_456' : 'usr_charlie_789';
  const token = stageManager.sut.authn.createActiveJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ userId, role: role as UserRole, token });
});

Given('{word} is an authenticated user with user ID {string} and role {string}', function (actorName: string, userId: string, role: string) {
  const actor = stageManager.actorNamed(actorName);
  const token = stageManager.sut.authn.createActiveJwt(userId, `${actorName.toLowerCase()}@example.com`);
  actor.abilityTo(HoldTokens).set({ userId, role: role as UserRole, token });
});

When('{word} requests permission to {string} on resource {string}', async function (_pronoun: string, action: string, resource: string) {
  const actor = stageManager.theActorInTheSpotlight();
  await actor.attemptsTo(CheckPermission.forActionOnResource(action as ActionVerb, resource as ResourceName));
});

When(
  '{word} requests permission to {string} on resource {string} with resource owner {string}',
  async function (_pronoun: string, action: string, resource: string, resourceOwner: string) {
    const actor = stageManager.theActorInTheSpotlight();
    await actor.attemptsTo(CheckPermission.forActionOnResource(action as ActionVerb, resource as ResourceName, resourceOwner));
  }
);

When('{word} requests her assigned roles from the AuthZ API', async function (_pronoun: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const tokens = actor.abilityTo(HoldTokens);
  await actor.attemptsTo(CheckPermission.queryRoles(tokens.userId || 'usr_alice_123'));
});

Then('the access decision outcome should be {string}', async function (expectedDecision: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const outcome = await actor.answer(TheAccessDecision.outcome());
  assert.equal(outcome, expectedDecision);
});

Then('the reason should indicate {string}', async function (expectedReasonSubstring: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const reason = await actor.answer(TheAccessDecision.reason());
  assert.ok(reason && reason.includes(expectedReasonSubstring), `Expected reason to include "${expectedReasonSubstring}", got: "${reason}"`);
});

Then('the returned roles list should contain {string}', async function (expectedRole: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(Array.isArray(body.roles) && body.roles.includes(expectedRole));
});

Then('the permissions list should include {string}', async function (expectedPermission: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const body = await actor.answer(TheLastResponse.body());
  assert.ok(Array.isArray(body.permissions) && body.permissions.includes(expectedPermission));
});
