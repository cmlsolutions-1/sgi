import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'file:text-primary-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-1 text-base shadow-sm transition-[color,box-shadow] outline-none file:mr-3 file:inline-flex file:h-7 file:cursor-pointer file:items-center file:rounded-md file:border-0 file:bg-primary file:px-3 file:text-sm file:font-medium file:shadow-sm hover:border-slate-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
        'focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
