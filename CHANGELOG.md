# Changelog

All notable changes to `auth-separation-screenplay-poc` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
