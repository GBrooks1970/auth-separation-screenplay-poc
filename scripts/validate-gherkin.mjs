#!/usr/bin/env node
/**
 * Parses all canonical BDD Gherkin feature files in features/ using @cucumber/gherkin.
 *
 * Enforces:
 * - Exactly one Feature: declaration per .feature file.
 * - Clean AST parsing with zero Gherkin syntax errors.
 * - At least one Scenario per feature file.
 * - Minimum expected scenario count across the feature suite.
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';

const DIR = 'features';
const MIN_EXPECTED_SCENARIOS = 15;

async function getFeatureFiles(dir) {
  let results = [];
  const entries = await readdir(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const entryStat = await stat(fullPath);
    if (entryStat.isDirectory()) {
      results = results.concat(await getFeatureFiles(fullPath));
    } else if (extname(entry) === '.feature') {
      results.push(fullPath);
    }
  }
  return results.sort();
}

const files = await getFeatureFiles(DIR);
if (files.length === 0) {
  console.error(`${DIR}/: FAILED — no .feature files found.`);
  process.exit(1);
}

const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());
let totalScenarios = 0;
let failed = false;

for (const file of files) {
  const source = await readFile(file, 'utf8');

  // Enforce exactly one Feature declaration
  const declared = source.split(/\r?\n/).filter((l) => /^\s*Feature:/.test(l)).length;
  if (declared !== 1) {
    console.error(`  [error] ${file} — declares ${declared} Feature blocks; exactly one is required.`);
    failed = true;
    continue;
  }

  let document;
  try {
    document = parser.parse(source);
  } catch (error) {
    console.error(`  [error] ${file} — ${error.message}`);
    failed = true;
    continue;
  }

  const children = document.feature?.children ?? [];
  const count = children.filter((c) => c.scenario).length;
  if (count === 0) {
    console.error(`  [error] ${file} — parsed cleanly but declares no scenarios.`);
    failed = true;
    continue;
  }

  totalScenarios += count;
  console.log(`  [PASS] ${file} — "${document.feature.name}" (${count} scenario(s))`);
}

if (failed) {
  console.error(`\n${DIR}/: FAILED — see errors above.`);
  process.exit(1);
}

if (totalScenarios < MIN_EXPECTED_SCENARIOS) {
  console.error(
    `\n${DIR}/: FAILED — expected at least ${MIN_EXPECTED_SCENARIOS} scenarios, found ${totalScenarios}.`
  );
  process.exit(1);
}

console.log(`\n[PASS] ${DIR}/: valid Gherkin — ${totalScenarios} scenario(s) across ${files.length} file(s).`);
