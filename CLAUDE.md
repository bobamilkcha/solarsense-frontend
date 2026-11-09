# SolarSense Frontend

React + TypeScript dashboard for SolarSense, an ESP32-based IoT device for
hyperlocal solar site assessment, used by Malaysian solar installers (B2B).
Backend repo: solarsense-backend (FastAPI + PostgreSQL + MinIO + EMQX MQTT).

## Sources of truth (read these first)
- docs/openapi.json: the exact API contract. Never invent endpoints, fields or
  enums. If something you need isn't in it, list it as a backend gap instead of guessing.
- docs/frontend.md: the frontend spec/notes. If it conflicts with this file, it wins.

## Stack
Vite, React, TypeScript (strict), React Router, TanStack Query, Axios,
Recharts, Tailwind CSS. Don't add other major libraries without asking.

## Environment
- Runs in WSL. Use only the WSL (nvm) Node/npm, never the Windows one.
- API base URL from `import.meta.env.VITE_API_URL` (dev: http://localhost:8000).
- Never commit .env files or hardcode secrets.

## Auth
- Login returns a short-lived JWT access token. The refresh token is an httpOnly
  cookie, so axios must use `withCredentials: true`.
- Keep the access token in memory only (not localStorage).
- Axios interceptor: attach the token, on 401 call the refresh endpoint once,
  retry the request, otherwise redirect to /login.
- Role-based UI: hide or disable actions the user's role can't perform, and
  scope all data to the user's company. The backend is the real enforcement.

## Architecture
- src/api/: axios instance + typed functions per resource (types generated from
  docs/openapi.json, e.g. with openapi-typescript)
- src/hooks/: TanStack Query hooks wrapping the API functions
- src/pages/, src/components/, src/routes/ (with a ProtectedRoute wrapper)
- Every page needs loading, empty and error states.
- Live readings: poll with TanStack Query `refetchInterval` (about 5s).
  Sensor data may arrive late or with gaps, so charts must handle both.

## Pages to build (map to project requirements)
1. Login / register / logout (NFR5)
2. Projects list + create/edit/delete (FR3)
3. Project detail: tabs for Overview, Live Data, History, TNB Bill, Benchmark,
   Checklist, Report
4. Device pairing: link a physical device to a project via its device_id / MQTT topic (FR7)
5. Live Data: latest reading cards (irradiance proxy, ambient temp, humidity,
   tilt, heading) + auto-refreshing charts (FR1, FR2)
6. History: date-range picker, charts, raw data export to CSV (FR8)
7. TNB Bill: PDF upload, show extracted monthly consumption + tariff category (FR4)
8. Benchmark: device vs satellite (PVGIS / Solcast / Solargis) comparison
   chart and table (NFR6)
9. Site visit checklist: configurable items, tick/untick, add/remove (FR6)
10. Feasibility report: generate and download as PDF/Excel (FR5)

## Conventions
- Small focused components, no `any`, handle API errors with user-readable messages.
- Responsive layout (installers may use tablets onsite).
- Commit after each completed page/feature with a clear message.
- Update the "Status" section below after each phase.

## Status
- Phase 1 done: Tailwind v4, strict TS, axios client with single-flight
  refresh (Web Lock across tabs), in-memory session store, protected/guest
  routes, login / register / accept-invite / logout, app layout.
- Regenerate API types with `npm run gen:api` (runs openapi-typescript with
  its own TS 5, since it doesn't support the project's TS 6).
- Live polling uses 5 s (`LIVE_POLL_INTERVAL_MS` in src/config.ts); docs/FRONTEND.md
  suggests 30-60 s, but each poll only fetches the newest 50 readings and merges.
- Phase 2 done: projects list + create (admin), project page with sites,
  device pairing (= create site with device_id, admin), site page shell with
  tabs at /sites/:siteId, team page (roles, deactivate, invite links).
  Project/site edit and delete are NOT built: no backend endpoints.
- Phase 3 done: Live Data tab (latest cards, polled charts, stale-device
  warning) and History tab (date range, bucketed charts, CSV/Excel export).
  History pages through /readings (no date filter in API), capped at 20k
  readings with a warning. Gaps in data break chart lines.
- Phase 4 done: TNB Bill tab (multi-PDF upload, parsed fields with
  "couldn't read" for nulls, avg kWh, tariff, monthly kWh chart, view PDF).
  No bill delete: no backend endpoint.
- Phase 5 done: Benchmark tab (month picker, ratio headline with shading
  guide, device vs satellite chart + full table, opt-in 12-month view that
  makes 12 requests). Satellite is PVGIS only; Solcast/Solargis not in API.
  Ratio bands (>=0.9 good, >=0.7 some shading) are a frontend guide only.
- Phase 6 done: Checklist tab (visits list with progress, start visit with
  default/empty checklist), visit page (items by category, OK/Issue/N/A
  with tap-again-to-untick, value + notes saved on blur, add/remove items,
  complete/reopen, delete visit). Item updates are optimistic.
- Phase 7 done: Report tab (assumptions form validated against the API
  ranges, headline figures, shading source note, bill before/after chart,
  monthly table, disclaimer). PDF built client-side with @react-pdf/renderer
  (lazy-loaded chunk), Excel from /feasibility/xlsx.
- Phase 8 done: lazy-loaded routes (main chunk 262 kB), route error page,
  page titles, site overview summaries, nav highlight on site pages,
  session kept on network errors during refresh, README.
- Phase 9 done: device pairing per docs/FRONTEND.md. Admins pair, change or
  unpair a site's device from the site page (DeviceDialog: picks from
  GET /devices/unpaired by sticker code, PUT/DELETE /sites/:id/device).
  "Add a site" no longer asks for a device ID. Live/History use roll, pitch
  and tilt_deg instead of tilt_x/y/z.
- Phase 10 done: admin-only Device settings panel on the site Overview tab
  (GET/PUT /devices/{id}/config: online/fw/last seen, publish interval,
  Pending/Applied, polls every 3 s only while pending). Readings sensor
  fields (ambient_temp, humidity, roll, pitch, heading, tilt_deg) can be null:
  shown as "—", skipped in chart averages (gaps, not zero).
- Phase 11 done: Survey tab (record spots with phone GPS + 120 s dwell,
  per-spot 0-100 score, ranked list, Leaflet map, drift re-check, editable
  weights). Spots live in localStorage until the backend adds endpoints:
  see docs/BACKEND_SURVEY_SPEC.md. Mobile pass: 16px inputs (no iOS zoom),
  44px+ touch targets, full-width checklist status buttons, dvh modals.
  Dev proxy in vite.config.ts (VITE_API_URL=/api) for phone/tunnel use.
- Not yet verified in a browser or against the real backend.