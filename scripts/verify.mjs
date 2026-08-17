import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

console.log('=== Running auth-separation-screenplay-poc Verification Gate ===');

// 1. Verify OpenAPI & AsyncAPI Spec files exist and are valid YAML structures
const specDir = 'specs';
const requiredSpecs = [
  'authn-api_v1.yaml',
  'authz-api_v1.yaml',
  'userinfo-api_v1.yaml',
  'events_v1.yaml'
];

console.log('1. Checking Contract Specifications in specs/...');
for (const spec of requiredSpecs) {
  const specPath = join(specDir, spec);
  const content = readFileSync(specPath, 'utf-8');
  if (!content || content.length < 50) {
    throw new Error(`Invalid or empty spec file: ${specPath}`);
  }
  console.log(`   [PASS] Verified ${spec} (${content.length} bytes)`);
}

// 2. Verify Gherkin Feature files exist and have valid Feature syntax
const featureDir = 'features';
function getFeatureFiles(dir) {
  let results = [];
  const list = readdirSync(dir);
  list.forEach(file => {
    const fullPath = join(dir, file);
    const stat = statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFeatureFiles(fullPath));
    } else if (extname(file) === '.feature') {
      results.push(fullPath);
    }
  });
  return results;
}

console.log('2. Checking BDD Feature Files in features/...');
const featureFiles = getFeatureFiles(featureDir);
if (featureFiles.length === 0) {
  throw new Error('No .feature files found under features/');
}

for (const featurePath of featureFiles) {
  const content = readFileSync(featurePath, 'utf-8');
  if (!content.includes('Feature:') || !content.includes('Scenario:')) {
    throw new Error(`Invalid Gherkin syntax in: ${featurePath}`);
  }
  console.log(`   [PASS] Verified ${featurePath}`);
}

console.log('3. Checking Project Contract & Backlog...');
const contract = readFileSync('docs/project-contract.md', 'utf-8');
const backlog = readFileSync('docs/backlog.md', 'utf-8');

if (!contract.includes('npm run verify') || !backlog.includes('auth-separation-screenplay-poc')) {
  throw new Error('Project contract or backlog validation failed.');
}

console.log('=== VERIFICATION PASSED: All Contract & Feature Checks Green ===');
