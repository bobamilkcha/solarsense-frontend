import type { SensorReading } from '../api/types'
import { formatDateTime, formatNumber } from '../lib/format'

/** Plain table view of readings (newest first): the accessible alternative to the charts. */
export function ReadingsTable({ readings, maxRows = 100 }: { readings: SensorReading[]; maxRows?: number }) {
  const rows = [...readings].sort((a, b) => Date.parse(b.device_timestamp) - Date.parse(a.device_timestamp)).slice(0, maxRows)
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full text-right text-sm tabular-nums">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Device time</th>
            <th scope="col" className="px-3 py-2 font-medium">Irradiance (W/m²)</th>
            <th scope="col" className="px-3 py-2 font-medium">Temp (°C)</th>
            <th scope="col" className="px-3 py-2 font-medium">Humidity (%)</th>
            <th scope="col" className="px-3 py-2 font-medium">Tilt x / y / z</th>
            <th scope="col" className="px-3 py-2 font-medium">Heading (°)</th>
            <th scope="col" className="px-3 py-2 font-medium">Voltage (V)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2 text-left whitespace-nowrap text-slate-700">{formatDateTime(r.device_timestamp)}</td>
              <td className="px-3 py-2">{formatNumber(r.irradiance_wm2, 0)}</td>
              <td className="px-3 py-2">{formatNumber(r.ambient_temp)}</td>
              <td className="px-3 py-2">{formatNumber(r.humidity)}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {formatNumber(r.tilt_x, 2)} / {formatNumber(r.tilt_y, 2)} / {formatNumber(r.tilt_z, 2)}
              </td>
              <td className="px-3 py-2">{formatNumber(r.heading, 0)}</td>
              <td className="px-3 py-2">{formatNumber(r.cell_voltage, 3)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {readings.length > maxRows && (
        <p className="border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-500">
          Showing the newest {maxRows} of {readings.length.toLocaleString()} readings. Export for the full data.
        </p>
      )}
    </div>
  )
}
