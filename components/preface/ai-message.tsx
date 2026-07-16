'use client'

import { Copy, RefreshCw, Share2, Sparkles } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { InlineCitation } from '@/components/preface/inline-citation'
import { SourceCard } from '@/components/preface/source-card'
import { cn } from '@/lib/utils'
import type { ChatMessage, CitationSource } from '@/lib/preface/types'

// Replace [1], [2] tokens inside plain text with InlineCitation components.
function renderWithCitations(
  node: ReactNode,
  sources: CitationSource[] | undefined,
  keyPrefix: string,
): ReactNode {
  if (typeof node === 'string') {
    const parts = node.split(/(\[\d+\])/g)
    return parts.map((part, i) => {
      const match = part.match(/^\[(\d+)\]$/)
      if (match) {
        const index = Number(match[1])
        const source = sources?.find((s) => s.id === index)
        return (
          <InlineCitation
            key={`${keyPrefix}-cite-${i}`}
            index={index}
            source={source}
          />
        )
      }
      return part
    })
  }
  if (Array.isArray(node)) {
    return node.map((child, i) =>
      renderWithCitations(child, sources, `${keyPrefix}-${i}`),
    )
  }
  return node
}

interface AIMessageProps {
  message: ChatMessage
  onSuggestionClick: (text: string) => void
  onRegenerate: () => void
}

export function AIMessage({
  message,
  onSuggestionClick,
  onRegenerate,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false)
  const { content, sources, suggestions, isStreaming, isError } = message
  const isWaiting = isStreaming && content.length === 0 && !isError

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <article
      className={cn(
        'rounded-[20px] border bg-surface p-6 shadow-sm md:p-8',
        isError ? 'border-destructive/60' : 'border-divider',
      )}
      aria-live="polite"
    >
      {/* Header */}
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="flex flex-col">
          <span className="font-sans text-sm font-semibold text-foreground">
            Preface AI
          </span>
          <span className="font-sans text-xs text-muted-foreground">
            Answer generated from the Preface Library
          </span>
        </span>
      </header>

      {/* Body */}
      {isWaiting ? (
        <div className="flex items-center gap-1.5 py-2" aria-label="Thinking">
          <span className="preface-dot h-2 w-2 rounded-full bg-primary" />
          <span
            className="preface-dot h-2 w-2 rounded-full bg-primary"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="preface-dot h-2 w-2 rounded-full bg-primary"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      ) : (
        <div
          className={cn(
            'font-serif text-[17px] leading-[1.75] text-foreground',
            '[&_p]:mb-4 [&_p:last-child]:mb-0',
            '[&_strong]:font-semibold [&_em]:italic',
            '[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1',
            '[&_h1]:mb-3 [&_h1]:mt-2 [&_h1]:text-2xl [&_h1]:font-bold',
            '[&_h2]:mb-3 [&_h2]:mt-2 [&_h2]:text-xl [&_h2]:font-bold',
            '[&_a]:text-primary [&_a]:underline',
            '[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic',
            isError && 'text-destructive',
          )}
        >
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => (
                <p>{renderWithCitations(children, sources, 'p')}</p>
              ),
              li: ({ children }) => (
                <li>{renderWithCitations(children, sources, 'li')}</li>
              ),
            }}
          >
            {content}
          </Markdown>
          {isStreaming && content.length > 0 ? (
            <span className="preface-cursor" aria-hidden="true" />
          ) : null}
        </div>
      )}

      {/* Sources */}
      {sources && sources.length > 0 ? (
        <section className="mt-8">
          <h4 className="mb-4 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Referenced Sources
          </h4>
          <div className="flex flex-wrap gap-4">
            {sources.map((source) => (
              <SourceCard key={source.article_id} source={source} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Suggestions */}
      {suggestions && suggestions.length > 0 ? (
        <section className="mt-8">
          <h4 className="mb-3 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Explore Further
          </h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestionClick(s)}
                className="rounded-full border border-transparent bg-hover-soft px-4 py-2 font-sans text-sm text-primary transition-colors hover:border-primary/20 hover:bg-secondary"
              >
                {s}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Actions */}
      {!isStreaming && !isError && content.length > 0 ? (
        <footer className="mt-6 flex justify-end gap-1 border-t border-divider pt-4">
          <ActionButton label={copied ? 'Copied' : 'Copy'} onClick={handleCopy}>
            <Copy className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
          <ActionButton label="Share" onClick={() => {}}>
            <Share2 className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
          <ActionButton label="Regenerate" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </ActionButton>
        </footer>
      ) : null}
    </article>
  )
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-hover-soft hover:text-primary"
    >
      {children}
    </button>
  )
}
