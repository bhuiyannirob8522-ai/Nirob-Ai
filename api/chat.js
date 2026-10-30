const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed. Send a POST request." });
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(503).json({
      error: "The AI service is not configured yet. Add your API key as GEMINI_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const input = Array.isArray(body && body.messages) ? body.messages : [];

    const messages = input
      .filter((item) =>
        item &&
        (item.role === "user" || item.role === "assistant" || item.role === "ai") &&
        typeof item.text === "string" &&
        item.text.trim()
      )
      .slice(-16)
      .map((item) => ({
        role: item.role === "assistant" || item.role === "ai" ? "model" : "user",
        parts: [{ text: item.text.trim().slice(0, 12000) }]
      }));

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return res.status(400).json({ error: "Please send a message first." });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;

    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(MODEL) + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: [
                  "You are Nirob AI, a helpful and accurate personal AI assistant.",
                  "Never mention the model provider, API, or internal implementation.",
                  "Do not address the user by a personal name. Do not insert the word Nirob into replies; Nirob AI is only your product name.",
                  "Reply in the same language as the user's latest message. If the user writes Banglish, reply in natural Bangla. If the user writes English, reply in English.",
                  "Use clear, natural language. Be relevant and avoid unnecessary introductions. If you are unsure, say so instead of inventing facts."
                ].join(" ")
              }]
            },
            contents: messages,
            generationConfig: {
              maxOutputTokens: 2048
            }
          }),
          signal: controller.signal
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const googleError = data && data.error ? data.error : {};
      const googleMessage = typeof googleError.message === "string" ? googleError.message : "";
      console.error("AI provider request failed:", {
        status: response.status,
        statusText: googleError.status || "",
        message: googleMessage.slice(0, 500)
      });

      let message;
      if (response.status === 401) {
        message = "The API key was rejected (401). Check that the complete key is saved as GEMINI_API_KEY in this Vercel project, then redeploy. If it still fails, create a fresh key in Google AI Studio.";
      } else if (response.status === 403) {
        message = "The API key or its Google Cloud project does not have permission to use the AI service (403). Check the key restrictions and project access in Google AI Studio.";
      } else if (response.status === 404) {
        message = "The configured AI model was not found (404). Check the GEMINI_MODEL setting in Vercel.";
      } else if (response.status === 429) {
        message = "The AI service rate limit or quota has been reached (429). Please wait and try again later.";
      } else if (response.status === 400) {
        message = "The AI service rejected the request (400). Please try a shorter message.";
      } else {
        message = "The AI service could not complete the request (HTTP " + response.status + "). Please try again.";
      }

      return res.status(502).json({ error: message });
    }

    const answer = (data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      const reason = data.promptFeedback && data.promptFeedback.blockReason;
      console.warn("AI returned no text:", reason || "No block reason provided");
      return res.status(502).json({
        error: "The assistant could not generate a text reply. Please rephrase your message and try again."
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    if (error && error.name === "AbortError") {
      return res.status(504).json({ error: "The AI request timed out. Please try again." });
    }
    console.error("Nirob AI server error:", error);
    return res.status(500).json({ error: "A server error occurred. Please try again." });
  }
};
