import { BeforeAll, AfterAll, Before } from '@cucumber/cucumber';
import { stageManager } from './stage.js';

BeforeAll(async function () {
  await stageManager.sut.start();
});

AfterAll(async function () {
  await stageManager.sut.stop();
});

Before(function () {
  stageManager.reset();
});
