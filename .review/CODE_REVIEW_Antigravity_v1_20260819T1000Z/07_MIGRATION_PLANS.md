# Migration Plans

[<- Back to Architecture Assessment](06_ARCHITECTURE_ASSESSMENT.md) | [Back to Index ->](00_CODE_REVIEW_Antigravity_v1_20260819T1000Z.md)

---

## 1. Planned Next Steps & Enhancements

### Milestone 1: CI/CD Pipeline & GitHub Pages Living Docs
- Implement GitHub Actions workflow (`.github/workflows/ci.yml`) to execute `npm run verify` across all pull requests.
- Deploy interactive OpenAPI Swagger UI documentation to GitHub Pages.

### Milestone 2: Container Topology Deployment
- Add multi-container `docker-compose.yml` to package AuthN, AuthZ, UserProfile, and Test Runner into orchestrated Docker containers.

### Milestone 3: Polyglot Test Runner Parity
- Add Python `pytest-bdd` runner validating the identical `features/` directory to demonstrate test runner polyglot parity.
