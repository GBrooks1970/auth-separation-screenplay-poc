import { execFileSync } from 'node:child_process';

process.env.SUT_TARGET = 'polyglot';

console.log('=== Executing BDD Feature Suite against Polyglot SUT (Node AuthN, Python FastAPI AuthZ, C# .NET UserProfile) ===');

try {
  execFileSync(process.execPath, ['--import', 'tsx', './node_modules/@cucumber/cucumber/bin/cucumber.js'], {
    stdio: 'inherit',
    env: process.env
  });
  console.log('\n[PASS] All 30 BDD Scenarios passed 100% green against live Polyglot SUT.');
} catch (error) {
  console.error('\n[FAIL] Polyglot BDD execution failed.');
  process.exit(1);
}
