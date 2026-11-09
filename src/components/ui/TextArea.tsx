import { useId, type TextareaHTMLAttributes } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }

export function TextArea({ label, hint, className, id, rows = 3, ...rest }: TextAreaProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={inputId}
        rows={rows}
        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base shadow-sm sm:text-sm placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none"
        {...rest}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}
