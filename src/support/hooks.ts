import { BeforeAll, AfterAll, Before, setDefaultTimeout } from '@cucumber/cucumber';
import { stageManager } from './stage.js';

// Set generous timeout for multi-process cold starts in CI/local runs
setDefaultTimeout(30000);

BeforeAll({ timeout: 30000 }, async function () {
  await stageManager.sut.start();
});

AfterAll({ timeout: 15000 }, async function () {
  await stageManager.sut.stop();
});

Before(async function () {
  await stageManager.reset();
});
