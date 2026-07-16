'use client'

import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE, SESSION_STORAGE_KEY } from '@/lib/preface/config'
import {
  mockHistory,
  mockHistoryExtras,
  resolveMockAnswer,
} from '@/lib/preface/mock-backend'
import type {
  ChatMessage,
  ChatSession,
  CitationSource,
  HistoryMessage,
} from '@/lib/preface/types'

function uid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function nowIso() {
  return new Date().toISOString()
}

function titleFromMessage(message: string) {
  const trimmed = message.trim().replace(/\s+/g, ' ')
  return trimmed.length > 42 ? `${trimmed.slice(0, 42)}\u2026` : trimmed
}

// Seed sessions mirror the reference design's recent chats.
function seedSessions(): ChatSession[] {
  const today = Date.now()
  const yesterday = today - 1000 * 60 * 60 * 24
  return [
    {
      session_id: 'demo-inequality',
      title: 'Islamic Tradition & Inequality',
      updated_at: new Date(today - 1000 * 60 * 25).toISOString(),
    },
    {
      session_id: 'demo-tawhid',
      title: 'Concept of Tawhid',
      updated_at: new Date(today - 1000 * 60 * 90).toISOString(),
    },
    {
      session_id: 'demo-andalus',
      title: 'History of Al-Andalus',
      updated_at: new Date(yesterday).toISOString(),
    },
  ]
}

function cancellableSleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Aborted', 'AbortError'))
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true },
    )
  })
}

function safeParse<T>(data: string, fallback: T): T {
  try {
    return JSON.parse(data) as T
  } catch {
    return fallback as T
  }
}

export type ChatStatus =
  | 'loading-history'
  | 'idle'
  | 'waiting'
  | 'streaming'

