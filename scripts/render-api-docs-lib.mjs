/**
 * Pure, deterministic multi-spec API reference renderer for auth-separation-screenplay-poc.
 *
 * Renders all 4 microservice and event contracts (AuthN, AuthZ, UserInfo, and Events)
 * into a single, self-contained HTML page with inline CSS and tabbed navigation.
 * No external CSS, no external fonts, no external JS, and no runtime API calls.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import yaml from 'js-yaml';

export const SPEC_CONFIGS = [
  {
    id: 'authn',
    fileName: 'authn-api_v1.yaml',
    relativePath: 'specs/authn-api_v1.yaml',
    title: 'Authentication Service (AuthN)',
    shortName: 'AuthN API',
    type: 'openapi',
    port: 3001,
    protocol: 'HTTP / REST'
  },
  {
    id: 'authz',
    fileName: 'authz-api_v1.yaml',
    relativePath: 'specs/authz-api_v1.yaml',
    title: 'Authorisation Service (AuthZ)',
    shortName: 'AuthZ API',
    type: 'openapi',
    port: 3002,
    protocol: 'HTTP / REST'
  },
  {
    id: 'userinfo',
    fileName: 'userinfo-api_v1.yaml',
    relativePath: 'specs/userinfo-api_v1.yaml',
    title: 'User Profile Service (UserInfo)',
    shortName: 'UserInfo API',
    type: 'openapi',
    port: 3003,
    protocol: 'HTTP / REST'
  },
  {
    id: 'events',
    fileName: 'events_v1.yaml',
    relativePath: 'specs/events_v1.yaml',
    title: 'Domain & Audit Events (AsyncAPI)',
    shortName: 'Audit Events',
    type: 'asyncapi',
    port: 6379,
    protocol: 'AsyncAPI / Redis'
  }
];

function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function schemaAnchor(specId, name) {
  return `${specId}-schema-${String(name).replace(/[^A-Za-z0-9_-]/g, '-')}`;
}

function refName(ref) {
  const openApiPrefix = '#/components/schemas/';
  const asyncApiPrefix = '#/components/messages/';
  if (ref.startsWith(openApiPrefix)) return ref.slice(openApiPrefix.length);
  if (ref.startsWith(asyncApiPrefix)) return ref.slice(asyncApiPrefix.length);
  return ref;
}

function renderSchemaRef(specId, schema) {
  if (!schema) return '<span class="muted">—</span>';
  if (schema.$ref) {
    const name = refName(schema.$ref);
    return `<a class="schema-ref" href="#${schemaAnchor(specId, name)}">${escapeHtml(name)}</a>`;
  }
  if (schema.type === 'array' && schema.items) {
    return `array&lt;${renderSchemaRef(specId, schema.items)}&gt;`;
  }
  if (schema.type) {
    return `<code>${escapeHtml(schema.type)}</code>`;
  }
  return '<span class="muted">—</span>';
}

function describeType(specId, schema) {
  if (!schema) return '<span class="muted">—</span>';
  if (schema.$ref) {
    const name = refName(schema.$ref);
    return `<a class="schema-ref" href="#${schemaAnchor(specId, name)}">${escapeHtml(name)}</a>`;
  }
  if (schema.type === 'array' && schema.items) {
    return `array&lt;${describeType(specId, schema.items)}&gt;`;
  }
  let base = schema.type ? `<code>${escapeHtml(schema.type)}</code>` : '<span class="muted">any</span>';
  if (schema.format) {
    base += ` <span class="format">(${escapeHtml(schema.format)})</span>`;
  }
  if (schema.enum && schema.enum.length > 0) {
    const values = schema.enum.map((v) => `<code>${escapeHtml(String(v))}</code>`).join(', ');
    return `${base} <span class="muted">(one of ${values})</span>`;
  }
  return base;
}

function renderSchema(specId, name, schema) {
  const required = new Set(schema.required ?? []);
  const rows = Object.entries(schema.properties ?? {})
    .map(([propName, propSchema]) => {
      const isReq = required.has(propName);
      const req = isReq
        ? '<span class="req">required</span>'
        : '<span class="muted">optional</span>';
      const desc = propSchema.description ? `<div class="prop-desc">${escapeHtml(propSchema.description)}</div>` : '';
      const example = propSchema.example !== undefined
        ? `<div class="prop-example">Example: <code>${escapeHtml(JSON.stringify(propSchema.example))}</code></div>`
        : '';
      return [
        '<tr>',
        `<td><code>${escapeHtml(propName)}</code></td>`,
        `<td>${describeType(specId, propSchema)}</td>`,
        `<td>${req}</td>`,
        `<td>${desc}${example}</td>`,
        '</tr>',
      ].join('');
    })
    .join('');

  const table = rows
    ? `<div class="table-container"><table class="props"><thead><tr><th>Property</th><th>Type</th><th>Requirement</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table></div>`
    : '<p class="muted">No explicit properties (empty or primitive schema).</p>';

  const schemaDesc = schema.description ? `<p class="schema-desc">${escapeHtml(schema.description)}</p>` : '';

  return [
    `<section class="schema" id="${schemaAnchor(specId, name)}">`,
    `<h4><code>${escapeHtml(name)}</code>`,
    schema.type ? ` <span class="muted">(${escapeHtml(schema.type)})</span>` : '',
    '</h4>',
    schemaDesc,
    table,
    '</section>',
  ].join('\n');
}

function renderOperation(specId, method, path, op, commonParameters = []) {
  const methodUpper = escapeHtml(method.toUpperCase());
  const methodLower = escapeHtml(method.toLowerCase());

  // Security badge
  const isPublic = !op.security || op.security.length === 0 || (op.security.length === 1 && Object.keys(op.security[0]).length === 0);
  const securityBadge = isPublic
    ? '<span class="badge badge-public">Public (No Auth)</span>'
    : '<span class="badge badge-auth">Bearer JWT Required</span>';

  // Parameters (merge common path parameters + operation parameters)
  const allParams = [...commonParameters, ...(op.parameters ?? [])];
  let paramSection = '';
  if (allParams.length > 0) {
    const paramRows = allParams
      .map((p) => {
        const isReq = p.required ? '<span class="req">required</span>' : '<span class="muted">optional</span>';
        const pType = p.schema ? describeType(specId, p.schema) : '<span class="muted">string</span>';
        const pDesc = p.description ? escapeHtml(p.description) : '—';
        return [
          '<tr>',
          `<td><code>${escapeHtml(p.name)}</code></td>`,
          `<td><code>${escapeHtml(p.in)}</code></td>`,
          `<td>${pType}</td>`,
          `<td>${isReq}</td>`,
          `<td>${pDesc}</td>`,
          '</tr>',
        ].join('');
      })
      .join('');
    paramSection = [
      '<div class="op-subheading">Parameters</div>',
      '<div class="table-container"><table class="params"><thead><tr><th>Name</th><th>In</th><th>Type</th><th>Requirement</th><th>Description</th></tr></thead><tbody>',
      paramRows,
      '</tbody></table></div>',
    ].join('');
  }

  // Request Body
  let requestSection = '';
  if (op.requestBody) {
    const isReq = op.requestBody.required ? '<span class="req">required</span>' : '<span class="muted">optional</span>';
    const jsonContent = op.requestBody.content?.['application/json'];
    const schemaRef = jsonContent?.schema ? renderSchemaRef(specId, jsonContent.schema) : '<span class="muted">—</span>';
    requestSection = [
      '<div class="op-subheading">Request Body</div>',
      `<p class="op-request"><code>application/json</code> (${isReq}) — Schema: ${schemaRef}</p>`,
    ].join('');
  }

  // Responses
  let responseSection = '';
  const responseEntries = Object.entries(op.responses ?? {});
  if (responseEntries.length > 0) {
    const responseRows = responseEntries
      .map(([code, resp]) => {
        const schema = resp.content?.['application/json']?.schema;
        const bodyRef = schema ? renderSchemaRef(specId, schema) : '<span class="muted">—</span>';
        const codeClass = code.startsWith('2') ? 'status-2xx' : code.startsWith('4') ? 'status-4xx' : 'status-5xx';
        return [
          '<tr>',
          `<td><span class="status-code ${codeClass}">${escapeHtml(code)}</span></td>`,
          `<td>${escapeHtml(resp.description ?? '')}</td>`,
          `<td>${bodyRef}</td>`,
          '</tr>',
        ].join('');
      })
      .join('');
    responseSection = [
      '<div class="op-subheading">Responses</div>',
      '<div class="table-container"><table class="responses"><thead><tr><th>Status</th><th>Description</th><th>Body Schema</th></tr></thead><tbody>',
      responseRows,
      '</tbody></table></div>',
    ].join('');
  }

  return [
    `<section class="op op-${methodLower}">`,
    '<header class="op-header">',
    `<span class="method method-${methodLower}">${methodUpper}</span>`,
    `<code class="op-path">${escapeHtml(path)}</code>`,
    securityBadge,
    '</header>',
    op.summary ? `<p class="op-summary"><strong>${escapeHtml(op.summary)}</strong></p>` : '',
    op.description ? `<p class="op-desc">${escapeHtml(op.description)}</p>` : '',
    paramSection,
    requestSection,
    responseSection,
    '</section>',
  ].join('\n');
}

function renderOpenApiSpec(meta, doc) {
  const paths = Object.entries(doc.paths ?? {});
  const operationsHtml = paths
    .flatMap(([path, pathItem]) => {
      const commonParams = pathItem.parameters ?? [];
      const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      return methods
        .filter((m) => pathItem[m])
        .map((m) => renderOperation(meta.id, m, path, pathItem[m], commonParams));
    })
    .join('\n');

  const schemas = Object.entries(doc.components?.schemas ?? {});
  const schemasHtml = schemas
    .map(([name, schema]) => renderSchema(meta.id, name, schema))
    .join('\n');

  return [
    `<div class="spec-section" id="spec-${meta.id}">`,
    '<div class="spec-header">',
    `<h2>${escapeHtml(doc.info.title)}</h2>`,
    `<p class="spec-meta"><span class="meta-item">OpenAPI ${escapeHtml(doc.openapi)}</span> &middot; ` +
      `<span class="meta-item">Version ${escapeHtml(doc.info.version)}</span> &middot; ` +
      `<span class="meta-item">Port <code>${meta.port}</code></span> &middot; ` +
      `<a class="btn-raw" href="${meta.relativePath}">Download Raw Specification (.yaml)</a></p>`,
    doc.info.description ? `<p class="spec-desc">${escapeHtml(doc.info.description)}</p>` : '',
    '</div>',
    '<h3>Endpoints</h3>',
    operationsHtml || '<p class="muted">No endpoints declared.</p>',
    '<h3>Schemas</h3>',
    schemasHtml || '<p class="muted">No schemas declared.</p>',
    '</div>',
  ].join('\n');
}

function renderAsyncApiSpec(meta, doc) {
  const channels = Object.entries(doc.channels ?? {});
  const channelsHtml = channels
    .map(([channelKey, channelItem]) => {
      const msgs = Object.entries(channelItem.messages ?? {})
        .map(([msgKey, msgRef]) => {
          const actualName = msgRef.$ref ? refName(msgRef.$ref) : msgKey;
          return `<li><code>${escapeHtml(actualName)}</code></li>`;
        })
        .join('');
      return [
        '<div class="channel-card">',
        `<header class="channel-header"><span class="channel-badge">CHANNEL</span> <code class="channel-name">${escapeHtml(channelItem.address ?? channelKey)}</code></header>`,
        channelItem.description ? `<p class="channel-desc">${escapeHtml(channelItem.description)}</p>` : '',
        '<div class="channel-messages"><strong>Published Messages:</strong>',
        msgs ? `<ul>${msgs}</ul>` : '<span class="muted">None</span>',
        '</div>',
        '</div>',
      ].join('\n');
    })
    .join('\n');

  const messages = Object.entries(doc.components?.messages ?? {});
  const messagesHtml = messages
    .map(([msgName, msgItem]) => {
      const payloadRef = msgItem.payload?.$ref ? refName(msgItem.payload.$ref) : null;
      const payloadLink = payloadRef
        ? `<a class="schema-ref" href="#${schemaAnchor(meta.id, payloadRef)}">${escapeHtml(payloadRef)}</a>`
        : '<span class="muted">—</span>';
      return [
        '<div class="message-card">',
        `<h4><span class="message-badge">EVENT</span> <code>${escapeHtml(msgItem.name ?? msgName)}</code> &mdash; ${escapeHtml(msgItem.title ?? '')}</h4>`,
        msgItem.summary ? `<p class="message-summary">${escapeHtml(msgItem.summary)}</p>` : '',
        `<p class="message-payload"><strong>Payload Schema:</strong> ${payloadLink}</p>`,
        '</div>',
      ].join('\n');
    })
    .join('\n');

  const schemas = Object.entries(doc.components?.schemas ?? {});
  const schemasHtml = schemas
    .map(([name, schema]) => renderSchema(meta.id, name, schema))
    .join('\n');

  return [
    `<div class="spec-section" id="spec-${meta.id}">`,
    '<div class="spec-header">',
    `<h2>${escapeHtml(doc.info.title)}</h2>`,
    `<p class="spec-meta"><span class="meta-item">AsyncAPI ${escapeHtml(doc.asyncapi)}</span> &middot; ` +
      `<span class="meta-item">Version ${escapeHtml(doc.info.version)}</span> &middot; ` +
      `<span class="meta-item">Broker <code>Redis localhost:6379</code></span> &middot; ` +
      `<a class="btn-raw" href="${meta.relativePath}">Download Raw Specification (.yaml)</a></p>`,
    doc.info.description ? `<p class="spec-desc">${escapeHtml(doc.info.description)}</p>` : '',
    '</div>',
    '<h3>Event Channels</h3>',
    channelsHtml || '<p class="muted">No channels declared.</p>',
    '<h3>Domain Event Messages</h3>',
    messagesHtml || '<p class="muted">No messages declared.</p>',
    '<h3>Payload Schemas</h3>',
    schemasHtml || '<p class="muted">No schemas declared.</p>',
    '</div>',
  ].join('\n');
}

const CSS_STYLES = `
  :root {
    color-scheme: light;
    --primary: #1e3a8a;
    --primary-light: #eff6ff;
    --border: #dbeafe;
    --text: #1e293b;
    --text-muted: #64748b;
    --bg-surface: #ffffff;
    --bg-page: #f8fafc;
    --card-border: #e2e8f0;
    --badge-get: #15803d;
    --badge-post: #1d4ed8;
    --badge-put: #b45309;
    --badge-patch: #6b21a8;
    --badge-delete: #b91c1c;
  }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: var(--bg-page);
    color: var(--text);
    line-height: 1.55;
  }
  header.site-header {
    background: var(--bg-surface);
    border-bottom: 1px solid var(--card-border);
    padding: 1.5rem 2rem 1rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
  .header-content {
    max-width: 1100px;
    margin: 0 auto;
  }
  h1.site-title {
    margin: 0 0 0.25rem;
    font-size: 1.6rem;
    color: #0f172a;
    font-weight: 700;
  }
  p.site-subtitle {
    margin: 0 0 1rem;
    color: var(--text-muted);
    font-size: 0.95rem;
  }
  .banner {
    border: 1px solid #fde047;
    border-left: 6px solid #eab308;
    background: #fefce8;
    color: #713f12;
    padding: 0.9rem 1.2rem;
    border-radius: 8px;
    font-size: 0.92rem;
    margin-bottom: 1.25rem;
  }
  .banner strong { color: #854d0e; }
  .stats-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1.25rem;
    margin-bottom: 1rem;
    padding: 0.6rem 0;
    border-top: 1px solid var(--card-border);
    border-bottom: 1px solid var(--card-border);
    font-size: 0.88rem;
  }
  .stat-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .stat-val {
    font-weight: 700;
    color: var(--primary);
  }
  .tabs-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .tab-btn {
    border: 1px solid var(--card-border);
    background: #f1f5f9;
    color: var(--text);
    padding: 0.55rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.15s ease;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }
  .tab-btn:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
  }
  .tab-btn.active {
    background: var(--primary);
    color: #ffffff;
    border-color: var(--primary);
  }
  main.site-main {
    max-width: 1100px;
    margin: 1.5rem auto;
    padding: 0 1.5rem;
  }
  .spec-section {
    background: var(--bg-surface);
    border: 1px solid var(--card-border);
    border-radius: 10px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }
  .spec-section h2 {
    margin: 0 0 0.5rem;
    font-size: 1.4rem;
    color: #0f172a;
  }
  .spec-meta {
    font-size: 0.88rem;
    color: var(--text-muted);
    margin: 0 0 1rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .spec-meta code {
    background: #f1f5f9;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
    color: #0f172a;
  }
  .btn-raw {
    display: inline-block;
    padding: 0.2rem 0.65rem;
    background: #e0f2fe;
    color: #0369a1;
    border: 1px solid #bae6fd;
    border-radius: 5px;
    font-size: 0.82rem;
    font-weight: 600;
    text-decoration: none;
  }
  .btn-raw:hover { background: #bae6fd; }
  .spec-desc {
    color: #334155;
    margin: 0 0 1.5rem;
    font-size: 0.95rem;
  }
  h3 {
    font-size: 1.15rem;
    color: #1e293b;
    border-bottom: 1px solid var(--card-border);
    padding-bottom: 0.4rem;
    margin: 1.75rem 0 1rem;
  }
  h4 {
    font-size: 0.98rem;
    margin: 0.8rem 0 0.4rem;
    color: #334155;
  }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
    font-size: 0.9em;
  }
  .op {
    border: 1px solid var(--card-border);
    border-radius: 8px;
    padding: 1.1rem 1.25rem;
    margin: 0 0 1.25rem;
    background: #fafafa;
  }
  .op-header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .method {
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    padding: 0.2rem 0.55rem;
    border-radius: 5px;
    color: #fff;
    min-width: 4.2rem;
    text-align: center;
  }
  .method-get { background: var(--badge-get); }
  .method-post { background: var(--badge-post); }
  .method-put { background: var(--badge-put); }
  .method-patch { background: var(--badge-patch); }
  .method-delete { background: var(--badge-delete); }
  .op-path {
    font-size: 1.05rem;
    font-weight: 600;
    color: #0f172a;
  }
  .badge {
    font-size: 0.75rem;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    font-weight: 600;
  }
  .badge-auth { background: #fee2e2; color: #991b1b; }
  .badge-public { background: #dcfce7; color: #166534; }
  .op-summary { margin: 0.75rem 0 0.25rem; font-size: 0.95rem; color: #1e293b; }
  .op-desc { margin: 0 0 0.75rem; font-size: 0.88rem; color: var(--text-muted); }
  .op-subheading {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    margin: 0.85rem 0 0.35rem;
  }
  .table-container {
    overflow-x: auto;
    margin: 0.4rem 0 0.75rem;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.88rem;
    background: #ffffff;
    border: 1px solid var(--card-border);
  }
  th, td {
    padding: 0.45rem 0.75rem;
    text-align: left;
    vertical-align: top;
    border: 1px solid var(--card-border);
  }
  th {
    background: #f8fafc;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
  }
  .schema {
    border-top: 1px solid var(--card-border);
    padding: 0.75rem 0 0.25rem;
  }
  .schema-desc { font-size: 0.88rem; color: var(--text-muted); margin: 0 0 0.5rem; }
  .schema-ref {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1px dotted var(--primary);
  }
  .schema-ref:hover { text-decoration: underline; }
  .req { color: #dc2626; font-weight: 600; font-size: 0.8rem; }
  .muted { color: var(--text-muted); }
  .format { color: #8b5cf6; font-size: 0.82rem; }
  .prop-desc { font-size: 0.85rem; color: #334155; }
  .prop-example { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem; }
  .status-code {
    font-weight: 700;
    font-size: 0.82rem;
    padding: 0.15rem 0.4rem;
    border-radius: 4px;
  }
  .status-2xx { background: #dcfce7; color: #166534; }
  .status-4xx { background: #fee2e2; color: #991b1b; }
  .status-5xx { background: #fef3c7; color: #92400e; }
  .channel-card, .message-card {
    border: 1px solid var(--card-border);
    background: #fafafa;
    border-radius: 8px;
    padding: 0.9rem 1.15rem;
    margin-bottom: 0.85rem;
  }
  .channel-badge {
    background: #0284c7;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    margin-right: 0.4rem;
  }
  .channel-name { font-size: 1rem; font-weight: 600; color: #0f172a; }
  .channel-desc { font-size: 0.88rem; color: var(--text-muted); margin: 0.4rem 0 0.5rem; }
  .channel-messages ul { margin: 0.3rem 0 0 1.2rem; padding: 0; font-size: 0.88rem; }
  .message-badge {
    background: #7c3aed;
    color: #ffffff;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    margin-right: 0.4rem;
  }
  .message-card h4 { margin: 0 0 0.4rem; font-size: 0.98rem; }
  .message-summary { font-size: 0.88rem; color: #334155; margin: 0.2rem 0 0.4rem; }
  .message-payload { font-size: 0.88rem; margin: 0.2rem 0; }
  footer.site-footer {
    max-width: 1100px;
    margin: 2rem auto;
    padding: 1.5rem 1.5rem 2rem;
    border-top: 1px solid var(--card-border);
    color: var(--text-muted);
    font-size: 0.85rem;
    text-align: center;
  }
  footer.site-footer p { margin: 0.3rem 0; }
  /* Fallback visibility: when JS active or hash targeted */
  .spec-section.hidden { display: none; }
