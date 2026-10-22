import type { Visit } from '../../../api/types'

/** Stacked progress: ok / issue / n/a, pending left as the track. */
export function ProgressBar({ progress }: { progress: Visit['progress'] }) {
  const { total, ok, issue, not_applicable, pending } = progress
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : '0%')
  const done = total - pending
  return (
    <div>
      <div
        className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label={`${done} of ${total} items checked`}
      >
        {ok > 0 && <div className="bg-emerald-500" style={{ width: pct(ok) }} />}
        {issue > 0 && <div className="bg-red-500" style={{ width: pct(issue) }} />}
        {not_applicable > 0 && <div className="bg-slate-400" style={{ width: pct(not_applicable) }} />}
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {done}/{total} checked · {ok} OK · {issue} {issue === 1 ? 'issue' : 'issues'} · {not_applicable} N/A
      </p>
    </div>
  )
}
