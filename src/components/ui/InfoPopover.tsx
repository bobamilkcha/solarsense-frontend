import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/**
 * An (i) button that shows an explanation. Hover previews it on desktop; click
 * or tap pins it open (tablets and phones have no hover). Closes on a second
 * click, Escape or a click outside.
 */
export function InfoPopover({ title, children }: { title: string; children: ReactNode }) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const open = hovered || pinned
  const rootRef = useRef<HTMLDivElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!pinned) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPinned(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setPinned(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [pinned])

  return (
    <div
      ref={rootRef}
      className="relative"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHovered(false)}
    >
      <button
        type="button"
        aria-label={`About ${title}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setPinned((p) => !p)
          setHovered(false)
        }}
        className={`flex size-11 items-center justify-center rounded-full sm:size-8 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none ${
          pinned ? 'bg-amber-100 text-amber-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
        }`}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-5">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.25v3.25a.75.75 0 0 0 1.5 0V9.75A.75.75 0 0 0 10 9H9Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div
          id={panelId}
          role="note"
          className="absolute top-full right-0 z-30 mt-1 w-[min(22rem,calc(100vw-3rem))] rounded-xl bg-white p-4 text-sm text-slate-600 shadow-lg ring-1 ring-slate-200"
        >
          <p className="mb-2 font-semibold text-slate-900">{title}</p>
          {children}
        </div>
      )}
    </div>
  )
}

/** One labelled point in an info popover, e.g. "Yellow line" → "Full sun". */
export function InfoItem({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <li>
      <span className="font-medium text-slate-800">{label}:</span> {children}
    </li>
  )
}

export function InfoList({ children }: { children: ReactNode }) {
  return <ul className="space-y-1.5">{children}</ul>
}

export function InfoFootnote({ children }: { children: ReactNode }) {
  return <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-slate-500">{children}</p>
}
