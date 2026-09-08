# ADR 0002: Decouple Screenplay Provider via Immutable Vendored Bundle

**Status:** Approved  
**Date:** 2026-09-08  
**Context:** `auth-separation-screenplay-poc` initially referenced the sibling workspace dependency via a relative file path (`"hand-baked-screenplay-pattern": "file:../hand-baked-screenplay-pattern"`). While convenient during initial cross-repo development, this prevented standalone cloning and caused external CI runners to fail unless the sibling repository was separately checked out and built.

## Options Evaluated

1. **Option 1: Git Dependency with Pinned Tag (`github:NeoCognitus70/hand-baked-screenplay-pattern#v0.3.0`).**
   - Requires npm to build the provider during installation (`npm run prepare`), but upstream `.gitignore` excludes `dist/` without providing an automated `prepare` script, introducing installation friction and network latency.
2. **Option 2: Relative Sibling Workspace Path (`file:../hand-baked-screenplay-pattern`).**
   - Couples the project to a specific filesystem layout, breaking standalone clones and requiring complex multi-repo checkout steps in CI.
3. **Option 3: Immutable Vendored Tarball (`file:vendor/hand-baked-screenplay-pattern-0.3.0.tgz`) (Recommended).**
   - Vendors the pre-compiled, integrity-hashed package tarball containing pre-built ESM/CJS distributions and TypeScript declaration maps directly inside `vendor/`.

## Decision

Adopt **Option 3**. Vendor `hand-baked-screenplay-pattern-0.3.0.tgz` within `vendor/` and pin `package.json` to `"file:vendor/hand-baked-screenplay-pattern-0.3.0.tgz"`.

## Consequences

- **Positive:**
  - Standalone portability: clean clones install and execute `npm run verify` immediately with zero external repo prerequisites.
  - Determinism and immutability: tests execute against an exact, immutable release artifact.
  - Simplified CI: removes multi-repository checkouts and compilation steps from `.github/workflows/ci.yml`.
- **Negative:**
  - Adds ~76 KB binary tarball to repository history. Upstream provider updates require explicit re-vendoring.