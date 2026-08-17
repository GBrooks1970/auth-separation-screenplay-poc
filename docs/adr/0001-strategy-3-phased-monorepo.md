# ADR 0001: Adopt Strategy 3 (Specification-First Monorepo with Phased Multi-Stack Parity)

**Status:** Approved  
**Date:** 2026-08-17  
**Context:** `auth-separation-screenplay-poc` requires an architecture that demonstrates Specification-Driven Development (SDD), Behaviour-Driven Development (BDD), and the Screenplay design pattern across separated AuthN, AuthZ, and User Profile APIs.

## Options Evaluated

1. **Strategy 1:** Polyglot Microservices + Multi-Stack Screenplay Consumers (Full Parity Matrix from Day 1).
2. **Strategy 2:** Contract-Driven Virtualised Stubs + Dual-Provider TypeScript Screenplay Suite.
3. **Strategy 3:** Specification-First Monorepo with Phased Multi-Stack Parity (Recommended).

## Decision

Adopt **Strategy 3**. The monorepo establishes OpenAPI 3.1, AsyncAPI 3.0, and BDD Gherkin features (`features/`) as the strict single source of truth. SUT implementations and test-automation runners are delivered in phased milestones (Node.js reference SUT first, followed by polyglot services and secondary runners).

## Consequences

- **Positive:** Low initial onboarding friction, immediate runnable/testable baseline in Phase 1, clear contract boundaries, and clean progression to full polyglot parity in Phase 2.
- **Negative:** Full polyglot SUT parity is deferred to Phase 2 rather than available on initial commit.
