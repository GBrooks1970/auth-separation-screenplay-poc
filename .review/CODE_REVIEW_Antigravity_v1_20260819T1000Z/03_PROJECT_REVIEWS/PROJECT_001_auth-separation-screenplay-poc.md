# Project Review: auth-separation-screenplay-poc

[<- Back to Risks and Issues](../02_RISKS_AND_ISSUES.md) | [Next: Cross-Project Analysis ->](../04_CROSS_PROJECT_ANALYSIS.md)

---

## 1. Specification Layer (`specs/`)
- `authn-api_v1.yaml`: OpenAPI 3.1 schema covering `/auth/login`, `/auth/verify`, `/auth/refresh`, `/auth/logout`, and `/.well-known/jwks.json`.
- `authz-api_v1.yaml`: OpenAPI 3.1 schema covering `/authz/check-permission`, `/authz/roles/{user_id}`, and `/authz/permissions`.
- `userinfo-api_v1.yaml`: OpenAPI 3.1 schema covering `/profiles/{userId}` (`GET`, `PUT`, `PATCH`, `DELETE`).
- `events_v1.yaml`: AsyncAPI 3.0 schema defining message payloads on `authn.events`, `authz.events`, `userinfo.events`, and `audit.events`.

## 2. Feature Acceptance Layer (`features/`)
- 30 canonical Gherkin scenarios across 9 feature files.
- Zero mock step definitions; all steps interact with live HTTP endpoints and domain event streams.

## 3. Reference SUT Implementations
- **Node.js Reference Stack** (`src/sut/`): TypeScript microservices running on ports 3001, 3002, 3003 with dynamic Swagger UI mounting.
- **Python FastAPI Stack** (`sut-polyglot/python-authz/`): Asynchronous ASGI service on port 3002 with Pydantic validation and RBAC/ABAC policy engine.
- **C# ASP.NET Core Stack** (`sut-polyglot/dotnet-userinfo/`): .NET 9 Minimal API on port 3003 with strongly typed DTOs and email regex validation.

## 4. Test Automation Harness (`src/screenplay/` & `src/steps/`)
- Promise-native Screenplay pattern integration using `hand-baked-screenplay-pattern`.
- Actors: `Alice` (SecurityAdmin), `Bob` (StandardUser), `Charlie` (Guest).
- Complete isolation with pre-scenario `/internal/reset` hooks.
