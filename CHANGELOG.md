# Changelog

All notable changes to `auth-separation-screenplay-poc` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Phase 3: GitHub Actions CI Matrix Workflow (`POC-P3-01`)**:
  - Added `.github/workflows/ci.yml` executing unified verification gate across Node.js 20 and 22 with least-privilege permissions (`contents: read`).
  - Configured multi-stack dependencies including Python 3.12 (FastAPI), .NET 9 SDK (ASP.NET Core User Profile), and automated checkout/build of `hand-baked-screenplay-pattern` provider.

### Security
- **Phase 3: Remediate npm audit Security Vulnerabilities (`POC-P3-02`)**:
  - Upgraded `@redocly/cli` to `^2.51.2` eliminating `@faker-js/faker` arbitrary code execution advisory and OpenTelemetry transitive vulnerabilities.
  - Added dependency overrides for `fast-uri` (`^3.1.7`) and `uuid` (`^11.1.1`), resolving SSRF/host confusion and buffer bounds check vulnerabilities.
  - Reduced `npm audit` advisories from 21 (6 high, 15 moderate) to 0 vulnerabilities.

### Documentation
- **Phase 3: Legal & Packaging Normalisation (`POC-P3-03`)**:
  - Added root `LICENSE` file (MIT, 2026 Gary Brooks) matching package declarations.
  - Reconciled `README.md` §"Validation Gate" to accurately document `scripts/verify.mjs` multi-stage execution model and quality commands.
  - Normalised en-GB spelling across architecture and overview sections.

## [0.3.0] - 2026-08-18

### Added
- **Phase 2: Polyglot SUT Expansion (`POC-P2-01`)**:
  - Implemented **Python FastAPI Authorisation Service** (`sut-polyglot/python-authz/`) on port 3002 implementing RBAC (`SecurityAdmin`, `StandardUser`, `Auditor`, `Guest`) and dynamic ABAC ownership evaluation conforming strictly to `specs/authz-api_v1.yaml` with interactive Swagger UI at `/docs`.
  - Implemented **C# ASP.NET Core User Profile Service** (`sut-polyglot/dotnet-userinfo/`) on port 3003 in .NET 9 Minimal API implementing full profile CRUD (`GET`, `PUT`, `PATCH`, `DELETE`) with email format validation and bearer token enforcement conforming to `specs/userinfo-api_v1.yaml` with Swagger UI at `/docs`.
  - Added **Polyglot SUT Cluster Manager** (`src/support/polyglotLauncher.ts`) and standalone server runner (`src/sut/polyglotServer.ts`) managing multi-process lifecycle across Node.js, Python, and .NET.
  - Implemented cross-process event bridge forwarding domain events (`AccessDecisionLogged`, `ProfileUpdated`, `ProfileDeleted`) to the central audit broker over HTTP.
  - Enabled dynamic SUT target switching (`SUT_TARGET=nodejs` vs `SUT_TARGET=polyglot`).
  - Added `npm run test:polyglot` executing all **30 canonical BDD Gherkin scenarios** against the multi-stack polyglot backend with a **100% green pass rate** without altering a single scenario or test step.
  - Updated unified verification gate `scripts/verify.mjs` to validate contract linters, Node.js SUT execution, and Polyglot SUT execution end-to-end.

## [0.2.0] - 2026-08-18

### Added
- **Phase 1: Node.js Baseline SUT & Screenplay Test Suite (`POC-P1-01` & `POC-P1-02`)**:
  - Implemented Node.js reference SUT services with Swagger UI (`/docs`): AuthN (`AuthNService.ts`), AuthZ (`AuthZService.ts`), User Profile (`UserProfileService.ts`), EventBus (`EventBus.ts`), and cluster orchestrator (`server.ts`).
  - Implemented Promise-native Screenplay test automation harness using `hand-baked-screenplay-pattern` (Abilities, Tasks, Questions, Cucumber steps).
  - Executed all 30 canonical Gherkin scenarios in `features/` with 100% green pass rate.

## [0.1.0] - 2026-08-18

### Added
- **Phase 0: Specifications & BDD Gherkin Suite (`POC-P0-01` & `POC-P0-02`)**:
  - Expanded OpenAPI 3.1 contract schemas (`specs/authn-api_v1.yaml`, `specs/authz-api_v1.yaml`, `specs/userinfo-api_v1.yaml`).
  - Expanded AsyncAPI 3.0 contract (`specs/events_v1.yaml`).
  - Authored canonical BDD Gherkin feature suite under `features/` (30 scenarios across 9 feature files).
  - Integrated verification gate in `scripts/verify.mjs`.
