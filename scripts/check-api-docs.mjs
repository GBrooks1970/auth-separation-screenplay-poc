// Drift, determinism, and self-containment gate for the multi-spec API reference.
// Fails (exit 1) if the generated reference drifts from committed contracts,
// is non-deterministic, loads external network assets, or executes runtime calls.
//
// Run via: node scripts/check-api-docs.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';
import { buildApiDocsArtefacts, SPEC_CONFIGS } from './render-api-docs-lib.mjs';

const problems = [];
const check = (ok, message) => {
  if (!ok) problems.push(message);
};

console.log('Checking static API reference generation...');

const first = buildApiDocsArtefacts();
const second = buildApiDocsArtefacts();

// 1. Determinism: same source -> identical bytes
check(first.indexHtml === second.indexHtml, 'index.html is not byte-stable across runs');
check(first.specFiles.length === 4, `expected 4 spec files, found ${first.specFiles.length}`);

// 2. Specification verification against disk source
for (const spec of first.specFiles) {
  const diskSource = readFileSync(resolve(process.cwd(), spec.relativePath), 'utf8');
  check(
    spec.content === diskSource,
    `${spec.relativePath} in artefacts does not match disk content verbatim`,
  );
}

const html = first.indexHtml;

// 3. Content coverage for all 4 contracts
for (const cfg of SPEC_CONFIGS) {
  const diskSource = readFileSync(resolve(process.cwd(), cfg.relativePath), 'utf8');
  const doc = yaml.load(diskSource);

  // Title must appear
  const escapedTitle = doc.info.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  check(html.includes(escapedTitle), `reference is missing title for ${cfg.title}`);

  // OpenAPI paths, methods, responses, and schemas
  if (cfg.type === 'openapi') {
    for (const [path, item] of Object.entries(doc.paths ?? {})) {
      check(html.includes(path), `reference is missing path ${path} in ${cfg.id}`);
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      for (const method of methods) {
        if (item[method]) {
          check(
            html.includes(method.toUpperCase()),
            `reference is missing method ${method.toUpperCase()} for ${path} in ${cfg.id}`,
          );
          for (const code of Object.keys(item[method].responses ?? {})) {
            check(
              html.includes(`>${code}<`),
              `reference is missing response status ${code} for ${method.toUpperCase()} ${path}`,
            );
          }
        }
      }
    }
    for (const schemaName of Object.keys(doc.components?.schemas ?? {})) {
      check(
        html.includes(schemaName),
        `reference is missing schema ${schemaName} in ${cfg.id}`,
      );
    }
  }

  // AsyncAPI channels, messages, and payload schemas
  if (cfg.type === 'asyncapi') {
    for (const [channelKey, channel] of Object.entries(doc.channels ?? {})) {
      const address = channel.address ?? channelKey;
      check(
        html.includes(address),
        `reference is missing channel ${address} in ${cfg.id}`,
      );
    }
    for (const msgName of Object.keys(doc.components?.messages ?? {})) {
      check(
        html.includes(msgName),
        `reference is missing event message ${msgName} in ${cfg.id}`,
      );
    }
    for (const schemaName of Object.keys(doc.components?.schemas ?? {})) {
      check(
        html.includes(schemaName),
        `reference is missing payload schema ${schemaName} in ${cfg.id}`,
      );
    }
  }

  // Raw contract link must exist
  check(
    html.includes(`href="${cfg.relativePath}"`),
    `reference is missing direct download link to ${cfg.relativePath}`,
  );
}

// 4. Self-containment & security constraints
check(
  !/<(script|link|img)[^>]+src=["']https?:\/\//i.test(html),
  'reference must not load external assets via src="http(s)://"',
);
check(
  !/<link[^>]+href=["']https?:\/\//i.test(html),
  'reference must not load external stylesheets via href="http(s)://"',
);
check(
  !/<a\s+[^>]*href=["']https?:\/\//i.test(html),
  'reference must not contain external outgoing links (must be local relative or hash links)',
);
check(
  !/\bfetch\s*\(|XMLHttpRequest|EventSource|new\s+WebSocket/.test(html),
  'reference must not invoke runtime network APIs (no fetch/XHR/WebSocket)',
);
check(
  html.includes('Static API Reference'),
  'reference must display the static disclaimer banner',
);

if (problems.length > 0) {
  console.error('check-api-docs: FAIL');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(
  `check-api-docs: PASS (deterministic, 4 contracts covered, self-contained; ${Buffer.byteLength(html, 'utf8')} bytes)`,
);
