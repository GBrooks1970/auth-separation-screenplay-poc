import { Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { stageManager } from '../support/stage.js';
import { TheLastResponse } from '../screenplay/questions/TheLastResponse.js';

Then('the response status code should be {int}', async function (expectedStatus: number) {
  const actor = stageManager.theActorInTheSpotlight();
  const status = await actor.answer(TheLastResponse.statusCode());
  assert.equal(status, expectedStatus, `Expected status ${expectedStatus} but got ${status}`);
});

Then('the AuthZ API should respond with status {int}', async function (expectedStatus: number) {
  const actor = stageManager.theActorInTheSpotlight();
  const status = await actor.answer(TheLastResponse.statusCode());
  assert.equal(status, expectedStatus, `Expected status ${expectedStatus} but got ${status}`);
});

Then('the User Profile API should respond with status {int}', async function (expectedStatus: number) {
  const actor = stageManager.theActorInTheSpotlight();
  const status = await actor.answer(TheLastResponse.statusCode());
  assert.equal(status, expectedStatus, `Expected status ${expectedStatus} but got ${status}`);
});

Then('the error code should be {string}', async function (expectedCode: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const code = await actor.answer(TheLastResponse.errorCode());
  assert.equal(code, expectedCode, `Expected error code "${expectedCode}" but got "${code}"`);
});

Then('the validation error details should highlight field {string}', async function (expectedField: string) {
  const actor = stageManager.theActorInTheSpotlight();
  const field = await actor.answer(TheLastResponse.validationField());
  assert.equal(field, expectedField, `Expected validation error on field "${expectedField}" but got "${field}"`);
});
