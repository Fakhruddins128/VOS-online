# OPENCODE_HANDOFF.md

## First instruction to OpenCode

You are taking over an existing VOS Online project previously developed with Trae AI.

Before changing code:
1. Read `AGENTS.md`.
2. Read `PROJECT_CONTEXT.md`.
3. Read the relevant parts of `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, `BUSINESS_RULES.md`, and `CHANGELOG.md`.
4. Inspect the actual source files.
5. Verify that the documentation matches the current source.
6. Do not redesign or refactor the application unless explicitly requested.

## Handover prompt

Read all OpenCode handover documentation in the project root.

Then inspect the actual frontend and backend source code and verify:
- routes
- authentication
- API calls
- database access
- page/component relationships
- environment-variable usage
- current business rules
- current Git baseline

Do not modify application code yet.

Return:
1. Project understanding
2. Frontend architecture
3. Backend architecture
4. Database understanding
5. Authentication flow
6. API map
7. Major features
8. Confirmed business rules
9. Documentation/source mismatches
10. Known bugs/risks
11. Recommended development workflow

Then wait for my next task.

## For every future development task

Use this sequence:

UNDERSTAND
-> INSPECT
-> PLAN
-> ASK/CONFIRM
-> IMPLEMENT
-> TEST
-> REVIEW
-> DOCUMENT

Do not skip source inspection.
