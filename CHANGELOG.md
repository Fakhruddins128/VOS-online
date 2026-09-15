# CHANGELOG.md — VOS Online

## Current baseline
The supplied repository is at:
`702ef20 Update server.js`

Branch state reported by the supplied Git repository:
`master` aligned with `origin/master`.

## Recent historical commits
- `702ef20` — Update server.js
- `6f69706` — update git
- `aa47a50` — Env
- `8ea8d49` — Add production environment variables to old.env
- `fa1855b` — Delete frontend/.env
- `412f14f` — Create old.env with server and database settings
- `da74fc5` — Delete backend/.env
- `8664008` — Change FRONTEND_URL to production address
- `eb9192c` — Error
- `d7b8b0e` — update Development and User Guide
- `0dd6cd1` — forget Password
- `711501b` — Project Cleanup
- `e059448` — 404 error Handling
- `b600fc9` — update dashboard header
- `58d3a5d` — Update login and dashboard

## Migration baseline
These files were generated after inspecting the supplied project and should be considered an OpenCode handover baseline, not a claim that every historical requirement is known.

## Known technical issues/inconsistencies identified during handover
1. Frontend `api.js` exposes generic user CRUD/product endpoints that are not mounted in the current backend.
2. Frontend token interceptor expects `localStorage.token`, but login currently persists vendor data through `AuthContext` rather than a JWT/token.
3. Some pages use native `fetch` while `api.js` provides Axios helpers.
4. `backend/sql/schema.sql` is much smaller than the production/reporting schema referenced by route SQL.
5. `GET /api/users/vendors` is described in source as a debugging endpoint and should be reviewed before production exposure.
6. Password reset currently emails a temporary password rather than using a one-time reset token.
7. The supplied repository contains `.env` files and Git history with environment-related commits. Treat any real credentials as compromised if they were ever committed/shared and rotate them.

## OpenCode rule
Append a dated entry here for every meaningful future change, including:
- feature changes
- bug fixes
- API changes
- database changes
- security changes
- deployment/configuration changes

## 2026-09-15 — Frontend accessibility pass
- Added `frontend/src/components/Icon.jsx`: an inline-SVG icon component (stroke-based, 24×24 outline family) with no new dependencies. Icons render `aria-hidden="true"` and `focusable="false"`.
- Replaced all emoji icons with the Icon component:
  - Sidebar menu (grid, clipboard-list, file-text, key), sidebar close (X), navbar login/logout (sign-in, sign-out).
  - Pending Orders and Purchase Order Draft refresh/print buttons and product-image buttons.
- Made sortable table headers keyboard-operable: headers in `PendingOrders` now are real `<button>` elements inside `<th>` with `scope="col"` and `aria-sort`.
- Added `aria-label` to icon-only image buttons and the rows-per-page select; added `scope="col"` to all remaining table headers.
- Image modals (`PendingOrders`, `PurchaseOrderDraft`): added `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape-to-close, initial focus on the close button, and focus return to the triggering button.
- Added show/hide password visibility toggles (eye/eye-off) to `Login` and `ChangePassword`, with `aria-label`/`aria-pressed`.
- Removed dead `handleLogout` in `Login.jsx` (referenced an undefined `setUser` and would have thrown).
- Added a "Skip to main content" link and `id="main-content"` on `<main>` in `App.jsx`.
- `App.css`: global `:focus-visible` rings, `.skip-link`, `.password-wrapper` / `.password-toggle` styles, and a `prefers-reduced-motion: reduce` block that limits animation/transition.
- `PendingOrders.css`: restyled `.sortable` for its new `<button>` context and added a high-contrast white `:focus-visible` ring on the gradient table header.
- Lint/build cleanup along the way (no behavior change): removed unused `user`, `navigate`, `getAvatarText`, `logout`, `useState`, and an unused `error` binding in `Navbar`, `Sidebar`, `PendingOrders`, `Dashboard`, `Home`.
- Verification: `npm run build` passes. `npm run lint` reports only pre-existing issues: `AuthContext.jsx` triggers `react-refresh/only-export-components` (structural — `useAuth` hook exported from a component file; refactor deferred as out of scope) and two `react-hooks/exhaustive-deps` warnings for the data-fetch effects in `PendingOrders` and `PurchaseOrderDraft` (pre-existing; avoiding a `useCallback` refactor of working fetch code).

### Manual test suggestions
- Keyboard: Tab through sidebar/nav, sort headers (Enter toggles sort), open image modal (focus lands on close), press Escape (focus returns to the image button).
- Password fields: eye toggle shows/hides text and announces via `aria-pressed`.
- With OS reduced-motion enabled, animations/spinners are effectively disabled.
