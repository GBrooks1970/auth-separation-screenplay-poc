# auth-separation-screenplay-poc — Backlog

**Version:** 1 — **Project initiated & onboarded** (2026-08-17). Strategy 3 (Specification-First Monorepo with Phased Multi-Stack Parity) selected as the recorded architectural roadmap.
**Last Updated:** 2026-08-17
**Based on:** Design Specification Draft ([`../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md`](../../project-specs/potential-project-outlines/auth-separation-screenplay-poc.md))

This backlog tracks the phased delivery of `auth-separation-screenplay-poc`. Ordering is by phase and priority score.

**Priority Scoring System:**
- **Score = Security Impact (0–10) + Breakage Probability (0–10) + Maintenance Burden (0–10)**
- **HIGH (20–30) / MEDIUM (10–19) / LOW (0–9)**

---

## Outstanding Items

### Phase 0 — Specifications & BDD Gherkin Suite

#### POC-P0-01: Author OpenAPI 3.1 & AsyncAPI 3.0 Contract Specs — Score: 18
**Priority Score:** Security Impact (4) + Breakage Probability (8) + Maintenance Burden (6) = **18 (MEDIUM)**  
**Status:** Open  
**Objective:** Author canonical OpenAPI 3.1 schemas for AuthN, AuthZ, and User Profile APIs, plus AsyncAPI 3.0 schemas for audit/notification event channels in `specs/`.  
**Success Criteria:**
- [ ] OpenAPI 3.1 files (`authn-api_v1.yaml`, `authz-api_v1.yaml`, `userinfo-api_v1.yaml`) pass `@redocly/cli` linting.
- [ ] AsyncAPI 3.0 file (`events_v1.yaml`) passes `@asyncapi/parser` validation.
- [ ] `npm run verify` gate passes cleanly.

#### POC-P0-02: Author Canonical BDD Gherkin Feature Suite — Score: 17
**Priority Score:** Security Impact (3) + Breakage Probability (7) + Maintenance Burden (7) = **17 (MEDIUM)**  
**Status:** Open  
**Objective:** Author the single source of truth BDD Gherkin feature files under `features/` covering AuthN, AuthZ, User Profile, and Audit logging integration.  
**Success Criteria:**
- [ ] Scenarios under `features/{authn,authz,profile,integration}/` cover happy path, negative authorization, and event audit logging.
- [ ] All features pass `@cucumber/gherkin` parser validation.

---

### Phase 1 — Node.js Baseline SUT & Screenplay Test Suite

#### POC-P1-01: Implement Node.js Reference SUT Services with Swagger UI — Score: 16
**Priority Score:** Security Impact (4) + Breakage Probability (6) + Maintenance Burden (6) = **16 (MEDIUM)**  
**Status:** Open  
**Objective:** Implement baseline Fastify/Express SUT services for AuthN, AuthZ, and User Profile with SQLite/Redis backends and embedded Swagger UI endpoints (`/docs`).  
**Success Criteria:**
- [ ] SUT boots deterministically via Docker Compose or local Node.js.
- [ ] Swagger UI interactive docs available at `/docs` on all 3 APIs.

#### POC-P1-02: Implement Promise-Native Screenplay Test Harness — Score: 15
**Priority Score:** Security Impact (2) + Breakage Probability (6) + Maintenance Burden (7) = **15 (MEDIUM)**  
**Status:** Open  
**Objective:** Build the TypeScript Screenplay test layer using `hand-baked-screenplay-pattern` executing the shared `features/` Gherkin suite.  
**Success Criteria:**
- [ ] Actors (`Alice`, `Bob`), Abilities (`CallAnApi`), Tasks (`AuthenticateWith`), and Questions (`TheLastResponse`) execute scenarios cleanly.
- [ ] `npm test` runs 100% green against local SUTs.

---

### Phase 2 — Polyglot SUT Expansion & Secondary Test Runners

#### POC-P2-01: Implement Secondary Polyglot SUT Services (Python / C#) — Score: 14
**Priority Score:** Security Impact (3) + Breakage Probability (5) + Maintenance Burden (6) = **14 (MEDIUM)**  
**Status:** Open  
**Objective:** Implement alternate service targets (Python FastAPI AuthZ, C# ASP.NET Core Profile) to verify contract interchangeability against the exact same BDD features.

---

## Risk Summary

| Priority | Count | Status Distribution |
|---|---|---|
| HIGH (20–30) | 0 | — |
| MEDIUM (10–19) | 5 | 5 Open (POC-P0-01, POC-P0-02, POC-P1-01, POC-P1-02, POC-P2-01) |
| LOW (0–9) | 0 | — |
| **Total Outstanding** | **5** | All Phase 0–2 items |
| Resolved | 0 | — |
