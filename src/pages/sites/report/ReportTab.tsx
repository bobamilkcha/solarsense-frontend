import { useState } from 'react'
import { Link } from 'react-router'
import { getErrorMessage, getErrorStatus } from '../../../api/errors'
import type { FeasibilityParams } from '../../../api/feasibility'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States'
import { useFeasibility } from '../../../hooks/useFeasibility'
import { useSiteContext } from '../siteContext'
import { AssumptionsPanel } from './AssumptionsPanel'
import { DEFAULT_FORM, parseAssumptions } from './assumptions'
import { ReportDownloads } from './ReportDownloads'
import { ReportView } from './ReportView'

const DEFAULT_PARAMS: FeasibilityParams = parseAssumptions(DEFAULT_FORM).params ?? {}

export function ReportTab() {
  const { site, project } = useSiteContext()
  const [params, setParams] = useState<FeasibilityParams>(DEFAULT_PARAMS)
  const report = useFeasibility(site.id, params)
  const status = getErrorStatus(report.error)

  let body
  if (report.isPending) {
    body = <LoadingState label="Calculating feasibility…" />
  } else if (report.isError && status === 422) {
    body = (
      <EmptyState
        title="Not enough data for a report yet"
        description={
          <>
            {getErrorMessage(report.error)} The report needs at least one TNB bill with readable kWh usage.
          </>
        }
        action={
          <Link to="../bills" relative="path" className="text-sm font-medium text-amber-700 hover:text-amber-600">
            Upload TNB bills →
          </Link>
        }
      />
    )
  } else if (report.isError) {
    body = (
      <ErrorState
        error={report.error}
        title={status === 502 ? 'Satellite data unavailable' : "Couldn't calculate the report"}
        onRetry={() => report.refetch()}
      />
    )
  } else {
    body = (
      <div className={report.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold">Feasibility for {report.data.site_name}</h2>
          <ReportDownloads report={report.data} params={params} projectName={project?.name ?? null} />
        </div>
        <ReportView report={report.data} />
      </div>
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[18rem_1fr] lg:items-start">
      <div className="lg:sticky lg:top-4">
        <AssumptionsPanel onApply={setParams} busy={report.isFetching} />
      </div>
      <div className="min-w-0">{body}</div>
    </div>
  )
}
