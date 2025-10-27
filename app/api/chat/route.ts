const NEAR_AI_TOKEN = process.env.NEAR_AI_TOKEN

export async function POST(req: Request) {
  try {
    if (!NEAR_AI_TOKEN) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { messages } = await req.json()

    const response = await fetch("https://api.near.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NEAR_AI_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "fireworks::accounts/fireworks/models/mixtral-8x22b-instruct",
        messages,
        temperature: 1,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("NEAR AI API error:", error)
      return new Response(JSON.stringify({ error: "Failed to get response from AI" }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), {
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
