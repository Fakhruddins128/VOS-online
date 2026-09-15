# AGENTS.md — VOS Online / OpenCode Development Rules

## Project identity
VOS Online is a vendor-facing web portal. It is an existing React + Node/Express + Microsoft SQL Server application previously developed with AI assistance (including Trae AI). OpenCode is taking over future development.

## Mandatory workflow
1. Read `PROJECT_CONTEXT.md` before starting a non-trivial task.
2. Read the relevant sections of `ARCHITECTURE.md`, `API_DOCUMENTATION.md`, `DATABASE.md`, and `BUSINESS_RULES.md`.
3. Inspect the actual source code before proposing or making changes.
4. Treat source code as the current implementation of record. Documentation must not override verified implementation.
5. Clearly distinguish confirmed facts from assumptions/inferences.
6. Before coding, provide a short implementation plan and list affected files.
7. Do not modify unrelated functionality.
8. Do not rewrite working functionality merely to introduce a preferred architecture.
9. Do not change database tables, columns, stored data, or SQL business rules without explicit approval.
10. Do not change existing API contracts without explicit approval.
11. Do not add dependencies unless there is a clear need and the impact is explained.
12. Never expose, commit, print, or copy secrets from `.env`, tokens, passwords, or credentials.
13. Use environment variables for secrets and document variable names only.
14. After implementation, run the appropriate lint/build/test checks.
15. Update `CHANGELOG.md` and relevant documentation when behavior, APIs, architecture, database, or business rules change.

## Coding principles
- Preserve existing React component and CSS patterns unless the task requires otherwise.
- Preserve the existing Express route structure unless a refactor is explicitly approved.
- Prefer parameterized SQL queries. Never concatenate user-controlled values into SQL.
- Validate and normalize input at the API boundary.
- Keep vendor scoping intact: vendor-specific data must remain filtered by the authenticated/current vendor identity.
- Avoid introducing authentication mechanisms that conflict with the current application until the authentication design is explicitly reviewed.
- Maintain existing pagination, sorting, category behavior, and image-display behavior unless the task says otherwise.
- Keep production error responses free of internal implementation details.

## Security rules
- `.env` files are local configuration and must never be committed or reproduced in documentation.
- If a real credential is discovered in source control/history, stop and report it; recommend rotation.
- Passwords must not be stored or logged in plaintext.
- Do not add debug logging that prints full database rows, passwords, reset passwords, tokens, or other sensitive information.

## Verification
For frontend changes:
- Run `npm run lint`
- Run `npm run build`

For backend changes:
- Start the backend in a safe environment and exercise the affected endpoint(s).
- Run any available automated tests; note that the current backend package has no real test suite.

For database changes:
- Provide a reviewable SQL migration script.
- Do not run destructive production SQL without explicit approval.

## Important current-state warning
The project contains legacy/inconsistent code paths. In particular, `frontend/src/services/api.js` exposes generic user CRUD and product API functions, while the current backend `server.js` mounts only `/api/users`, `/api/pending-orders`, and `/api/purchase-order-draft`, and `users.js` currently defines login/vendors/change-password/forgot-password routes. Verify before using or extending those generic API functions.
