import { uploadConversationPairs } from '@/lib/lighthouse-server'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

export async function POST(req: Request) {
  try {
    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages } = await req.json()

    // System prompt to ensure the model identifies itself as Mixtral deployed on NEAR
    const SYSTEM_PROMPT =
      "You are Mixtral 8x22B, an on-chain model deployed on the NEAR protocol. If a user asks what model you are, reply: 'I am the Mixtral model deployed on-chain on the NEAR protocol.' Answer concisely and truthfully."

    // Updated model to 'gemini-1.5-flash-latest' to resolve 404 errors
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Prepend the system prompt as the first message so the model uses it as an instruction.
          contents: [
            { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
            ...messages.map((msg: any) => ({
              role: msg.role === "assistant" ? "model" : "user",
              parts: [{ text: msg.content }],
            })),
          ],
          generationConfig: {
            temperature: 1,
            maxOutputTokens: 1024,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Gemini API error:", error)
      return new Response(JSON.stringify({ error: "Failed to get response from AI" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await response.json()

    // Try to extract a readable assistant text from Gemini's response.
    const extractAssistantText = (d: any) => {
      if (!d) return ""

      // Common/generic places Gemini-like responses may put text
      // Try candidates -> content (array of parts)
      try {
        if (Array.isArray(d.candidates) && d.candidates.length > 0) {
          // Use the last candidate as the "final" AI message
          const cand = d.candidates[d.candidates.length - 1]
          // Newer Gemini shapes put content.parts -> [{ text }]
          if (cand?.content?.parts && Array.isArray(cand.content.parts)) {
            return cand.content.parts.map((p: any) => p.text || "").join("")
          }
          if (typeof cand.content === "string") return cand.content
          if (Array.isArray(cand.content)) return cand.content.map((p: any) => p.text || "").join("")
          if (typeof cand.output_text === "string") return cand.output_text
        }

        // Try output -> content
        if (Array.isArray(d.output) && d.output[0] && Array.isArray(d.output[0].content)) {
          return d.output[0].content.map((p: any) => p.text || "").join("")
        }

        // Fallbacks
        if (typeof d.text === "string") return d.text
        if (typeof d.output_text === "string") return d.output_text
      } catch (e) {
        // ignore extraction errors
      }

      // As a last resort, return a compact JSON string so frontend has something
      try {
        return JSON.stringify(d)
      } catch (e) {
        return String(d)
      }
    }

    const assistantText = extractAssistantText(data)

    // Return a small OpenAI-like shape so the frontend can read `choices[0].message.content`.
    const mapped = {
      choices: [
        {
          message: { role: "assistant", content: assistantText },
        },
      ],
    }

    console.log("Mapped assistant text length:", assistantText?.length || 0)

    // Append assistant message to messages and store conversation pairs on Lighthouse (best-effort)
    try {
      const newMessages = [...messages, { role: 'assistant', content: assistantText }]
      const lighthouseHash = await uploadConversationPairs(newMessages)
      if (lighthouseHash) {
        console.log('Stored conversation on Lighthouse:', lighthouseHash)
      } else {
        console.warn('Lighthouse store returned no hash')
      }
    } catch (err) {
      console.error('Error uploading conversation to Lighthouse:', err)
    }

    return new Response(JSON.stringify(mapped), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}