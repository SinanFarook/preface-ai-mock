'use client'

import { Menu } from 'lucide-react'
import { useState } from 'react'
import { ChatArea } from '@/components/preface/chat-area'
import { Composer } from '@/components/preface/composer'
import { Sidebar } from '@/components/preface/sidebar'
import { usePrefaceChat } from '@/hooks/use-preface-chat'
import { cn } from '@/lib/utils'

export function PrefaceChat() {
  const {
    sessionId,
    sessions,
    messages,
    status,
    isBusy,
    sendMessage,
    stopGeneration,
    selectSession,
    newChat,
  } = usePrefaceChat()

  const [drawerOpen, setDrawerOpen] = useState(false)

  // Clicking a welcome chip or an "Explore Further" suggestion asks it directly.
  const handleSuggestion = (text: string) => {
    if (isBusy) return
    sendMessage(text)
  }

  const handleRegenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) sendMessage(lastUser.content)
  }

  const handleSelect = (id: string) => {
    selectSession(id)
    setDrawerOpen(false)
  }

  const handleNewChat = () => {
    newChat()
    setDrawerOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden h-screen w-80 flex-none border-r border-divider lg:block">
        <Sidebar
          sessions={sessions}
          currentId={sessionId}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
        />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-foreground/30 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <div
          className={cn(
            'absolute left-0 top-0 h-full w-[300px] max-w-[85%] border-r border-divider shadow-xl transition-transform',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar
            sessions={sessions}
            currentId={sessionId}
            onSelect={handleSelect}
            onNewChat={handleNewChat}
            onClose={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      {/* Main column */}
      <main className="relative flex h-screen flex-1 flex-col">
        {/* Top navigation */}
        <header className="absolute inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-divider bg-background/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-primary hover:bg-hover-soft lg:hidden"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold leading-tight text-foreground">
                Preface AI
              </span>
              <span className="hidden font-sans text-xs text-muted-foreground sm:block">
                Ask questions from the curated Islamic library
              </span>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-hover-soft px-3 py-1 font-sans text-xs font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
            Online
          </span>
        </header>

        <ChatArea
          messages={messages}
          status={status}
          onSuggestionClick={handleSuggestion}
          onRegenerate={handleRegenerate}
        />

        <Composer
          disabled={status === 'loading-history'}
          isBusy={isBusy}
          onSend={sendMessage}
          onStop={stopGeneration}
        />
      </main>
    </div>
  )
}
