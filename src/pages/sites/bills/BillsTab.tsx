import { useMemo, useState } from 'react'
import { fetchBillFile } from '../../../api/bills'
import { getErrorMessage } from '../../../api/errors'
import type { TNBBill } from '../../../api/types'
import { ChartCard } from '../../../components/charts/ChartCard'
import { CategoryBarChart } from '../../../components/charts/CategoryBarChart'
import { StatTile } from '../../../components/StatTile'
import { Button } from '../../../components/ui/Button'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { useBills } from '../../../hooks/useBills'
import { formatDate, formatNumber, formatRM } from '../../../lib/format'
import { useSiteContext } from '../siteContext'
import { BillUpload } from './BillUpload'
import { billMonthLabel } from './billFields'

function Unread() {
  return <span className="text-xs text-amber-700 italic">Couldn’t read</span>
}

function orUnread<T>(value: T | null, render: (v: T) => string) {
  return value === null ? <Unread /> : render(value)
}

function periodSortKey(bill: TNBBill): string {
  return bill.billing_period_end ?? bill.billing_period_start ?? bill.created_at
}

function ViewPdfButton({ bill }: { bill: TNBBill }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function open() {
    // Open the tab synchronously so popup blockers allow it, then point it at the PDF.
    const tab = window.open('', '_blank')
    setLoading(true)
    setError(null)
    try {
      const blob = await fetchBillFile(bill.id)
      const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      if (tab) tab.location.href = url
      else window.location.assign(url)
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) {
      tab?.close()
      setError(getErrorMessage(e, "Couldn't open the PDF."))
    } finally {
      setLoading(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <Button variant="ghost" size="sm" loading={loading} onClick={open}>
        View PDF
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  )
}

function BillsTable({ bills }: { bills: TNBBill[] }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500">
          <tr className="text-left">
            <th scope="col" className="px-4 py-2 font-medium">Billing period</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Usage (kWh)</th>
            <th scope="col" className="px-4 py-2 font-medium">Tariff</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Current charges</th>
            <th scope="col" className="px-4 py-2 text-right font-medium">Amount due</th>
            <th scope="col" className="px-4 py-2 font-medium">File</th>
            <th scope="col" className="px-4 py-2"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bills.map((bill) => (
            <tr key={bill.id} className="align-top">
              <td className="px-4 py-3 whitespace-nowrap">
                {bill.billing_period_start || bill.billing_period_end ? (
                  `${formatDate(bill.billing_period_start)} – ${formatDate(bill.billing_period_end)}`
                ) : (
                  <Unread />
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{orUnread(bill.kwh_used, (v) => formatNumber(v, 0))}</td>
              <td className="px-4 py-3">{orUnread(bill.tariff_category, (v) => v)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{orUnread(bill.current_charges, (v) => formatRM(v))}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">{orUnread(bill.amount_due, (v) => formatRM(v))}</td>
              <td className="max-w-[12rem] truncate px-4 py-3 text-xs text-slate-500" title={bill.filename}>
                {bill.filename}
                <div>Uploaded {formatDate(bill.created_at)}</div>
              </td>
              <td className="px-2 py-1 text-right">
                <ViewPdfButton bill={bill} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function BillsTab() {
  const { site } = useSiteContext()
  const bills = useBills(site.id)

  const sorted = useMemo(
    () => [...(bills.data ?? [])].sort((a, b) => periodSortKey(b).localeCompare(periodSortKey(a))),
    [bills.data],
  )
  const withKwh = sorted.filter((b) => b.kwh_used !== null)
  const avgKwh = withKwh.length ? withKwh.reduce((sum, b) => sum + (b.kwh_used ?? 0), 0) / withKwh.length : null
  const latestTariff = sorted.find((b) => b.tariff_category !== null)?.tariff_category ?? null
  const chartData = [...withKwh]
    .reverse()
    .map((b) => ({ category: billMonthLabel(b) ?? formatDate(b.created_at), kwh: b.kwh_used }))

  return (
    <div className="space-y-6">
      <BillUpload siteId={site.id} />

      {bills.isPending ? (
        <LoadingState label="Loading bills…" />
      ) : bills.isError ? (
        <ErrorState error={bills.error} title="Couldn't load bills" onRetry={() => bills.refetch()} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No bills uploaded"
          description="Upload the customer’s TNB bills to see their monthly consumption and to generate the feasibility report."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatTile label="Bills uploaded" value={sorted.length} />
            <StatTile
              label="Average monthly usage"
              value={formatNumber(avgKwh, 0)}
              unit="kWh"
              detail={withKwh.length < sorted.length ? `From ${withKwh.length} bills with readable usage` : undefined}
            />
            <StatTile label="Tariff category" value={latestTariff ?? '—'} detail={latestTariff ? 'From the latest bill' : 'Couldn’t read from bills'} />
          </div>

          {chartData.length > 0 && (
            <ChartCard title="Monthly consumption (kWh)" subtitle="By billing period">
              <CategoryBarChart data={chartData} series={[{ key: 'kwh', label: 'Usage' }]} formatValue={(v) => `${formatNumber(v, 0)} kWh`} />
            </ChartCard>
          )}

          <BillsTable bills={sorted} />
        </>
      )}
    </div>
  )
}
