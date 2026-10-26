# SolarSense Frontend — Feature Status

_Last updated: 2026-10-26_

React 19 + TypeScript (strict) + Vite 8, React Router 8, TanStack Query 5,
Axios, Recharts 3, Tailwind CSS 4, @react-pdf/renderer (report PDF only).
API contract: `docs/openapi.json`. Integration notes: `docs/FRONTEND.md`.

## Working today

### Auth (`src/api/client.ts`, `src/auth/`, `src/pages/auth/`)
- Pages: `/login`, `/register` (creates a company + its admin), `/accept-invite?token=`
  (preview via `POST /auth/invitations/lookup`, then `POST /auth/invitations/accept`), logout
  in the header (`POST /auth/logout`)
- Access token kept **in memory only** (`src/auth/session.ts`, a small external
  store read with `useSyncExternalStore`). Never in localStorage
- On page load, `POST /auth/refresh` restores the session from the httpOnly
  cookie (`src/auth/bootstrap.ts`, runs once outside React)
- Axios `withCredentials: true`; request interceptor adds `Authorization: Bearer`
- On a 401 from a non-auth endpoint: refresh once, retry the request. All
  callers share **one in-flight refresh**, and a Web Lock serialises refreshes
  across browser tabs (refresh tokens rotate; reuse revokes every session)
- Refresh rejected (401/403) → signed out → `ProtectedRoute` redirects to
  `/login` and returns the user to the page they wanted after login. A
  **network error** during refresh does not sign the user out
- Query cache is cleared whenever the session becomes anonymous
- Error messages: `getErrorMessage()` handles both `{"detail": "..."}` and
  FastAPI 422 `{"detail": [...]}` shapes, plus network errors

### Roles (`src/auth/roles.ts`)
- `isAdmin()` = `company_admin` or `super_admin`. Admin-only UI is hidden for
  installers: create project, pair device, invite / edit team members.
  403s are still handled with a readable message

### Projects and device pairing (`src/pages/projects/`)
- `/projects`: project cards with site counts (`GET /projects`, `GET /sites`),
  "New project" dialog for admins (`POST /projects`)
- `/projects/:projectId`: the project's sites (filtered from `GET /sites`, as
  there is no single-project GET)
- **Pair a device** (admins): creates a site with name, `device_id`,
  latitude, longitude (`POST /projects/{id}/sites`). "Use my current location"
  fills coordinates from the browser. 409 → "device ID already paired".
  The device then publishes to MQTT topic `solarsense/{device_id}/readings`
  (backend subscribes; the frontend never talks to MQTT)

### Site page (`src/pages/sites/SitePage.tsx`, route `/sites/:siteId`)
Loads the site from `GET /sites` (no single-site GET) and shows tabs:

- **Overview** (`OverviewTab.tsx`): device status (latest reading, "reporting"
  vs "quiet" after 15 min), bill count + average kWh, latest visit progress,
  site details with a Google Maps link, link to the report
- **Live Data** (`live/`): latest reading cards (irradiance W/m², ambient
  temp, humidity, tilt x/y/z, heading + compass direction), charts of the
  last 500 readings for irradiance / temperature / humidity, polled every
  **30 s** (`LIVE_POLL_INTERVAL_MS` in `src/config.ts`), stale-device warning,
  table view. `GET /sites/{id}/readings?limit=`
- **History** (`history/`): date range (Malaysian dates) with Today / 7 / 30
  day presets, summary stats, charts averaged into ~500 time buckets, table
  view, **CSV and Excel export** (`GET /sites/{id}/readings/export`, downloaded
  as an authenticated blob). Because the list endpoint has no date filter,
  it pages back from the newest reading (1000 per page) and stops at 20 pages
  (20,000 readings) with a warning; exports always cover the full range
- **TNB Bill** (`bills/`): drag-and-drop or pick one or more PDFs, uploaded
  one at a time (`POST /sites/{id}/bills`, multipart field `file`), feedback on
  how many of the 6 parsed fields were read, bills table with "couldn't read"
  for null fields, average monthly kWh, latest tariff category, monthly kWh
  bar chart, "View PDF" (`GET /bills/{id}/file` as a blob)
