const NEAR_AI_TOKEN = `{"account_id":"jayeshh.near","public_key":"ed25519:BqbfWQvudJqCML1xxHnFYpccCcq1FprEYu1rvZpWFRJr","signature":"Ag9BKNGkkVIN7ItpGnAPLYq9yehb1n70OFcWcbYtJIu1K5jYsR/nhCnSHXpOFtKegctxlVTCXW55RxvDKk62DA==","callback_url":"https://app.near.ai/sign-in/callback","message":"Welcome to NEAR AI Hub!","recipient":"ai.near","nonce":"00000000000000000001754993801700"}`

export async function POST(req: Request) {
  try {
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
