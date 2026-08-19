# Risks and Issues

[<- Back to Index](00_CODE_REVIEW_Antigravity_v1_20260819T1000Z.md) | [Next: Project Reviews ->](03_PROJECT_REVIEWS/PROJECT_001_auth-separation-screenplay-poc.md)

---

## Detailed Findings

### R-01: Cross-Process Event Forwarding via HTTP Bridge (LOW)
- **Context:** Node.js AuthN, Python FastAPI AuthZ, and C# .NET 9 User Profile run as separate OS subprocesses during polyglot test runs.
- **Mechanism:** Polyglot services emit domain events (`AccessDecisionLogged`, `ProfileUpdated`) to `http://localhost:3001/events`, which delegates to the test harness's in-memory `globalEventBus`.
- **Assessment:** Works cleanly for local test execution and CI runners. For production deployment, a distributed broker like RabbitMQ, Apache Kafka, or AWS SNS/SQS would replace the HTTP forwarding bridge.

### R-02: Local Subprocess Management & Host Runtime Dependencies (LOW)
- **Context:** Running `npm run test:polyglot` expects Python 3.10+ (with `fastapi`, `uvicorn`, `pydantic`) and .NET 9 SDK installed on the host machine.
- **Assessment:** `polyglotLauncher.ts` handles graceful startup, port polling, and teardown with process signal trapping (`SIGINT`/`SIGTERM`). Containerization with Docker Compose provides an isolated fallback for environments lacking local Python/.NET toolchains.

### R-03: Single Source of Truth Alignment across Multi-Stack SUTs (INFO)
- **Observation:** Both Node.js and Polyglot backends conform exactly to `specs/` and `features/`. No drift detected between OpenAPI schemas and endpoint contracts.

---
