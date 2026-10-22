# SolarSense Frontend

Dashboard for SolarSense, an ESP32-based device for hyperlocal solar site
assessment, used by Malaysian solar installers. Backend:
[solarsense-backend](../solarsense-backend) (FastAPI).

## Setup

Use the WSL (nvm) Node, not the Windows one.

```bash
npm install
cp .env.example .env.local   # set VITE_API_URL if not http://localhost:8000
npm run dev                  # http://localhost:5173
```

The backend must allow the dev origin with credentials: add
`http://localhost:5173` to its `BACKEND_CORS_ORIGINS`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build |
| `npm run lint` | ESLint |
| `npm run gen:api` | Regenerate `src/api/schema.d.ts` from `docs/openapi.json` |

## Structure

```
src/
  api/          axios client (auth + refresh), typed functions per resource
  auth/         in-memory session store, role helpers
  hooks/        TanStack Query hooks
  components/   UI pieces, charts, layout
  pages/        auth, projects, sites (tabs), team
  routes/       router (lazy-loaded pages), ProtectedRoute, GuestRoute
```

## Pages

- Login, register (creates a company + admin), accept invite, logout
- Projects list and create (admins), project page with its sites
- Device pairing: create a site with the ESP32's `device_id` (admins)
- Site tabs: Overview, Live Data (polls every 30 s), History (date range,
  CSV/Excel export), TNB Bill (PDF upload), Benchmark (device vs PVGIS),
  Checklist (site visits), Report (feasibility, PDF/Excel)
- Team: roles, deactivate, invite links (admins)

## Known backend gaps

See `docs/FRONTEND.md`. Not built because the API has no endpoint:
editing or deleting projects, sites and bills; re-pairing a device; date
filters or aggregation on readings (History pages through raw readings,
capped at 20,000); Solcast/Solargis benchmarks (PVGIS only).
