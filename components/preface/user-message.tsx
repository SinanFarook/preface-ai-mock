'use client'

import type { ChatMessage } from '@/lib/preface/types'

function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex flex-col items-end">
      <div className="max-w-[80%] rounded-[20px] bg-secondary px-5 py-4">
        <p className="font-serif text-[17px] leading-relaxed text-secondary-foreground">
          {message.content}
        </p>
      </div>
      <span className="mt-1.5 px-1 font-sans text-xs text-muted-foreground">
        {formatTime(message.timestamp)}
      </span>
    </div>
  )
}
