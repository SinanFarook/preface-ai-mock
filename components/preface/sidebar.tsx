'use client'

import {
  HelpCircle,
  Info,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { ChatSession } from '@/lib/preface/types'

interface SidebarProps {
  sessions: ChatSession[]
  currentId: string
  onSelect: (id: string) => void
  onNewChat: () => void
  onClose?: () => void
}

type GroupKey = 'Today' | 'Yesterday' | 'Previous 7 Days' | 'Older'

function groupFor(iso: string): GroupKey {
  const date = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()
  const t = date.getTime()
  if (t >= startOfToday) return 'Today'
  if (t >= startOfToday - 86400000) return 'Yesterday'
  if (t >= startOfToday - 86400000 * 7) return 'Previous 7 Days'
  return 'Older'
}

const ORDER: GroupKey[] = ['Today', 'Yesterday', 'Previous 7 Days', 'Older']

export function Sidebar({
  sessions,
  currentId,
  onSelect,
  onNewChat,
  onClose,
}: SidebarProps) {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const filtered = sessions.filter((s) =>
      s.title.toLowerCase().includes(query.toLowerCase().trim()),
    )
    const map = new Map<GroupKey, ChatSession[]>()
    for (const session of filtered) {
      const key = groupFor(session.updated_at)
      const arr = map.get(key) ?? []
      arr.push(session)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
    }
    return map
  }, [sessions, query])

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex-1 overflow-y-auto px-5 py-6">
        {/* Logo + mobile close */}
        <div className="mb-6 flex items-center justify-between">
          <Image
            src="/preface-logo.png"
            alt="Preface to Islam"
            width={200}
            height={64}
            className="h-11 w-auto"
            priority
          />
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-surface lg:hidden"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* New chat */}
        <button
          type="button"
          onClick={onNewChat}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-sans text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Start New Research
        </button>

        {/* Search */}
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2">
          <Search
            className="h-4 w-4 flex-none text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="w-full bg-transparent font-sans text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Grouped chats */}
        <nav className="space-y-6">
          {ORDER.map((key) => {
            const items = grouped.get(key)
            if (!items || items.length === 0) return null
            return (
              <div key={key} className="space-y-1">
                <h3 className="px-3 pb-1 font-sans text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {key}
                </h3>
                {items.map((session) => {
                  const active = session.session_id === currentId
                  return (
                    <button
                      key={session.session_id}
                      type="button"
                      onClick={() => onSelect(session.session_id)}
                      className={cn(
                        'flex w-full items-center rounded-xl px-3 py-2.5 text-left font-sans text-sm transition-colors',
                        active
                          ? 'border-l-4 border-primary bg-secondary font-semibold text-secondary-foreground'
                          : 'border-l-4 border-transparent text-muted-foreground hover:bg-surface',
                      )}
                    >
                      <span className="line-clamp-1">{session.title}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
          {grouped.size === 0 ? (
            <p className="px-3 font-sans text-sm text-muted-foreground">
              No chats found.
            </p>
          ) : null}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-divider px-5 py-4">
        <FooterLink icon={<Settings className="h-4 w-4" />} label="Settings" />
        <FooterLink
          icon={<HelpCircle className="h-4 w-4" />}
          label="Help & Support"
        />
        <FooterLink
          icon={<Info className="h-4 w-4" />}
          label="About Preface AI"
        />
      </div>
    </div>
  )
}

function FooterLink({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) {
  return (
    <a
      href="#"
      onClick={(e) => e.preventDefault()}
      className="flex items-center gap-3 rounded-lg px-3 py-2 font-sans text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
    >
      {icon}
      {label}
    </a>
  )
}
