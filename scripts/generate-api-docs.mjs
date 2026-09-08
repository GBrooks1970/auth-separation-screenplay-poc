// Writes the multi-spec static API reference to disk for GitHub Pages.
// Generates docs-site/index.html and copies raw specification files to docs-site/specs/.
//
// Usage: node scripts/generate-api-docs.mjs [outDir]   (default: docs-site)
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { buildApiDocsArtefacts } from './render-api-docs-lib.mjs';

const outDir = resolve(process.cwd(), process.argv[2] ?? 'docs-site');
const { indexHtml, specFiles } = buildApiDocsArtefacts(process.cwd());

mkdirSync(outDir, { recursive: true });
mkdirSync(join(outDir, 'specs'), { recursive: true });

writeFileSync(join(outDir, 'index.html'), indexHtml, 'utf8');

for (const spec of specFiles) {
  const targetPath = join(outDir, 'specs', spec.fileName);
  writeFileSync(targetPath, spec.content, 'utf8');
}

console.log(
  `api-docs: wrote ${outDir}/index.html (${Buffer.byteLength(indexHtml, 'utf8')} bytes) ` +
    `and ${specFiles.length} specification contracts to ${outDir}/specs/`,
);
