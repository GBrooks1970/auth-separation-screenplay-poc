# auth-separation-screenplay-poc — Backlog

**Version:** 5 — **Phase 3 Operational Hardening & Maintenance Established** (2026-09-07). Strategy 3 (Specification-First Monorepo with Phased Multi-Stack Parity).  
**Last Updated:** 2026-09-07  
**Based on:** Design Specification Draft ([`../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md`](../../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md)) and Initial Code Review (`.review/CODE_REVIEW_Antigravity_v1_20260819T1000Z`)

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

## Phase 3 — Operational Hardening & Maintenance

#### POC-P3-01: Add GitHub Actions CI Matrix Workflow — Score: 18
**Priority Score:** Security Impact (3) + Breakage Probability (7) + Maintenance Burden (8) = **18 (MEDIUM)**  
**Status:** Closed (2026-09-07)  
**Objective:** Establish `.github/workflows/ci.yml` matrix executing `npm run verify` across Node 20/22, Python 3.11+, and .NET 9 SDK on pull requests and main pushes.  
**Success Criteria:**
- [x] `.github/workflows/ci.yml` configured with least-privilege permissions (`contents: read`).
- [x] Validates contract linting, static type checking, Node.js reference SUT, and polyglot SUT execution in GitHub Actions runner.
- [x] Status checks report green in repository pull requests and main branch runs.

#### POC-P3-02: Remediate npm audit Security Vulnerabilities — Score: 20
**Priority Score:** Security Impact (8) + Breakage Probability (6) + Maintenance Burden (6) = **20 (HIGH)**  
**Status:** Open  
**Objective:** Remediate 21 vulnerabilities (6 high, 15 moderate) reported by `npm audit` across `@redocly/cli`, `fast-uri`, and `@cucumber/messages`.  
**Success Criteria:**
- [ ] High-severity `fast-uri` (SSRF/host confusion) and `@faker-js/faker` advisories resolved.
- [ ] `npm audit` reports 0 vulnerabilities (or only accepted low-risk non-exploitable transitive dev dependencies).
- [ ] `npm run verify` continues to pass 100% green without contract, linter, or BDD test regressions.

#### POC-P3-03: Legal & Packaging Normalisation — Score: 8
**Priority Score:** Security Impact (1) + Breakage Probability (2) + Maintenance Burden (5) = **8 (LOW)**  
**Status:** Open  
**Objective:** Add root `LICENSE` file (MIT) matching package declarations and reconcile README documentation with actual verification scripts.  
**Success Criteria:**
- [ ] Root `LICENSE` file created with standard MIT text (2026 Gary Brooks).
- [ ] GitHub repository correctly detected as MIT licensed.
- [ ] README §"Validation Gate" accurately reflects `scripts/verify.mjs` execution model.

#### POC-P3-04: Decouple Provider from Sibling Workspace Path — Score: 16
**Priority Score:** Security Impact (2) + Breakage Probability (6) + Maintenance Burden (8) = **16 (MEDIUM)**  
**Status:** Open  
**Objective:** Decouple `hand-baked-screenplay-pattern` from local relative file path (`file:../hand-baked-screenplay-pattern`) to permit standalone cloning and external CI runner execution.  
**Success Criteria:**
- [ ] `package.json` pins immutable `hand-baked-screenplay-pattern` release (v0.3.0) or packaged bundle per ADR-0002 pattern.
- [ ] Clean clone installs and runs `npm run verify` without requiring sibling repository checkout.

---

## Risk Summary

| Priority | Count | Status Distribution |
|---|---|---|
| HIGH (20–30) | 1 | 1 Open (POC-P3-02) |
| MEDIUM (10–19) | 1 | 1 Open (POC-P3-04), 6 Closed (POC-P0-01, POC-P0-02, POC-P1-01, POC-P1-02, POC-P2-01, POC-P3-01) |
| LOW (0–9) | 1 | 1 Open (POC-P3-03) |
| **Total Outstanding** | **3** | POC-P3-02, POC-P3-03, POC-P3-04 |
| Resolved | 6 | POC-P0-01, POC-P0-02, POC-P1-01, POC-P1-02, POC-P2-01, POC-P3-01 |
