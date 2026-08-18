# Changelog

All notable changes to `auth-separation-screenplay-poc` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-08-18

### Added
- **Phase 1: Node.js Baseline SUT & Screenplay Test Suite (`POC-P1-01` & `POC-P1-02`)**:
  - Implemented Node.js reference SUT services with Swagger UI (`/docs`):
    - `src/sut/authn/AuthNService.ts`: Authentication service on port 3001 supporting login, RSA JWT generation, JWKS key discovery (`/.well-known/jwks.json`), token verification, session refresh, and logout revocation.
    - `src/sut/authz/AuthZService.ts`: Policy evaluation service on port 3002 implementing RBAC (`SecurityAdmin`, `StandardUser`, `Auditor`, `Guest`) and ABAC resource-ownership policies.
    - `src/sut/userinfo/UserProfileService.ts`: User profile service on port 3003 supporting full profile CRUD (`GET`, `PUT`, `PATCH`, `DELETE`) with email validation and bearer authorization checks.
    - `src/sut/eventbus/EventBus.ts`: In-memory asynchronous event broker dispatching domain events and centralized audit trail records (`audit.events`).
    - `src/sut/server.ts`: SUT cluster orchestrator providing unified boot/shutdown lifecycle methods.
  - Implemented Promise-native Screenplay test automation harness using `hand-baked-screenplay-pattern`:
    - Abilities: `CallAnApi` (HTTP execution and response caching), `ReceiveEvents` (asynchronous event ledger inspection), `HoldTokens` (actor authentication and role context).
    - Tasks: `AuthenticateWith`, `VerifyToken`, `TerminateSession`, `RefreshToken`, `CheckPermission`, `RetrieveProfile`, `ReplaceProfile`, `PatchProfile`, `DeleteProfile`, `DiscoverKeys`.
    - Questions: `TheLastResponse`, `TheAccessDecision`, `TheEmittedEvents`, `TheProfileDetails`.
    - Step Definitions: Complete Cucumber steps in `src/steps/` executing all 30 canonical Gherkin scenarios with 100% green pass rate.
  - Updated unified verification gate `scripts/verify.mjs` to execute OpenAPI, AsyncAPI, Gherkin AST linting, and the live Cucumber Screenplay test suite.

## [0.1.0] - 2026-08-18

### Added
- **Phase 0: Specifications & BDD Gherkin Suite (`POC-P0-01` & `POC-P0-02`)**:
  - Expanded OpenAPI 3.1 contract schemas (`specs/authn-api_v1.yaml`, `specs/authz-api_v1.yaml`, `specs/userinfo-api_v1.yaml`) with full endpoint operations, JWT `bearerAuth`, RBAC/ABAC models, CRUD schemas, and en-GB documentation.
  - Expanded AsyncAPI 3.0 contract (`specs/events_v1.yaml`) covering `authn.events`, `authz.events`, `userinfo.events`, and `audit.events` channels with structured CloudEvents-aligned payloads.
  - Added standalone validator scripts: `scripts/validate-asyncapi.mjs` (`@asyncapi/parser`) and `scripts/validate-gherkin.mjs` (`@cucumber/gherkin`).
  - Added `redocly.yaml` configuration with linting gates (`npm run lint:openapi`).
  - Authored canonical BDD Gherkin feature suite under `features/` (30 scenarios across 9 feature files in `authn/`, `authz/`, `profile/`, and `integration/`), establishing the strict single source of truth.
  - Integrated full verification gate in `scripts/verify.mjs` (`npm run verify`).
- Initial project structure onboarded into test-automation portfolio under Strategy 3 (`docs/adr/0001-strategy-3-phased-monorepo.md`).