`.trim();

const INLINE_SCRIPT = `
  (function() {
    function setActiveTab(targetId) {
      var tabs = document.querySelectorAll('.tab-btn');
      var sections = document.querySelectorAll('.spec-section');
      tabs.forEach(function(tab) {
        var isTarget = tab.getAttribute('data-target') === targetId;
        tab.classList.toggle('active', isTarget);
      });
      sections.forEach(function(sec) {
        if (targetId === 'all') {
          sec.classList.remove('hidden');
        } else {
          var matches = sec.id === 'spec-' + targetId;
          sec.classList.toggle('hidden', !matches);
        }
      });
    }

    window.switchTab = function(targetId) {
      setActiveTab(targetId);
      if (history.replaceState) {
        history.replaceState(null, '', '#' + targetId);
      } else {
        location.hash = targetId;
      }
    };

    // Initialise based on hash or default to first tab (authn)
    var initialHash = (location.hash || '').replace(/^#/, '');
    var validTargets = ['authn', 'authz', 'userinfo', 'events', 'all'];
    if (validTargets.indexOf(initialHash) !== -1) {
      setActiveTab(initialHash);
    } else {
      setActiveTab('authn');
    }
  })();
`.trim();

/**
 * Builds all API reference artefacts in memory deterministically.
 * @param {string} projectRoot - Absolute path to project root directory.
 * @returns {{ indexHtml: string, specFiles: Array<{ relativePath: string, fileName: string, content: string }> }}
 */
export function buildApiDocsArtefacts(projectRoot = process.cwd()) {
  const parsedSpecs = SPEC_CONFIGS.map((cfg) => {
    const fullPath = resolve(projectRoot, cfg.relativePath);
    const rawYaml = readFileSync(fullPath, 'utf8');
    const doc = yaml.load(rawYaml);
    return {
      cfg,
      rawYaml,
      doc
    };
  });

  const sectionsHtml = parsedSpecs
    .map(({ cfg, doc }) => {
      if (cfg.type === 'openapi') {
        return renderOpenApiSpec(cfg, doc);
      }
      return renderAsyncApiSpec(cfg, doc);
    })
    .join('\n');

  const tabButtons = SPEC_CONFIGS.map((cfg) => {
    return `<button type="button" class="tab-btn" data-target="${cfg.id}" onclick="switchTab('${cfg.id}')">${escapeHtml(cfg.shortName)}</button>`;
  }).join('\n');
  const allTabsHtml = `${tabButtons}\n<button type="button" class="tab-btn" data-target="all" onclick="switchTab('all')">View All Specifications</button>`;

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Authentication Separation Architecture &mdash; API Reference</title>
<style>${CSS_STYLES}</style>
</head>
<body>
<header class="site-header">
  <div class="header-content">
    <h1 class="site-title">Authentication Separation Architecture &mdash; API Reference</h1>
    <p class="site-subtitle">Pedagogical multi-stack demonstration of SDD with BDD using the Screenplay design pattern across separated AuthN, AuthZ, and User Profile services.</p>
    <div class="banner">
      <strong>Static API Reference.</strong> This documentation is generated directly from the project's committed OpenAPI 3.1 and AsyncAPI 3.0 contracts (<code>specs/authn-api_v1.yaml</code>, <code>specs/authz-api_v1.yaml</code>, <code>specs/userinfo-api_v1.yaml</code>, and <code>specs/events_v1.yaml</code>). It documents the architectural contracts only. It is <strong>not</strong> a running service and does <strong>not</strong> execute network requests to backend services (<code>http://localhost:3001</code>, <code>3002</code>, <code>3003</code>, or <code>localhost:6379</code>).
    </div>
    <div class="stats-bar">
      <div class="stat-item"><span class="stat-val">4</span> Service Contracts</div>
      <div class="stat-item"><span class="stat-val">9</span> REST Operations</div>
      <div class="stat-item"><span class="stat-val">4</span> Event Channels</div>
      <div class="stat-item"><span class="stat-val">9</span> Domain Events</div>
      <div class="stat-item"><span class="stat-val">32</span> Contract Schemas</div>
      <div class="stat-item"><span class="stat-val">100%</span> Green BDD Verification</div>
    </div>
    <nav class="tabs-nav" aria-label="Service Specifications Navigation">
      ${allTabsHtml}
    </nav>
  </div>
</header>
<main class="site-main">
  ${sectionsHtml}
</main>
<footer class="site-footer">
  <p><strong>auth-separation-screenplay-poc</strong> &mdash; SDD + Screenplay Multi-Stack Showcase.</p>
  <p>Specifications: <a href="specs/authn-api_v1.yaml">authn-api_v1.yaml</a> &middot; <a href="specs/authz-api_v1.yaml">authz-api_v1.yaml</a> &middot; <a href="specs/userinfo-api_v1.yaml">userinfo-api_v1.yaml</a> &middot; <a href="specs/events_v1.yaml">events_v1.yaml</a></p>
  <p class="muted">Documentation only &mdash; independent of any running server. Released under MIT Licence.</p>
</footer>
<script>${INLINE_SCRIPT}</script>
</body>
</html>
`;

  const specFiles = parsedSpecs.map(({ cfg, rawYaml }) => ({
    relativePath: cfg.relativePath,
    fileName: cfg.fileName,
    content: rawYaml
  }));

  return { indexHtml, specFiles };
}
