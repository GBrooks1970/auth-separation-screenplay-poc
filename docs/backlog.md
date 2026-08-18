# auth-separation-screenplay-poc — Backlog

**Version:** 4 — **Phase 2 Polyglot SUT Expansion Delivered** (2026-08-18). Strategy 3 (Specification-First Monorepo with Phased Multi-Stack Parity).  
**Last Updated:** 2026-08-18  
**Based on:** Design Specification Draft ([`../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md`](../../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md))

This backlog tracks the phased delivery of `auth-separation-screenplay-poc`. Ordering is by phase and priority score.

**Priority Scoring System:**
- **Score = Security Impact (0–10) + Breakage Probability (0–10) + Maintenance Burden (0–10)**
- **HIGH (20–30) / MEDIUM (10–19) / LOW (0–9)**

---

## Phase 0 — Specifications & BDD Gherkin Suite (Completed)

#### POC-P0-01: Author OpenAPI 3.1 & AsyncAPI 3.0 Contract Specs — Score: 18
**Priority Score:** Security Impact (4) + Breakage Probability (8) + Maintenance Burden (6) = **18 (MEDIUM)**  
**Status:** Closed (Delivered 2026-08-18)  
**Objective:** Author canonical OpenAPI 3.1 schemas for AuthN, AuthZ, and User Profile APIs, plus AsyncAPI 3.0 schemas for audit/notification event channels in `specs/`.  
**Success Criteria:**
- [x] OpenAPI 3.1 files (`authn-api_v1.yaml`, `authz-api_v1.yaml`, `userinfo-api_v1.yaml`) pass `@redocly/cli` linting (0 errors, 0 warnings).
- [x] AsyncAPI 3.0 file (`events_v1.yaml`) passes `@asyncapi/parser` validation.
- [x] `npm run verify` gate passes cleanly.

#### POC-P0-02: Author Canonical BDD Gherkin Feature Suite — Score: 17
**Priority Score:** Security Impact (3) + Breakage Probability (7) + Maintenance Burden (7) = **17 (MEDIUM)**  
**Status:** Closed (Delivered 2026-08-18)  
**Objective:** Author the single source of truth BDD Gherkin feature files under `features/` covering AuthN, AuthZ, User Profile, and Audit logging integration.  
**Success Criteria:**
- [x] Scenarios under `features/{authn,authz,profile,integration}/` cover happy path, negative authorization, and event audit logging (30 scenarios across 9 feature files).
- [x] All features pass `@cucumber/gherkin` parser validation.

---

## Phase 1 — Node.js Baseline SUT & Screenplay Test Suite (Completed)

#### POC-P1-01: Implement Node.js Reference SUT Services with Swagger UI — Score: 16
**Priority Score:** Security Impact (4) + Breakage Probability (6) + Maintenance Burden (6) = **16 (MEDIUM)**  
**Status:** Closed (Delivered 2026-08-18)  
**Objective:** Implement baseline Node.js SUT services for AuthN (port 3001), AuthZ (port 3002), and User Profile (port 3003) with in-memory state, event bus messaging, and embedded Swagger UI endpoints (`/docs`).  
**Success Criteria:**
- [x] SUT boots deterministically and cleanly via unified orchestrator `createSutCluster()`.
- [x] Swagger UI interactive docs available at `/docs` across AuthN, AuthZ, and User Profile services.
- [x] Key discovery (`/.well-known/jwks.json`) and token signing/verification working in AuthN.
- [x] RBAC and dynamic policy checks working in AuthZ.
- [x] Profile CRUD and event publishing working in UserProfile.

#### POC-P1-02: Implement Promise-Native Screenplay Test Harness — Score: 15
**Priority Score:** Security Impact (2) + Breakage Probability (6) + Maintenance Burden (7) = **15 (MEDIUM)**  
**Status:** Closed (Delivered 2026-08-18)  
**Objective:** Build the TypeScript Screenplay test layer using `hand-baked-screenplay-pattern` executing the shared `features/` Gherkin suite.  
**Success Criteria:**
- [x] Actors (`Alice`, `Bob`, `Charlie`), Abilities (`CallAnApi`, `ReceiveEvents`, `HoldTokens`), Tasks (`AuthenticateWith`, `VerifyToken`, `TerminateSession`, `CheckPermission`, `ManageProfile`), and Questions (`TheLastResponse`, `TheAccessDecision`, `TheEmittedEvents`, `TheProfileDetails`) execute all scenarios.
- [x] `npm test` runs 100% green against local SUTs (30/30 scenarios passed).
- [x] Unified `npm run verify` gate passes specifications, linting, and BDD tests.

---

## Phase 2 — Polyglot SUT Expansion & Secondary Test Runners (Completed)

#### POC-P2-01: Implement Secondary Polyglot SUT Services (Python / C#) — Score: 14
**Priority Score:** Security Impact (3) + Breakage Probability (5) + Maintenance Burden (6) = **14 (MEDIUM)**  
**Status:** Closed (Delivered 2026-08-18)  
**Objective:** Implement alternate service targets in Python (FastAPI AuthZ) and C# (.NET 9 ASP.NET Core User Profile) to demonstrate contract interchangeability against the exact same BDD features.  
**Success Criteria:**
- [x] Python FastAPI AuthZ service implemented under `sut-polyglot/python-authz/` conforming to `specs/authz-api_v1.yaml`.
- [x] C# ASP.NET Core User Profile service implemented under `sut-polyglot/dotnet-userinfo/` conforming to `specs/userinfo-api_v1.yaml`.
- [x] Multi-stack orchestrator `createPolyglotCluster()` spawns live Python and .NET targets and bridges audit events.
- [x] `npm run test:polyglot` executes all 30 canonical Gherkin scenarios against the polyglot stack with 100% green pass rate without changing any test or feature code.
- [x] Unified `npm run verify` gate validates contract linting, Node.js SUT execution, and Polyglot SUT execution.

---

## Risk Summary

| Priority | Count | Status Distribution |
|---|---|---|
| HIGH (20–30) | 0 | — |
| MEDIUM (10–19) | 0 | 5 Closed (POC-P0-01, POC-P0-02, POC-P1-01, POC-P1-02, POC-P2-01) |
| LOW (0–9) | 0 | — |
| **Total Outstanding** | **0** | All roadmap tickets delivered |
| Resolved | 5 | POC-P0-01, POC-P0-02, POC-P1-01, POC-P1-02, POC-P2-01 |
