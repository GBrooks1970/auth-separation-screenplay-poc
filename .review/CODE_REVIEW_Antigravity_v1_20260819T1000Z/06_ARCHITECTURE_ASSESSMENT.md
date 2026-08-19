# Architecture Assessment

[<- Back to Recommendations](05_RECOMMENDATIONS.md) | [Next: Migration Plans ->](07_MIGRATION_PLANS.md)

---

## 1. Architectural Principles

- **Separation of Concerns**: Complete isolation of authentication credential validation (AuthN), authorization permission evaluation (AuthZ), and user profile attribute storage (UserProfile).
- **Contract-Driven Design**: The OpenAPI 3.1 and AsyncAPI 3.0 schemas dictate the wire format, HTTP status codes, error payloads, and asynchronous event schema definitions.
- **Screenplay Pattern Automation**: Complete separation of test Intent (Gherkin features), Domain Actions (Screenplay Tasks & Abilities), and State Verification (Screenplay Questions).

## 2. Multi-Stack Evaluation

```
+-----------------------------------------------------------------------------------+
|                           CANONICAL BDD GHERKIN SUITE                             |
|                           (features/ - 30 scenarios)                              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                         PROMISE-NATIVE SCREENPLAY HARNESS                         |
|                   (hand-baked-screenplay-pattern / Cucumber.js)                   |
+-----------------------------------------------------------------------------------+
                         /                                   \
                        /                                     \
    [SUT_TARGET=nodejs]                                  [SUT_TARGET=polyglot]
                      /                                         \
                     v                                           v
+----------------------------------------+  +---------------------------------------+
|          NODE.JS REFERENCE SUT         |  |         POLYGLOT MULTI-STACK SUT      |
|  - AuthN (Node.js Express / Port 3001) |  |  - AuthN (Node.js / Port 3001)        |
|  - AuthZ (Node.js Express / Port 3002) |  |  - AuthZ (Python FastAPI / Port 3002) |
|  - Profile (Node.js / Port 3003)       |  |  - Profile (C# .NET 9 / Port 3003)    |
+----------------------------------------+  +---------------------------------------+
```
