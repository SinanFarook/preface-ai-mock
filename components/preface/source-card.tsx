'use client'

import { ArrowRight, BookOpen } from 'lucide-react'
import type { CitationSource } from '@/lib/preface/types'

interface SourceCardProps {
  source: CitationSource
}

export function SourceCard({ source }: SourceCardProps) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="group flex flex-1 items-center gap-4 rounded-xl border border-border bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm min-w-[240px]"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-hover-soft text-primary">
        <BookOpen className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-serif text-sm font-semibold text-foreground">
          {source.title}
        </span>
        <span className="block font-sans text-xs text-muted-foreground">
          {source.category ?? 'Reference'}
        </span>
      </span>
      <span className="flex flex-none items-center gap-1 font-sans text-sm font-medium text-primary">
        Read
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </a>
  )
}
