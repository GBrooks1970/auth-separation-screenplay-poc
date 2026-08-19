# Cross-Project Analysis

[<- Back to Project Reviews](03_PROJECT_REVIEWS/PROJECT_001_auth-separation-screenplay-poc.md) | [Next: Recommendations ->](05_RECOMMENDATIONS.md)

---

## Relationship with Portfolio Siblings

### 1. `auth-separation` (Methodology Exemplar)
- **Role Alignment:** `auth-separation` serves as the pure specification blueprint with bounded 501 stubs (`ADR-0005`).
- **Complementarity:** `auth-separation-screenplay-poc` takes those architectural principles and implements working SUT services and an automated BDD Screenplay test harness, providing full empirical verification.

### 2. `hand-baked-screenplay-pattern` (Core Dependency)
- **Role Alignment:** Provides the zero-dependency, promise-native Screenplay pattern core (`Actor`, `Stage`, `Cast`, `Ability`, `Task`, `Question`).
- **Verification:** Serves as a primary consumer proving the ergonomic viability of `hand-baked-screenplay-pattern` in multi-actor API test scenarios.

### 3. `calculator-screenplay-bdd` & `mobile-forex-automation`
- Shares consistent Screenplay architecture conventions, naming styles, and Cucumber step organisation across the portfolio.
