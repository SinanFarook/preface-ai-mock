'use client'

import Image from 'next/image'

const EXAMPLES = [
  'Who is Prophet Muhammad?',
  'What is Tawhid?',
  'Why do Muslims pray?',
  'How does Islam define justice?',
]

export function EmptyStateWelcome({
  onSelect,
}: {
  onSelect: (text: string) => void
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center">
      <Image
        src="/preface-logo.png"
        alt="Preface to Islam"
        width={260}
        height={90}
        className="mb-8 h-auto w-56"
        priority
      />
      <h1 className="max-w-xl text-balance font-serif text-3xl font-bold text-foreground md:text-4xl">
        Ask about Islam with confidence
      </h1>
      <p className="mt-4 max-w-md text-pretty font-serif text-lg text-muted-foreground">
        Answers grounded in the Preface to Islam library.
      </p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onSelect(example)}
            className="rounded-2xl border border-border bg-surface px-5 py-4 text-left font-serif text-base text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  )
}
