'use client'

import { useState } from 'react'
import type { CitationSource } from '@/lib/preface/types'

interface InlineCitationProps {
  index: number
  source?: CitationSource
}

export function InlineCitation({ index, source }: InlineCitationProps) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <sup>
        <button
          type="button"
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onClick={() => setOpen((v) => !v)}
          aria-label={
            source ? `Source ${index}: ${source.title}` : `Source ${index}`
          }
          className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 font-sans text-[10px] font-semibold leading-none text-secondary-foreground align-super transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {index}
        </button>
      </sup>

      {source && open ? (
        <span
          role="tooltip"
          className="preface-fade-in absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-md border border-border bg-surface p-3 text-left shadow-md"
        >
          <span className="block font-sans text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {source.category ?? 'Source'}
          </span>
          <span className="mt-1 block font-serif text-sm font-semibold leading-snug text-foreground">
            {source.title}
          </span>
          {source.description ? (
            <span className="mt-1 block font-sans text-xs leading-relaxed text-muted-foreground">
              {source.description}
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  )
}
