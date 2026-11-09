import { useId, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}

export function TextField({ label, hint, error, className, id, ...rest }: TextFieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const hintId = `${inputId}-hint`
  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? hintId : undefined}
        className={cn(
          'mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-base text-slate-900 sm:text-sm shadow-sm',
          'placeholder:text-slate-400 focus:outline-none focus:ring-2',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
            : 'border-slate-300 focus:border-amber-500 focus:ring-amber-200',
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={hintId} className={cn('mt-1 text-xs', error ? 'text-red-600' : 'text-slate-500')}>
          {error ?? hint}
        </p>
      )}
    </div>
  )
}
