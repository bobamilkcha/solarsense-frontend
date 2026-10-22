import { useState } from 'react'
import { saveBlob } from '../../../api/download'
import { getErrorMessage } from '../../../api/errors'
import { downloadFeasibilityXlsx, type FeasibilityParams } from '../../../api/feasibility'
import type { FeasibilityReport } from '../../../api/types'
import { Button } from '../../../components/ui/Button'
import { toLocalDateString } from '../../../lib/dates'

type Props = { report: FeasibilityReport; params: FeasibilityParams; projectName: string | null }

export function ReportDownloads({ report, params, projectName }: Props) {
  const [busy, setBusy] = useState<'pdf' | 'xlsx' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const safeName = report.site_name.replace(/[^a-z0-9-_]+/gi, '_')

  async function run(kind: 'pdf' | 'xlsx') {
    setBusy(kind)
    setError(null)
    try {
      if (kind === 'xlsx') {
        await downloadFeasibilityXlsx(report.site_id, params, report.site_name)
      } else {
        // Loaded on demand: the PDF renderer is large.
        const { renderFeasibilityPdf } = await import('./renderFeasibilityPdf')
        const generatedAt = new Date()
        const blob = await renderFeasibilityPdf(report, { projectName, generatedAt })
        saveBlob(blob, `${safeName}_feasibility_${toLocalDateString(generatedAt)}.pdf`)
      }
    } catch (e) {
      setError(getErrorMessage(e, kind === 'pdf' ? "Couldn't create the PDF." : "Couldn't download the Excel file."))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1 sm:items-end">
      <div className="flex gap-2">
        <Button loading={busy === 'pdf'} disabled={busy !== null} onClick={() => run('pdf')}>
          Download PDF
        </Button>
        <Button variant="secondary" loading={busy === 'xlsx'} disabled={busy !== null} onClick={() => run('xlsx')}>
          Download Excel
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
