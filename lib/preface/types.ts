// Data models & schemas — mirror the backend contract exactly.

// Payload sent to POST /chat
export interface ChatRequest {
  session_id: string
  message: string
}

// Response from GET /chat/history/{session_id}
export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

// Structure of the JSON array received in the SSE `event: sources`
export interface CitationSource {
  id: number // The citation number, e.g. 1 for [1]
  article_id: string // The database UUID
  title: string // Title of the article to display in the UI
  category?: string // Optional category label (e.g. "Jurisprudence")
  description?: string // Optional short description
}

// How a message is stored in React state
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  isStreaming?: boolean
  isError?: boolean
  sources?: CitationSource[]
  suggestions?: string[]
}

// How a chat session is represented in the sidebar
export interface ChatSession {
  session_id: string
  title: string
  updated_at: string
}
