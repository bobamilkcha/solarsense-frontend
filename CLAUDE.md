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
- Scaffold created (Vite react-ts). Nothing else built yet.