'use client'

import { ArrowUp, Search, Square } from 'lucide-react'
import {
  type KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { cn } from '@/lib/utils'

interface ComposerProps {
  disabled?: boolean
  isBusy?: boolean
  onSend: (text: string) => void
  onStop: () => void
  externalRef?: React.Ref<{ setText: (text: string) => void }>
}

export function Composer({
  disabled,
  isBusy,
  onSend,
  onStop,
  externalRef,
}: ComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useImperativeHandle(externalRef, () => ({
    setText: (text: string) => {
      setValue(text)
      requestAnimationFrame(() => {
        textareaRef.current?.focus()
        autosize()
      })
    },
  }))

  const autosize = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    // Cap growth at ~5 lines.
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  useEffect(autosize, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || isBusy || disabled) return
    onSend(text)
    setValue('')
    requestAnimationFrame(autosize)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Respect IME composition (CJK) before submitting.
    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center bg-gradient-to-t from-background via-background to-transparent px-4 pb-6 pt-10">
      <div className="pointer-events-auto w-full max-w-[900px]">
        <div
          className={cn(
            'flex items-end gap-2 rounded-[28px] border border-border-subtle bg-surface px-4 py-2 shadow-sm transition-colors focus-within:border-primary',
            disabled && 'opacity-70',
          )}
        >
          <span className="flex h-11 flex-none items-center text-muted-foreground">
            <Search className="h-5 w-5" aria-hidden="true" />
          </span>
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            disabled={disabled}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Islam..."
            aria-label="Ask anything about Islam"
            className="max-h-[140px] flex-1 resize-none bg-transparent py-3 font-serif text-lg leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
          />
          {isBusy ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              className="mb-1 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Square className="h-4 w-4 fill-current" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={disabled || value.trim().length === 0}
              aria-label="Send message"
              className="mb-1 flex h-11 w-11 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowUp className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
        <p className="mt-3 text-center font-sans text-xs text-muted-foreground">
          Preface AI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  )
}
