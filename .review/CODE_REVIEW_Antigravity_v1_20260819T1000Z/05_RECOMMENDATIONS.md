# Recommendations

[<- Back to Cross-Project Analysis](04_CROSS_PROJECT_ANALYSIS.md) | [Next: Architecture Assessment ->](06_ARCHITECTURE_ASSESSMENT.md)

---

## 1. Short-Term Recommendations
1. **GitHub Actions CI/CD**: Add `.github/workflows/ci.yml` matrix executing `npm run verify` across Node 20/22, Python 3.11+, and .NET 9 SDK.
2. **Containerised Orchestration**: Add `docker-compose.yml` to package Node.js, Python FastAPI, and .NET services for zero-toolchain developer boots.

## 2. Long-Term Recommendations
1. **Secondary Test Harness**: Implement a Python-based `pytest-bdd` / Screenplay test harness executing the same `features/` directory to demonstrate test-runner interchangeability.
2. **Distributed Broker Adapter**: Add an optional AMQP/RabbitMQ message broker adapter alongside the local in-memory event bus.
