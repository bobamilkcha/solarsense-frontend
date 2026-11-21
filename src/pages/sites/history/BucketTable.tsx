import type { ReadingBucket } from '../../../api/types'
import { formatDateTime, formatNumber } from '../../../lib/format'

const MAX_ROWS = 200

/** Table view of the bucketed history (newest first): the accessible alternative to the charts. */
export function BucketTable({ buckets }: { buckets: ReadingBucket[] }) {
  const rows = [...buckets].reverse().slice(0, MAX_ROWS)
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full text-right text-sm tabular-nums">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Period start</th>
            <th scope="col" className="px-3 py-2 font-medium">Readings</th>
            <th scope="col" className="px-3 py-2 font-medium">Irradiance avg (W/m²)</th>
            <th scope="col" className="px-3 py-2 font-medium">Irradiance peak (W/m²)</th>
            <th scope="col" className="px-3 py-2 font-medium">Air temp avg (°C)</th>
            <th scope="col" className="px-3 py-2 font-medium">Humidity avg (%)</th>
            <th scope="col" className="px-3 py-2 font-medium">Tilt avg (°)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((b) => (
            <tr key={b.bucket_start}>
              <td className="px-3 py-2 text-left whitespace-nowrap text-slate-700">{formatDateTime(b.bucket_start)}</td>
              <td className="px-3 py-2">{b.count.toLocaleString()}</td>
              <td className="px-3 py-2">{formatNumber(b.irradiance_avg_wm2, 0)}</td>
              <td className="px-3 py-2">{formatNumber(b.irradiance_max_wm2, 0)}</td>
              <td className="px-3 py-2">{formatNumber(b.ambient_temp_avg)}</td>
              <td className="px-3 py-2">{formatNumber(b.humidity_avg, 0)}</td>
              <td className="px-3 py-2">{formatNumber(b.tilt_deg_avg, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {buckets.length > MAX_ROWS && (
        <p className="border-t border-slate-100 px-3 py-2 text-left text-xs text-slate-500">
          Showing the newest {MAX_ROWS} of {buckets.length.toLocaleString()} periods. Export for every reading.
        </p>
      )}
    </div>
  )
}
