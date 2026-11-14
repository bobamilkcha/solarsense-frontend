import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { FeasibilityReport } from '../../../api/types'
import { formatDateTime, formatNumber, formatRM } from '../../../lib/format'
import { MONTH_NAMES } from '../../../lib/months'
import { DISCLAIMER, exportCreditLabel, shadingSourceLabel } from './reportCopy'

// Built-in Helvetica covers the WinAnsi range only, so the copy sticks to plain characters.
const s = StyleSheet.create({
  page: { padding: 36, fontSize: 9, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { borderBottomWidth: 2, borderBottomColor: '#f59e0b', paddingBottom: 8, marginBottom: 14 },
  brand: { fontSize: 9, color: '#b45309', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginTop: 2 },
  meta: { fontSize: 8, color: '#64748b', marginTop: 3 },
  h2: { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 14, marginBottom: 6 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  tile: { width: '25%', padding: 4 },
  tileInner: { backgroundColor: '#f8fafc', borderRadius: 4, padding: 8, minHeight: 46 },
  tileLabel: { fontSize: 7, color: '#64748b' },
  tileValue: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginTop: 3 },
  tileSub: { fontSize: 7, color: '#64748b', marginTop: 1 },
  table: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 3 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  cell: { flex: 1, paddingVertical: 4, paddingHorizontal: 5, textAlign: 'right' },
  cellFirst: { flex: 1, paddingVertical: 4, paddingHorizontal: 5, textAlign: 'left' },
  headCell: { color: '#64748b', fontFamily: 'Helvetica-Bold', fontSize: 7.5 },
  kv: { flexDirection: 'row', paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  kvKey: { flex: 2, color: '#475569' },
  kvVal: { flex: 1, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  columns: { flexDirection: 'row', gap: 16 },
  column: { flex: 1 },
  disclaimer: { marginTop: 16, padding: 8, backgroundColor: '#fffbeb', borderRadius: 4, fontSize: 8, color: '#78350f' },
  footer: { position: 'absolute', bottom: 20, left: 36, right: 36, fontSize: 7, color: '#94a3b8', flexDirection: 'row', justifyContent: 'space-between' },
})

const money = (v: number) => v.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={s.tile}>
      <View style={s.tileInner}>
        <Text style={s.tileLabel}>{label}</Text>
        <Text style={s.tileValue}>{value}</Text>
        {sub ? <Text style={s.tileSub}>{sub}</Text> : null}
      </View>
    </View>
  )
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.kv}>
      <Text style={s.kvKey}>{k}</Text>
      <Text style={s.kvVal}>{v}</Text>
    </View>
  )
}

export type PdfMeta = { projectName: string | null; generatedAt: Date }

