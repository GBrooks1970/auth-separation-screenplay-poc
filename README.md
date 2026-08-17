# auth-separation-screenplay-poc

> **Pedagogical multi-stack showcase:** A demonstration of Specification-Driven Development (SDD) integrated with Behaviour-Driven Development (BDD) using the Screenplay design pattern across separated Authentication (AuthN), Authorization (AuthZ), and User Profile APIs.

## Overview

`auth-separation-screenplay-poc` demonstrates how a modern cloud architecture separates identity, access control, and user data into three distinct services, using a **single source of truth for business specifications and automated acceptance tests in the form of BDD Gherkin feature files (`features/`)**.

## Architecture & Service Separation

- **Authentication API (AuthN):** Establishes **who the user is** (sign-in, identity verification, JWT token issuance & revocation).
- **Authorization API (AuthZ):** Establishes **what an authenticated user is allowed to do** (RBAC, dynamic policy evaluation, access decisions).
- **User Profile API:** Manages **application-specific user details** (name, contact info, preferences linked by `user_id`).
- **Audit Store:** Records asynchronous audit event streams (`audit.access_decision_logged`, `user.authenticated`, `profile.updated`).

## Contracts & Documentation

- **OpenAPI 3.1 (`specs/`):** Defines synchronous REST HTTP endpoints, JSON request/response bodies, status codes, and Bearer token security schemes.
- **AsyncAPI 3.0 (`specs/`):** Defines asynchronous pub/sub channels, event payloads, and message headers.
- **Swagger UI:** Served interactively at `/docs` or `/swagger` on each service SUT during development.
- **BDD Feature Files (`features/`):** Human-readable Gherkin acceptance criteria executed by Screenplay test suites.

## Validation Gate

```bash
npm run verify
```

Validates:
1. OpenAPI 3.1 contracts via `@redocly/cli`.
2. AsyncAPI 3.0 event contracts via `@asyncapi/parser`.
3. Gherkin BDD feature files via `@cucumber/gherkin`.
4. Static TypeScript type checking via `tsc --noEmit`.

## Licence

MIT © 2026 Gary Brooks.
