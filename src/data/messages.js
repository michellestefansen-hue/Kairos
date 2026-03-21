const CLUSTERS = [
  {
    tags: ['focused', 'creative', 'in flow', 'inspired', 'energized', 'productive'],
    messages: {
      high: [
        "Creative and fully charged — this combination doesn't happen by accident. Pay attention to what led here.",
        "In flow at your best. This is the data that will change how you plan your days."
      ],
      medium: [
        "Focused work at a steady pace is how most meaningful things actually get made.",
        "Not every creative session needs to be electric. Showing up matters more than intensity."
      ],
      low: [
        "Creating when you don't feel like it is its own kind of strength. The work is still real.",
        "The craft doesn't always match the feeling. Sometimes focus is just stubbornness — and that's enough."
      ]
    }
  },
  {
    tags: ['calm', 'present', 'content', 'grateful', 'curious'],
    messages: {
      high: [
        "Alert, present, and at peace. This is one of the rarest states — notice what made it possible.",
        "High energy without urgency. This is what alignment actually feels like."
      ],
      medium: [
        "Calm is underrated. Most people are too busy chasing peaks to notice it's already here.",
        "Presence at a steady pace isn't passive — it's a practice, and you're doing it."
      ],
      low: [
        "Low energy, quiet mind — sometimes the body rests so the deeper self can surface.",
        "Not every moment needs momentum. This stillness has something to say."
      ]
    }
  },
  {
    tags: ['connected', 'playful', 'motivated', 'confident'],
    messages: {
      high: [
        "The right people can change everything. Notice who was in the room when this happened.",
        "Energy from connection is the most renewable kind. You found it today."
      ],
      medium: [
        "Not every meaningful interaction needs to be electric. Steady presence with others builds something real.",
        "The people around you shape your energy more than anything else. This is worth paying attention to."
      ],
      low: [
        "Connected even when your energy is low — some relationships cost nothing to be in.",
        "Showing up for others when you don't have much left says a lot. Don't forget to refill."
      ]
    }
  },
  {
    tags: ['lonely', 'disconnected'],
    messages: {
      high: [
        "Productive and disconnected — sometimes the cost of deep focus is distance from others. Worth noticing.",
        "High energy, low connection. The work might be good — but check in with who matters when you get a chance."
      ],
      medium: [
        "Feeling disconnected on an ordinary day is more common than people admit. You're not alone in that.",
        "If this keeps showing up, Kairos will help you see when and why. That's the whole point."
      ],
      low: [
        "Lonely and depleted — this is one of the harder combinations. Being honest about it is the first step.",
        "Disconnection has a cost. Rest, reach out, or both. You get to choose."
      ]
    }
  },
  {
    tags: ['drained', 'tired', 'overwhelmed', 'stressed'],
    messages: {
      high: [
        "High output, feeling drained — the engine is running, but the cost is real. That's useful data.",
        "Stressed and still going. The pattern will tell you where this leads."
      ],
      medium: [
        "Tired but still in it. This is what investment looks like from the inside.",
        "Most meaningful work has a cost. You're in it — and the data is building."
      ],
      low: [
        "Drained and low — this is your most honest moment. Rest is not surrender, it's strategy.",
        "Almost everything will work again if you unplug it for a few minutes — including you. — Anne Lamott"
      ]
    }
  },
  {
    tags: ['anxious', 'restless', 'bored', 'distracted', 'scattered'],
    messages: {
      high: [
        "Restless energy without a channel — this is data too. Something is asking for your attention.",
        "Anxious and wired: the mind is looking for somewhere to land. Notice what it keeps circling back to."
      ],
      medium: [
        "Distracted isn't broken. It's a signal that something else is competing for your attention.",
        "A scattered mind is looking for a foothold. One small thing first."
      ],
      low: [
        "Anxious and depleted together — this moment asks for kindness, not pressure.",
        "When everything feels like too much, the answer is usually less — not more."
      ]
    }
  }
]

const FALLBACK = {
  high: [
    "This is it. The version of you that was always possible.",
    "Flow isn't luck. You're starting to learn what summons it.",
    "Remember this feeling — not to chase it, but so you recognize it when it comes again.",
    "Kairos. The right moment. You're in one."
  ],
  medium: [
    "Not every hour is a peak. The in-between has its own intelligence.",
    "Steady is its own kind of strong.",
    "You showed up. That's the whole thing, really."
  ],
  low: [
    "Rest is not absence. It's preparation.",
    "Seeds don't look like much underground either.",
    "Even roots grow in the dark."
  ]
}

export function getPostMomentMessage(energy, tags) {
  const tier = energy >= 7 ? 'high' : energy >= 4 ? 'medium' : 'low'
  const tagSet = new Set(tags.map(t => t.toLowerCase()))

  let bestCluster = null
  let bestCount = 0

  for (const cluster of CLUSTERS) {
    const count = cluster.tags.filter(t => tagSet.has(t)).length
    if (count > bestCount) {
      bestCount = count
      bestCluster = cluster
    }
  }

  if (bestCluster) {
    const msgs = bestCluster.messages[tier]
    return msgs[Math.floor(Math.random() * msgs.length)]
  }

  const fallback = FALLBACK[tier]
  return fallback[Math.floor(Math.random() * fallback.length)]
}