export function FeasibilityDocument({ report: r, meta }: { report: FeasibilityReport; meta: PdfMeta }) {
  const a = r.assumptions
  const pct = (v: number) => `${formatNumber(v * 100, 0)}%`
  return (
    <Document title={`Solar feasibility - ${r.site_name}`} author="SolarSense">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.brand}>SOLARSENSE</Text>
          <Text style={s.title}>Solar feasibility report</Text>
          <Text style={s.meta}>
            {meta.projectName ? `${meta.projectName} - ` : ''}
            {r.site_name} - {r.location_lat.toFixed(5)}, {r.location_lng.toFixed(5)}
          </Text>
          <Text style={s.meta}>Generated {formatDateTime(meta.generatedAt)} (Malaysia time)</Text>
        </View>

        <View style={s.tiles}>
          <Tile label="Recommended system" value={`${formatNumber(r.system_kwp, 2)} kWp`} sub={`${r.panel_count} panels x ${formatNumber(a.panel_wp, 0)} W`} />
          <Tile label="Estimated system cost" value={formatRM(r.system_cost_rm, 0)} />
          <Tile label="Annual savings" value={formatRM(r.annual_savings_rm, 0)} />
          <Tile label="Payback period" value={r.payback_years === null ? 'No payback' : `${formatNumber(r.payback_years, 1)} years`} />
          <Tile label="Avg monthly bill, now" value={formatRM(r.avg_monthly_bill_before_rm, 0)} />
          <Tile label="Avg monthly bill, with solar" value={formatRM(r.avg_monthly_bill_after_rm, 0)} />
          <Tile label="Solar coverage" value={`${formatNumber(r.solar_coverage_pct, 0)}%`} sub="of yearly usage" />
          <Tile label={`Net savings over ${r.lifetime_years} years`} value={formatRM(r.lifetime_net_savings_rm, 0)} />
        </View>

        <Text style={s.h2}>Monthly breakdown</Text>
        <View style={s.table}>
          <View style={s.headRow}>
            {['Month', 'Production (kWh)', 'Used on site (kWh)', 'Exported (kWh)', 'Bill now (RM)', 'Bill with solar (RM)', 'Savings (RM)'].map((h, i) => (
              <Text key={h} style={[i === 0 ? s.cellFirst : s.cell, s.headCell]}>{h}</Text>
            ))}
          </View>
          {r.months.map((m) => (
            <View key={m.month} style={s.row} wrap={false}>
              <Text style={s.cellFirst}>{MONTH_NAMES[m.month - 1]}</Text>
              <Text style={s.cell}>{formatNumber(m.production_kwh, 0)}</Text>
              <Text style={s.cell}>{formatNumber(m.self_consumed_kwh, 0)}</Text>
              <Text style={s.cell}>{formatNumber(m.exported_kwh, 0)}</Text>
              <Text style={s.cell}>{money(m.bill_before_rm)}</Text>
              <Text style={s.cell}>{money(m.bill_after_rm)}</Text>
              <Text style={s.cell}>{money(m.savings_rm)}</Text>
            </View>
          ))}
        </View>

        <View style={s.columns}>
          <View style={s.column}>
            <Text style={s.h2}>Energy and site</Text>
            <KV k="Annual production" v={`${formatNumber(r.annual_production_kwh, 0)} kWh`} />
            <KV k="Annual consumption" v={`${formatNumber(r.annual_consumption_kwh, 0)} kWh`} />
            <KV k="Annual irradiation" v={`${formatNumber(r.annual_irradiation_kwh_m2, 0)} kWh/m2`} />
            <KV k="Shading data" v={shadingSourceLabel(r.shading.source)} />
            <KV k="Measured sunlight ratio" v={r.shading.measured_ratio === null ? 'n/a' : formatNumber(r.shading.measured_ratio, 2)} />
            <KV k="Shading factor applied" v={formatNumber(r.shading.applied_factor, 2)} />
            <KV k="Complete days measured" v={String(r.shading.complete_days)} />
          </View>
          <View style={s.column}>
            <Text style={s.h2}>Bills and assumptions</Text>
            <KV k="Bills used" v={String(r.consumption.bills_used)} />
            <KV k="Avg monthly usage" v={`${formatNumber(r.consumption.avg_monthly_kwh, 0)} kWh`} />
            <KV k="Tariff" v={r.consumption.tariff_category ?? r.consumption.tariff_model} />
            <KV k="Installed cost" v={`${formatRM(a.cost_per_kwp_rm, 0)} per kWp`} />
            <KV k="Self-consumption" v={pct(a.self_consumption_ratio)} />
            <KV k="Performance ratio" v={pct(a.performance_ratio)} />
            <KV k="Export credit" v={exportCreditLabel(r.export_credit)} />
            <KV k="AFA rate" v={`RM ${formatNumber(a.afa_rate_rm_per_kwh, 3)}/kWh`} />
          </View>
        </View>

        <Text style={s.disclaimer}>{DISCLAIMER}</Text>

        <View style={s.footer} fixed>
          <Text>SolarSense feasibility report - {r.site_name}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}
