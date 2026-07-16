'use client'

import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AIMessage } from '@/components/preface/ai-message'
import { EmptyStateWelcome } from '@/components/preface/empty-state'
import { UserMessage } from '@/components/preface/user-message'
import type { ChatStatus } from '@/hooks/use-preface-chat'
import type { ChatMessage } from '@/lib/preface/types'

interface ChatAreaProps {
  messages: ChatMessage[]
  status: ChatStatus
  onSuggestionClick: (text: string) => void
  onRegenerate: () => void
}

export function ChatArea({
  messages,
  status,
  onSuggestionClick,
  onRegenerate,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [atBottom, setAtBottom] = useState(true)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }

  // Track whether the user is pinned to the bottom.
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    setAtBottom(distance < 80)
  }

  // Auto-scroll only when the user is already at the bottom.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (atBottom) scrollToBottom('smooth')
  }, [messages])

  if (status === 'loading-history') {
    return (
      <div className="flex-1 overflow-y-auto px-4 pb-40 pt-24 md:px-6">
        <div className="mx-auto w-full max-w-[820px]">
          <HistorySkeleton />
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto pb-40 pt-16">
        <EmptyStateWelcome onSelect={onSuggestionClick} />
      </div>
    )
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto px-4 pb-44 pt-24 md:px-6"
      >
        <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8">
          {messages.map((message) =>
            message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <AIMessage
                key={message.id}
                message={message}
                onSuggestionClick={onSuggestionClick}
                onRegenerate={onRegenerate}
              />
            ),
          )}
        </div>
      </div>

      {!atBottom ? (
        <button
          type="button"
          onClick={() => scrollToBottom('smooth')}
          className="absolute bottom-36 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 font-sans text-sm text-foreground shadow-md transition-transform hover:-translate-y-0.5"
        >
          <ArrowDown className="h-4 w-4" aria-hidden="true" />
          Jump to latest
        </button>
      ) : null}
    </div>
  )
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-end">
        <div className="h-14 w-2/3 animate-pulse rounded-[20px] bg-secondary/60" />
      </div>
      <div className="rounded-[20px] border border-divider bg-surface p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-8 w-8 animate-pulse rounded-full bg-hover-soft" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-24 animate-pulse rounded bg-hover-soft" />
            <div className="h-2.5 w-40 animate-pulse rounded bg-hover-soft" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-hover-soft" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-hover-soft" />
          <div className="h-4 w-full animate-pulse rounded bg-hover-soft" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-hover-soft" />
        </div>
        <div className="mt-8 flex gap-4">
          <div className="h-16 w-56 animate-pulse rounded-xl bg-hover-soft" />
          <div className="h-16 w-56 animate-pulse rounded-xl bg-hover-soft" />
        </div>
      </div>
    </div>
  )
}