export function usePrefaceChat() {
  const [sessionId, setSessionId] = useState<string>('')
  const [sessions, setSessions] = useState<ChatSession[]>(seedSessions())
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [status, setStatus] = useState<ChatStatus>('loading-history')

  const abortRef = useRef<AbortController | null>(null)
  const userStoppedRef = useRef(false)

  const isBusy = status === 'waiting' || status === 'streaming'

  // --- Message state helpers -------------------------------------------------
  const patchMessage = useCallback(
    (id: string, patch: Partial<ChatMessage>) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      )
    },
    [],
  )

  const appendContent = useCallback((id: string, chunk: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, content: m.content + chunk } : m,
      ),
    )
  }, [])

  // --- History hydration -----------------------------------------------------
  const loadHistory = useCallback(async (id: string) => {
    setStatus('loading-history')
    setMessages([])
    let history: HistoryMessage[] | null = null
    try {
      const res = await fetch(`${API_BASE}/chat/history/${id}`, {
        headers: { Accept: 'application/json' },
      })
      if (res.ok) history = (await res.json()) as HistoryMessage[]
    } catch {
      history = null
    }
    // Fall back to mock history when the backend is unreachable.
    let usedMock = false
    if (history === null) {
      history = mockHistory(id)
      usedMock = true
    }

    const extras = usedMock ? mockHistoryExtras(id) : null
    const mapped: ChatMessage[] = history.map((h) => ({
      id: uid(),
      role: h.role,
      content: h.content,
      timestamp: h.timestamp,
    }))
    // Attach seeded sources/suggestions to the last assistant message.
    if (extras) {
      for (let i = mapped.length - 1; i >= 0; i--) {
        if (mapped[i].role === 'assistant') {
          mapped[i].sources = extras.sources
          mapped[i].suggestions = extras.suggestions
          break
        }
      }
    }

    setMessages(mapped)
    setStatus('idle')
  }, [])

  // --- Initial mount ---------------------------------------------------------
  useEffect(() => {
    let stored =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(SESSION_STORAGE_KEY)
        : null
    if (!stored) {
      stored = 'demo-inequality'
      window.localStorage.setItem(SESSION_STORAGE_KEY, stored)
    }
    setSessionId(stored)
    loadHistory(stored)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Streaming: real backend with mock fallback ----------------------------
  const streamMock = useCallback(
    async (message: string, assistantId: string, signal: AbortSignal) => {
      const answer = resolveMockAnswer(message)
      await cancellableSleep(650, signal)
      patchMessage(assistantId, { sources: answer.sources })
      setStatus('streaming')
      const tokens = answer.content.match(/\S+\s*/g) ?? [answer.content]
      for (const token of tokens) {
        if (signal.aborted) return
        appendContent(assistantId, token)
        await cancellableSleep(26, signal)
      }
      patchMessage(assistantId, {
        suggestions: answer.suggestions,
        isStreaming: false,
      })
    },
    [appendContent, patchMessage],
  )

  const streamReal = useCallback(
    async (
      message: string,
      assistantId: string,
      controller: AbortController,
    ) => {
      let sawFirstPayload = false
      let done = false
      try {
        await fetchEventSource(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message }),
        signal: controller.signal,
        openWhenHidden: true,
        onopen: async (res) => {
          const ct = res.headers.get('content-type') ?? ''
          if (!res.ok || !ct.includes('text/event-stream')) {
            throw new Error(`Unexpected response: ${res.status}`)
          }
        },
        onmessage: (ev) => {
          switch (ev.event) {
            case 'sources': {
              const sources = safeParse<CitationSource[]>(ev.data, [])
              patchMessage(assistantId, { sources })
              break
            }
            case 'payload': {
              if (!sawFirstPayload) {
                sawFirstPayload = true
                setStatus('streaming')
              }
              const text = safeParse<string>(ev.data, ev.data)
              appendContent(assistantId, text)
              break
            }
            case 'error': {
              const text = safeParse<string>(ev.data, ev.data)
              patchMessage(assistantId, {
                isError: true,
                isStreaming: false,
                content: text,
              })
              done = true
              // Close the connection cleanly; this resolves fetchEventSource.
              controller.abort()
              break
            }
            case 'close': {
              patchMessage(assistantId, { isStreaming: false })
              done = true
              controller.abort()
              break
            }
            default:
              break
          }
        },
        onerror: (err) => {
          // A clean close/error we already handled — swallow the abort noise.
          if (done) return
          // Otherwise the backend is unreachable: throw to stop retrying and
          // let the caller fall back to the mock stream.
          throw err
        },
        })
      } catch (err) {
        // Aborting on close/error rejects the promise with AbortError — that is
        // an expected completion, not a failure. Only re-throw genuine errors.
        if (!done) throw err
      }
      // If we reached here via a handled close/error, the stream completed
      // successfully from the caller's perspective — do not fall back.
      return done
    },
    [appendContent, patchMessage, sessionId],
  )

  const sendMessage = useCallback(
    async (raw: string) => {
      const message = raw.trim()
      if (!message || isBusy || !sessionId) return

      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: message,
        timestamp: nowIso(),
      }
      const assistantId = uid()
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: nowIso(),
        isStreaming: true,
      }
      setMessages((prev) => [...prev, userMsg, assistantMsg])
      setStatus('waiting')

      // Update the sidebar session title/timestamp based on the first prompt.
      setSessions((prev) =>
        prev.map((s) =>
          s.session_id === sessionId
            ? {
                ...s,
                title:
                  s.title === 'New Chat' ? titleFromMessage(message) : s.title,
                updated_at: nowIso(),
              }
            : s,
        ),
      )

      const controller = new AbortController()
      abortRef.current = controller

      try {
        await streamReal(message, assistantId, controller)
      } catch (err) {
        const name = (err as DOMException)?.name
        // A user-initiated stop (fresh, unpoisoned abort) should not fall back.
        if (name === 'AbortError' && userStoppedRef.current) {
          // User stopped — nothing more to do.
        } else {
          console.log('[v0] Real backend unavailable, using mock stream:', err)
          // Backend unreachable → fall back to the mock stream so the UI works.
          // Use a FRESH controller so an already-aborted real signal can't kill it.
          const mockController = new AbortController()
          abortRef.current = mockController
          try {
            await streamMock(message, assistantId, mockController.signal)
          } catch (mockErr) {
            if ((mockErr as DOMException)?.name !== 'AbortError') {
              console.log('[v0] Mock stream failed:', mockErr)
              patchMessage(assistantId, {
                isError: true,
                isStreaming: false,
                content:
                  'I am currently experiencing technical difficulties. Please try again.',
              })
            }
          }
        }
      } finally {
        patchMessage(assistantId, { isStreaming: false })
        setStatus('idle')
        abortRef.current = null
      }
    },
    [isBusy, patchMessage, sessionId, streamMock, streamReal],
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setStatus('idle')
  }, [])

  const selectSession = useCallback(
    (id: string) => {
      if (id === sessionId || isBusy) return
      abortRef.current?.abort()
      setSessionId(id)
      window.localStorage.setItem(SESSION_STORAGE_KEY, id)
      loadHistory(id)
    },
    [isBusy, loadHistory, sessionId],
  )

  const newChat = useCallback(() => {
    abortRef.current?.abort()
    const id = uid()
    const session: ChatSession = {
      session_id: id,
      title: 'New Chat',
      updated_at: nowIso(),
    }
    setSessions((prev) => [session, ...prev])
    setSessionId(id)
    window.localStorage.setItem(SESSION_STORAGE_KEY, id)
    setMessages([])
    setStatus('idle')
  }, [])

  return {
    sessionId,
    sessions,
    messages,
    status,
    isBusy,
    sendMessage,
    stopGeneration,
    selectSession,
    newChat,
  }
}
