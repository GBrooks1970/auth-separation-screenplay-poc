#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { Parser as AsyncApiParser } from '@asyncapi/parser';
import { AstBuilder, GherkinClassicTokenMatcher, Parser as GherkinParser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';

console.log('=== Running auth-separation-screenplay-poc Verification Gate ===');

// 1. Verify OpenAPI Specs
const requiredSpecs = [
  'specs/authn-api_v1.yaml',
  'specs/authz-api_v1.yaml',
  'specs/userinfo-api_v1.yaml'
];

console.log('1. Checking OpenAPI 3.1 Contract Specifications in specs/...');
for (const specPath of requiredSpecs) {
  const content = readFileSync(specPath, 'utf-8');
  if (!content.includes('openapi: 3.1.0')) {
    throw new Error(`Expected OpenAPI 3.1.0 header in ${specPath}`);
  }
  console.log(`   [PASS] Verified ${specPath} (${content.length} bytes)`);
}

// 2. Validate AsyncAPI 3.0 Spec using @asyncapi/parser
console.log('2. Checking AsyncAPI 3.0 Contract Specification with @asyncapi/parser...');
const asyncApiSpec = 'specs/events_v1.yaml';
const asyncApiSource = readFileSync(asyncApiSpec, 'utf-8');
const { document, diagnostics } = await new AsyncApiParser().parse(asyncApiSource);
const asyncErrors = diagnostics ? diagnostics.filter((d) => d.severity === 0) : [];
if (asyncErrors.length > 0 || !document) {
  throw new Error(`AsyncAPI validation failed with ${asyncErrors.length} errors.`);
}
console.log(`   [PASS] Verified ${asyncApiSpec} (valid AsyncAPI ${document.version()}, ${document.channels()?.all()?.length ?? 0} channels)`);

// 3. Verify BDD Gherkin Feature Suite with @cucumber/gherkin
console.log('3. Checking BDD Gherkin Feature Suite with @cucumber/gherkin...');
function getFeatureFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  for (const file of list) {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFeatureFiles(fullPath));
    } else if (extname(file) === '.feature') {
      results.push(fullPath);
    }
  }
  return results.sort();
}

const featureFiles = getFeatureFiles('features');
if (featureFiles.length === 0) {
  throw new Error('No .feature files found under features/');
}

const gherkinParser = new GherkinParser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
let totalScenarios = 0;

for (const featurePath of featureFiles) {
  const content = readFileSync(featurePath, 'utf-8');
  const declared = content.split(/\r?\n/).filter((l) => /^\s*Feature:/.test(l)).length;
  if (declared !== 1) {
    throw new Error(`${featurePath} must declare exactly one Feature: block (found ${declared})`);
  }

  const parsedDoc = gherkinParser.parse(content);
  const scenarios = (parsedDoc.feature?.children ?? []).filter((c) => c.scenario).length;
  if (scenarios === 0) {
    throw new Error(`${featurePath} parsed cleanly but declares no scenarios.`);
  }
  totalScenarios += scenarios;
  console.log(`   [PASS] Verified ${featurePath} (${scenarios} scenario(s))`);
}
console.log(`   [INFO] Total canonical BDD scenarios: ${totalScenarios} across ${featureFiles.length} feature files.`);

// 4. Verify Project Contract and Backlog alignment
console.log('4. Checking Project Contract & Backlog...');
const contract = readFileSync('docs/project-contract.md', 'utf-8');
const backlog = readFileSync('docs/backlog.md', 'utf-8');

if (!contract.includes('npm run verify') || !backlog.includes('auth-separation-screenplay-poc')) {
  throw new Error('Project contract or backlog validation failed.');
}
console.log('   [PASS] Verified docs/project-contract.md and docs/backlog.md');

console.log('\n=== VERIFICATION PASSED: All Contract & Feature Checks Green ===');
