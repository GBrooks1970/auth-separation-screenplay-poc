# auth-separation-screenplay-poc

> **Pedagogical multi-stack showcase:** A demonstration of Specification-Driven Development (SDD) integrated with Behaviour-Driven Development (BDD) using the Screenplay design pattern across separated Authentication (AuthN), Authorisation (AuthZ), and User Profile APIs.

## Overview

`auth-separation-screenplay-poc` demonstrates how a modern cloud architecture separates identity, access control, and user data into three distinct services, using a **single source of truth for business specifications and automated acceptance tests in the form of BDD Gherkin feature files (`features/`)**.

## Architecture & Service Separation

- **Authentication API (AuthN):** Establishes **who the user is** (sign-in, identity verification, JWT token issuance & revocation).
- **Authorisation API (AuthZ):** Establishes **what an authenticated user is allowed to do** (RBAC, dynamic policy evaluation, access decisions).
- **User Profile API:** Manages **application-specific user details** (name, contact info, preferences linked by `user_id`).
- **Audit Store:** Records asynchronous audit event streams (`audit.access_decision_logged`, `user.authenticated`, `profile.updated`).

## Contracts & Documentation

- **OpenAPI 3.1 (`specs/`):** Defines synchronous REST HTTP endpoints, JSON request/response bodies, status codes, and Bearer token security schemes.
- **AsyncAPI 3.0 (`specs/`):** Defines asynchronous pub/sub channels, event payloads, and message headers.
- **Swagger UI:** Served interactively at `/docs` or `/swagger` on each service SUT during development.
- **BDD Feature Files (`features/`):** Human-readable Gherkin acceptance criteria executed by Screenplay test suites.

## Validation Gate

The unified verification gate is executed via:

```bash
npm run verify
```

This single command orchestrates the end-to-end verification pipeline (`scripts/verify.mjs`):
1. **OpenAPI 3.1 Contract Specifications (`specs/`):** Validates OpenAPI headers and schemas across AuthN, AuthZ, and User Profile specifications.
2. **AsyncAPI 3.0 Event Specifications (`specs/`):** Validates the asynchronous event bus contract via `@asyncapi/parser`.
3. **BDD Gherkin Feature Suite (`features/`):** Validates structural integrity and single-feature boundaries across 30 canonical scenarios via `@cucumber/gherkin`.
4. **Project Governance Alignment:** Validates synchronization between `docs/project-contract.md` and `docs/backlog.md`.
5. **Node.js Reference SUT Execution:** Spawns in-process Node.js services and runs all 30 BDD scenarios (135 test steps) via Cucumber Screenplay pattern.
6. **Polyglot Multi-Stack SUT Execution:** Spawns live heterogeneous microservices (Node.js AuthN, Python FastAPI AuthZ, and C# ASP.NET Core User Profile) and re-runs the entire 30 BDD scenarios (135 test steps) verifying 100% contract interchangeability.

Additional developer quality commands:
- `npm run build`: Static TypeScript checking (`tsc --noEmit`) and C# .NET 9 service compilation (`dotnet build sut-polyglot/dotnet-userinfo`).
- `npm run lint:openapi`: Redocly CLI linting across all OpenAPI specs.
- `npm run test:bdd`: Standalone Screenplay BDD run against Node.js SUT.
- `npm run test:polyglot`: Standalone Screenplay BDD run against Polyglot SUT.

## Licence

MIT © 2026 Gary Brooks. See [LICENSE](LICENSE) for full details.
