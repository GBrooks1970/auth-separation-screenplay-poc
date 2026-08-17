# Project Contract — auth-separation-screenplay-poc

## Gates

npm run verify        # one command per line; all must pass before a commit is gated green

## Working norms

- **Single Source of Truth:** BDD feature files in `features/` serve as the sole source of truth for both business specifications and automated test execution across all SUT implementations and test harnesses.
- **Contract-First SDD:** OpenAPI 3.1 (`specs/`) and AsyncAPI 3.0 (`specs/`) contracts define all REST and Event interfaces before SUT implementation.
- **AI-Agent Agnostic:** All validation, builds, and test runs execute via standard CLI commands (`npm run verify`, `docker compose`, `pytest`).
- **Screenplay Pattern Idiom:** Scenario steps map directly to Screenplay vocabulary: Actors (`Alice`, `Bob`), Abilities (`CallAnApi`, `ReceiveEvents`), Tasks (`AuthenticateWith`, `CheckPermission`), and Questions (`TheLastResponse`, `TheAccessDecision`).
- **House Style:** en-GB spelling across all markdown documents, code comments, and Gherkin step descriptions.
