#!/usr/bin/env node
/**
 * Validates the AsyncAPI event contract using @asyncapi/parser.
 *
 * The events file is the single source of truth for cross-service asynchronous
 * communication, notifications, and audit logging across AuthN, AuthZ, and Profile services.
 * Any structural failure fails the verification gate.
 */
import { readFile } from 'node:fs/promises';
import { Parser } from '@asyncapi/parser';

const SPEC = 'specs/events_v1.yaml';
const SEVERITY = ['error', 'warning', 'info', 'hint'];

try {
  const source = await readFile(SPEC, 'utf8');
  const { document, diagnostics } = await new Parser().parse(source);

  const errors = diagnostics ? diagnostics.filter((d) => d.severity === 0) : [];
  const warnings = diagnostics ? diagnostics.filter((d) => d.severity === 1) : [];

  for (const d of [...errors, ...warnings]) {
    const line = d.range?.start?.line;
    const at = line === undefined ? SPEC : `${SPEC}:${line + 1}`;
    console.log(`  [${SEVERITY[d.severity]}] ${at} — ${d.message}`);
  }

  if (errors.length > 0 || document === undefined) {
    console.error(`\n${SPEC}: FAILED — ${errors.length} error(s).`);
    process.exit(1);
  }

  const channels = document.channels()?.all()?.length ?? 0;
  const operations = document.operations()?.all()?.length ?? 0;
  console.log(
    `[PASS] ${SPEC}: valid AsyncAPI ${document.version()} — ` +
      `${channels} channel(s), ${operations} operation(s), ${warnings.length} warning(s).`
  );
} catch (err) {
  console.error(`\n${SPEC}: FAILED with unhandled error:\n`, err);
  process.exit(1);
}
