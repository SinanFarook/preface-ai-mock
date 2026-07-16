import type { CitationSource, HistoryMessage } from './types'

// A small in-memory corpus used to simulate the FastAPI RAG backend when the
// real server at API_BASE is unreachable (e.g. inside the v0 preview).

interface MockAnswer {
  keywords: string[]
  sources: CitationSource[]
  content: string
  suggestions: string[]
}

const ANSWERS: MockAnswer[] = [
  {
    keywords: ['inequality', 'wealth', 'welfare', 'economic', 'poor', 'rich'],
    sources: [
      {
        id: 1,
        article_id: '60f1a2b3c4d5e',
        title: 'Economic Inequality: An Islamic Panorama',
        category: 'Stories',
        description:
          'A survey of how Islamic tradition frames the distribution of wealth.',
      },
      {
        id: 2,
        article_id: '77a9b1c2d3e4f',
        title: 'Principles of Zakat',
        category: 'Jurisprudence',
        description: 'The rulings and wisdom behind obligatory almsgiving.',
      },
    ],
    content:
      'Islamic tradition approaches economic inequality not merely as a practical social issue, but as a profound spiritual and ethical concern. The paradigm is built upon the concept of divine ownership, wherein wealth is considered a trust (*amanah*) bestowed by God upon individuals, who are expected to manage it responsibly and equitably [1].\n\nCentral to this system is the institution of **Zakat**, an obligatory almsgiving that serves to purify wealth and redistribute it to the most vulnerable segments of society. It is structurally designed to prevent the excessive concentration of wealth [2]. Complementing Zakat is **Sadaqah**, voluntary charity, which is highly encouraged as a means of spiritual elevation.\n\nFurthermore, the Islamic economic framework strictly prohibits *Riba* (usury or unjust, exploitative gains), aiming to prevent practices that disproportionately harm the poor and exacerbate systemic inequality [1].',
    suggestions: [
      'How is Riba defined in modern finance?',
      'What is the historical impact of Zakat?',
    ],
  },
  {
    keywords: ['tawhid', 'tawheed', 'oneness', 'monotheism'],
    sources: [
      {
        id: 1,
        article_id: 'aa11bb22cc33',
        title: 'The Doctrine of Tawhid',
        category: 'Theology',
        description: 'The foundational Islamic principle of divine oneness.',
      },
    ],
    content:
      '**Tawhid** is the cornerstone of Islamic belief — the absolute oneness and uniqueness of God (*Allah*). It affirms that there is no deity worthy of worship except Him, and that He has no partners, equals, or offspring [1].\n\nScholars traditionally describe Tawhid across three dimensions: oneness of lordship (*Rububiyyah*), oneness of worship (*Uluhiyyah*), and oneness of the divine names and attributes (*al-Asma wa al-Sifat*). Together these shape not only creed but every dimension of a Muslim\u2019s ethical and spiritual life [1].',
    suggestions: [
      'What are the three categories of Tawhid?',
      'How does Tawhid shape daily worship?',
    ],
  },
  {
    keywords: ['wudu', 'ablution', 'purification', 'prayer', 'pray', 'salah'],
    sources: [
      {
        id: 1,
        article_id: 'dd44ee55ff66',
        title: 'The Rules of Wudu',
        category: 'Jurisprudence',
        description: 'A practical guide to the conditions and acts of ablution.',
      },
    ],
    content:
      'Wudu is the ritual ablution a Muslim performs to attain a state of purity before prayer. It requires clean water and the sincere intention (*niyyah*) to purify oneself for worship [1].\n\nThe essential acts include washing the face, washing the arms up to the elbows, wiping the head, and washing the feet up to the ankles \u2014 performed in order and without significant interruption [1].',
    suggestions: [
      'What invalidates Wudu?',
      'When is Ghusl required instead of Wudu?',
    ],
  },
]

const DEFAULT_ANSWER: MockAnswer = {
  keywords: [],
  sources: [
    {
      id: 1,
      article_id: 'ffee0011aabb',
      title: 'Preface to Islam: An Introduction',
      category: 'Overview',
      description: 'A gentle introduction to the core teachings of Islam.',
    },
  ],
  content:
    'Thank you for your question. Drawing on the curated Preface to Islam library, the tradition consistently emphasizes knowledge grounded in primary sources \u2014 the Qur\u2019an and the authenticated Sunnah \u2014 interpreted through centuries of careful scholarship [1].\n\nCould you share a little more detail about what you would like to explore? I can then point you toward the most relevant readings from the library.',
  suggestions: [
    'What is Tawhid?',
    'How does Islam address economic inequality?',
    'What are the conditions of Wudu?',
  ],
}

export function resolveMockAnswer(message: string): MockAnswer {
  const lower = message.toLowerCase()
  for (const answer of ANSWERS) {
    if (answer.keywords.some((k) => lower.includes(k))) {
      return answer
    }
  }
  return DEFAULT_ANSWER
}

// Seed history so a "recent chat" opens with content, mirroring the reference.
export function mockHistory(sessionId: string): HistoryMessage[] {
  if (sessionId !== 'demo-inequality') return []
  const answer = ANSWERS[0]
  return [
    {
      role: 'user',
      content:
        'How does Islamic tradition address economic inequality and social welfare?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      role: 'assistant',
      content: answer.content,
      timestamp: new Date(Date.now() - 1000 * 60 * 29).toISOString(),
    },
  ]
}

// Sources/suggestions to attach to a seeded assistant message (mock only).
export function mockHistoryExtras(
  sessionId: string,
): { sources: CitationSource[]; suggestions: string[] } | null {
  if (sessionId !== 'demo-inequality') return null
  const answer = ANSWERS[0]
  return { sources: answer.sources, suggestions: answer.suggestions }
}
