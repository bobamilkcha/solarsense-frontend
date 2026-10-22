export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-slate-900" />
      <circle cx="16" cy="16" r="5.5" className="fill-amber-400" />
      <g className="stroke-amber-400" strokeWidth="2" strokeLinecap="round">
        <path d="M16 5v3M16 24v3M5 16h3M24 16h3M8.2 8.2l2.1 2.1M21.7 21.7l2.1 2.1M8.2 23.8l2.1-2.1M21.7 10.3l2.1-2.1" />
      </g>
    </svg>
  )
}
