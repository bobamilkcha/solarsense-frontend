import type { FeasibilityReport } from '../../../api/types'
import { ChartCard } from '../../../components/charts/ChartCard'
import { CategoryBarChart } from '../../../components/charts/CategoryBarChart'
import { StatTile } from '../../../components/StatTile'
import { Alert } from '../../../components/ui/Alert'
import { formatNumber, formatRM } from '../../../lib/format'
import { MONTH_NAMES } from '../../../lib/months'
import { DISCLAIMER, exportCreditLabel, shadingSourceLabel } from './reportCopy'

function ShadingNote({ shading }: { shading: FeasibilityReport['shading'] }) {
  if (shading.source === 'device') {
    return (
      <Alert tone="info">
        Shading measured on site: device got {formatNumber(shading.measured_ratio, 2)}× the expected sunlight over{' '}
        {shading.complete_days} complete {shading.complete_days === 1 ? 'day' : 'days'}. Production is adjusted by a
        factor of {formatNumber(shading.applied_factor, 2)}.
      </Alert>
    )
  }
  return (
    <Alert tone="warning">
      {shadingSourceLabel(shading.source)}: the device hasn’t recorded a complete day yet, so production assumes no
      shading. Leave the device running for a more accurate estimate.
    </Alert>
  )
}

function MonthlyTable({ months }: { months: FeasibilityReport['months'] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full text-right text-sm tabular-nums">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">Month</th>
            <th scope="col" className="px-3 py-2 font-medium">Production (kWh)</th>
            <th scope="col" className="px-3 py-2 font-medium">Used on site (kWh)</th>
            <th scope="col" className="px-3 py-2 font-medium">Exported (kWh)</th>
            <th scope="col" className="px-3 py-2 font-medium">Bill now</th>
            <th scope="col" className="px-3 py-2 font-medium">Bill with solar</th>
            <th scope="col" className="px-3 py-2 font-medium">Savings</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {months.map((m) => (
            <tr key={m.month}>
              <th scope="row" className="px-3 py-2 text-left font-normal text-slate-700">{MONTH_NAMES[m.month - 1]}</th>
              <td className="px-3 py-2">{formatNumber(m.production_kwh, 0)}</td>
              <td className="px-3 py-2">{formatNumber(m.self_consumed_kwh, 0)}</td>
              <td className="px-3 py-2">{formatNumber(m.exported_kwh, 0)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatRM(m.bill_before_rm)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{formatRM(m.bill_after_rm)}</td>
              <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-900">{formatRM(m.savings_rm)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ReportView({ report: r }: { report: FeasibilityReport }) {
  const chartData = r.months.map((m) => ({
    category: MONTH_NAMES[m.month - 1],
    before: m.bill_before_rm,
    after: m.bill_after_rm,
  }))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Recommended system"
          value={formatNumber(r.system_kwp, 2)}
          unit="kWp"
          detail={`${r.panel_count} panels × ${formatNumber(r.assumptions.panel_wp, 0)} W`}
        />
        <StatTile label="System cost" value={formatRM(r.system_cost_rm, 0)} />
        <StatTile label="Annual savings" value={formatRM(r.annual_savings_rm, 0)} detail={exportCreditLabel(r.export_credit)} />
        <StatTile
          label="Payback"
          value={r.payback_years === null ? 'No payback' : formatNumber(r.payback_years, 1)}
          unit={r.payback_years === null ? undefined : 'years'}
          detail={r.payback_years === null ? 'Savings don’t cover the cost' : undefined}
        />
        <StatTile label="Monthly bill now" value={formatRM(r.avg_monthly_bill_before_rm, 0)} detail="Average" />
        <StatTile label="Monthly bill with solar" value={formatRM(r.avg_monthly_bill_after_rm, 0)} detail="Average" />
        <StatTile label="Solar coverage" value={formatNumber(r.solar_coverage_pct, 0)} unit="%" detail="of yearly usage" />
        <StatTile label={`Net savings, ${r.lifetime_years} years`} value={formatRM(r.lifetime_net_savings_rm, 0)} />
      </div>

      <ShadingNote shading={r.shading} />

      <ChartCard title="Monthly electricity bill (RM)" subtitle="Current bill compared with the estimated bill after solar">
        <CategoryBarChart
          data={chartData}
          series={[
            { key: 'before', label: 'Bill now' },
            { key: 'after', label: 'Bill with solar' },
          ]}
          formatValue={(v) => formatRM(v)}
          height={280}
        />
      </ChartCard>

      <MonthlyTable months={r.months} />

      <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
        <p>
          <span className="block text-xs text-slate-500">Annual production</span>
          {formatNumber(r.annual_production_kwh, 0)} kWh
        </p>
        <p>
          <span className="block text-xs text-slate-500">Annual consumption</span>
          {formatNumber(r.annual_consumption_kwh, 0)} kWh from {r.consumption.bills_used}{' '}
          {r.consumption.bills_used === 1 ? 'bill' : 'bills'}
        </p>
        <p>
          <span className="block text-xs text-slate-500">Tariff</span>
          {r.consumption.tariff_category ?? r.consumption.tariff_model}
          {r.consumption.effective_rate_rm_per_kwh !== null &&
            ` · RM ${formatNumber(r.consumption.effective_rate_rm_per_kwh, 3)}/kWh effective`}
        </p>
      </div>

      <p className="rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900 ring-1 ring-amber-200">{DISCLAIMER}</p>
    </div>
  )
}
