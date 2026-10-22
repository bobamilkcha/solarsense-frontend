import { useId, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hideLabel?: boolean }

export function Select({ label, hideLabel, className, id, children, ...rest }: SelectProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  return (
    <div className={className}>
      <label htmlFor={inputId} className={cn('block text-sm font-medium text-slate-700', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={inputId}
        className={cn(
          'block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500',
          !hideLabel && 'mt-1',
        )}
        {...rest}
      >
        {children}
      </select>
    </div>
  )
}
