# Backend spec: site survey spots

Status: **proposal, not in `openapi.json`.** The frontend Survey tab currently
stores spots in the browser (`localStorage`, see `src/api/surveys.ts`). That is
per-device and lost if the browser data is cleared, so it is only a stand-in.
When these endpoints exist, only `src/api/surveys.ts` needs to change.

## What it is for

An installer walks a site with the SolarSense device and a phone. At each
candidate spot they tap "Record spot". The phone supplies GPS; the app then
waits a fixed time window (currently 120 s) while the device keeps publishing.
The spot's score comes from the device's readings inside that window. Readings
have no position of their own, so a *spot* is the link between a place and a
time window.

## Resource: `SurveySpot`

| Field         | Type                | Notes |
|---------------|---------------------|-------|
| `id`          | uuid                | server generated |
| `site_id`     | uuid                | the site being surveyed |
| `label`       | string, 1-100       | e.g. "Spot 3" or "North roof edge" |
| `lat`         | number, -90..90     | from the phone |
| `lng`         | number, -180..180   | from the phone |
| `accuracy_m`  | number or null, >=0 | GPS accuracy radius reported by the phone |
| `started_at`  | datetime (UTC)      | start of the measurement window |
| `ended_at`    | datetime (UTC)      | end of the window; must be after `started_at`, max 15 min apart |
| `control_for` | uuid or null        | if set, this spot is a re-measurement of that spot (drift check) and must belong to the same site |
| `created_at`  | datetime (UTC)      | server generated |

`ended_at` may be in the future when the spot is created (the app creates it
when the countdown starts, so a reload does not lose it).

## Endpoints

All require auth and are scoped to the caller's company, like `/sites/*`.
**Any role** (installer, company admin, super admin) can use them: installers
are the ones walking the site.

- `GET /sites/{site_id}/survey-spots` -> `SurveySpot[]`, oldest first.
- `POST /sites/{site_id}/survey-spots` -> `201 SurveySpot`.
  Body: `label`, `lat`, `lng`, `accuracy_m?`, `started_at`, `ended_at`,
  `control_for?`.
  - 404 if the site is not in the caller's company.
  - 422 on out-of-range values, `ended_at <= started_at`, a window over 15 min,
    or `control_for` pointing at a spot of another site.
- `DELETE /survey-spots/{spot_id}` -> `204`. Deleting a spot also deletes the
  controls that point at it. 404 if not in the caller's company.
- Optional: `PATCH /survey-spots/{spot_id}` with `label` only.

## Optional: server-computed stats

The frontend computes statistics from `GET /sites/{id}/readings`, which only
returns the newest readings (no date filter), so old spots can fall outside
what it can fetch. If the backend added `stats` to each spot, that limit goes
away:

```json
"stats": {
  "count": 5,
  "irradiance_wm2": { "median": 612.3, "cv": 0.04 },
  "ambient_temp": 31.2,
  "humidity": 71.0,
  "tilt_deg": 9.8,
  "heading": 184.0
}
```

- All values are medians of the readings with `device_timestamp` in
  `[started_at, ended_at]`.
- `cv` = standard deviation / mean of irradiance in the window (null if under
  3 readings). The frontend flags spots with `cv > 0.15` as unstable sky.
- Skip null sensor values per field (a failed sensor is missing data, not 0);
  a field with no values is `null`.
- `heading` should be a circular median/mean (350 deg and 10 deg average to 0, not 180).

If the backend does this, please also expose a `date range` filter on
`GET /sites/{id}/readings` (`start`, `end`), which History would benefit from too.

## Known caveat: clocks

The window is chosen with the phone's clock; readings carry the device's
`device_timestamp`. If the device clock is off by more than a few seconds the
window will miss readings. Server-side, `started_at`/`ended_at` should be
compared against `device_timestamp` as is, and the frontend will warn when no
readings fall in the window.
