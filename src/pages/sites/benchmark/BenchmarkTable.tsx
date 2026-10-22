import type { Benchmark } from '../../../api/types'
import { formatNumber } from '../../../lib/format'

function Row({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <tr>
      <th scope="row" className="px-4 py-2.5 text-left font-normal text-slate-600">
        {label}
      </th>
      <td className="px-4 py-2.5 text-right font-medium text-slate-900 tabular-nums">
        {value}
        {unit && value !== '—' && <span className="ml-1 text-xs font-normal text-slate-500">{unit}</span>}
      </td>
    </tr>
  )
}

export function BenchmarkTable({ benchmark: b }: { benchmark: Benchmark }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full text-sm">
        <caption className="bg-slate-50 px-4 py-2 text-left text-xs font-medium text-slate-500">All figures</caption>
        <tbody className="divide-y divide-slate-100">
          <Row label="Device: average daily irradiation" value={formatNumber(b.device_avg_daily_irradiation_kwh_m2, 2)} unit="kWh/m²/day" />
          <Row label="Satellite: average daily irradiation" value={formatNumber(b.satellite_avg_daily_irradiation_kwh_m2, 2)} unit="kWh/m²/day" />
          <Row label="Satellite: monthly irradiation" value={formatNumber(b.satellite_avg_monthly_irradiation_kwh_m2, 1)} unit="kWh/m²" />
          <Row label="Device-to-satellite ratio" value={formatNumber(b.device_to_satellite_ratio, 2)} />
          <Row label="Device: average irradiance" value={formatNumber(b.device_avg_irradiance_wm2, 0)} unit="W/m²" />
          <Row label="Device: complete days" value={String(b.device_complete_days)} />
          <Row label="Device: readings this month" value={b.device_reading_count.toLocaleString()} />
          <Row label="Device: average cell voltage" value={formatNumber(b.device_avg_cell_voltage, 3)} unit="V" />
          <Row label="Device: average cell current" value={formatNumber(b.device_avg_cell_current, 4)} unit="A" />
          <Row label="Reference cell Isc" value={formatNumber(b.reference_cell_isc_a, 4)} unit="A" />
          <Row label="Satellite source" value={b.satellite_source} />
        </tbody>
      </table>
    </div>
  )
}
