import lighthouse from '@lighthouse-web3/sdk'

interface Pair {
  user: string
  assistant: string
}

// Upload conversation pairs as a single JSON object to Lighthouse
export const uploadConversationPairs = async (messages: any[], apiKey?: string) => {
  try {
    const key = apiKey || process.env.LIGHTHOUSE_API_KEY || process.env.NEXT_PUBLIC_LIGHTHOUSE_API_KEY
    if (!key) {
      throw new Error('Lighthouse API key missing on server')
    }

    const pairs: Pair[] = []
    // Build pairs: assume messages alternate user/assistant; if not, be resilient
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      if (msg.role === 'user') {
        // find next assistant message
        const next = messages.slice(i + 1).find((m: any) => m.role === 'assistant')
        if (next) {
          pairs.push({ user: msg.content, assistant: next.content })
        }
      }
    }

    const payload = JSON.stringify({ pairs, timestamp: Date.now() }, null, 2)

    const name = `conversation-${Date.now()}.json`
    const res = await lighthouse.uploadText(payload, key, name)
    if (res?.data?.Hash) {
      return res.data.Hash
    }
    return null
  } catch (err) {
    console.error('uploadConversationPairs error:', err)
    return null
  }
}