- **Benchmark** (`benchmark/`): month picker (defaults to the current month),
  headline device-to-satellite ratio with a shading guide, or "collecting
  data" when `device_complete_days` is 0; device vs satellite chart and a full
  figures table; optional 12-month comparison (12 requests, one per month).
  502 → "satellite data unavailable" with retry. `GET /sites/{id}/benchmark?month=`
- **Checklist** (`visits/`): visit list with progress bars
  (`GET /sites/{id}/visits`); start a visit with the default 20-item list or an
  empty one (`POST /sites/{id}/visits`). Visit page (`visits/:visitId`):
  items grouped by category, large OK / Issue / N/A buttons (tap again to
  reset to pending), value and notes saved on blur, add item (pick an existing
  category or create a new one), remove item, complete (blocked while items
  are pending), reopen, delete visit, visit notes. Item updates are
  optimistic with rollback. Uses `GET/PATCH/DELETE /visits/{id}` and
  `POST/PATCH/DELETE /visits/{id}/items[/{item_id}]`
- **Report** (`report/`): assumptions form (system kWp or blank for auto,
  cost per kWp, panel W, self-consumption %, performance ratio %, export
  credit, AFA rate), validated against the API ranges. Shows system size,
  panel count, cost, annual savings, payback, bill before/after, solar
  coverage, lifetime savings, shading source (measured vs satellite only),
  monthly bill chart, monthly table, "estimates, not a quotation" disclaimer.
  422 (no bills) → link to the TNB Bill tab. `GET /sites/{id}/feasibility`
  - **PDF**: built in the browser with @react-pdf/renderer
    (`FeasibilityDocument.tsx`), loaded only when the user clicks download
  - **Excel**: `GET /sites/{id}/feasibility/xlsx` with the same assumptions

### Team (`src/pages/team/`, route `/team`)
- Member list for everyone (`GET /users`)
- Admins: change role installer ↔ company_admin, deactivate / reactivate
  (`PATCH /users/{id}`); controls hidden on their own row and on super_admins
- Admins: invite by email + role (`POST /users/invitations`), copyable link
  `<origin>/accept-invite?token=...` shown once; pending invites list with
  revoke (`GET` / `DELETE /users/invitations`)

### Cross-cutting
- Every page has loading, empty and error (with retry) states
- All times shown in `Asia/Kuala_Lumpur`; money as RM; energy as kWh
- Charts (`src/components/charts/`): one measure per chart, no dual axes,
  line breaks where the device sent no data, late / duplicate readings
  sorted and de-duplicated (`src/lib/timeseries.ts`)
- Responsive for phones and tablets; checklist buttons are ≥ 44 px tap targets
- Every page is lazy-loaded (main bundle ~262 kB); route error page offers a
  reload when a stale chunk fails to load
- API types generated from `docs/openapi.json` into `src/api/schema.d.ts`
  (`npm run gen:api`); aliases in `src/api/types.ts`

## Not built (no backend endpoint)

- Edit or delete projects, sites (including re-pairing a device) and bills
- Readings date filter or aggregation (History pages through raw readings)
- Solcast / Solargis benchmarks (API returns PVGIS only)
- Photo uploads on visits
- Password reset, email verification

## Frontend-only decisions to know about

- Live polling is 30 s, not 5 s, following `docs/FRONTEND.md`
- Benchmark shading guide: ratio ≥ 0.9 "expected sunlight", ≥ 0.7 "some
  shading likely", below that "significant shading". These bands are a UI
  guide, not from the backend
- Clearing a checklist item's value or notes sends `""` (not `null`), since
  `null` in a PATCH may mean "leave unchanged"
- `npm run gen:api` runs openapi-typescript with its own TypeScript 5, because
  it doesn't support the project's TypeScript 6

## Testing status

- `npm run build` and `npm run lint` pass
- Has been run by hand against the real backend. No automated tests yet
  (no unit, component or end-to-end suite)

## Layout

```
src/
  api/          axios client, typed functions per resource, blob downloads
  auth/         session store, bootstrap refresh, role helpers
  hooks/        TanStack Query hooks (query keys in queryKeys.ts)
  components/   ui/ (buttons, fields, modal, states), charts/, layout/
  lib/          formatting, dates (Malaysian time), time-series helpers
  pages/        auth/, projects/, sites/ (one folder per tab), team/
  routes/       router (lazy routes), ProtectedRoute, GuestRoute, error page
```
