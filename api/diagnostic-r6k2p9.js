module.exports = async function handler(req, res) {
  if (req.method !== "GET" || req.query.token !== "n8M3pY7vQ2xL5cA1dF9hJ4sK6wR0bT3z") {
    return res.status(404).json({ ok: false });
  }
  const key = (process.env.GEMINI_API_KEY || "").trim();
  if (!key) return res.status(200).json({ configured: false });
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are Nirob AI, a helpful assistant. Do not mention the model provider. Do not address the user by name. Reply in the same language as the user's latest message. Be concise and factual." }] },
        contents: [{ role: "user", parts: [{ text: "Reply with the single word OK." }] }],
        generationConfig: { maxOutputTokens: 2048 }
      })
    });
    const d = await r.json().catch(() => ({}));
    const answer = d.candidates && d.candidates[0] && d.candidates[0].content &&
      d.candidates[0].content.parts ? d.candidates[0].content.parts.map(p => p.text || "").join("") : "";
    return res.status(200).json({
      configured: true, providerStatus: r.status, accepted: r.ok,
      answerPreview: answer.slice(0, 60),
      errorStatus: d && d.error && d.error.status || null,
      errorMessage: d && d.error && d.error.message ? String(d.error.message).slice(0, 300) : null
    });
  } catch (e) {
    return res.status(200).json({ configured: true, networkError: String(e && e.message || e).slice(0, 200) });
  }
};
