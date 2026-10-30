module.exports = async function handler(req, res) {
  if (req.method !== "GET" || req.query.token !== "n8M3pY7vQ2xL5cA1dF9hJ4sK6wR0bT3z") {
    return res.status(404).json({ ok: false });
  }
  try {
    const host = req.headers.host;
    const r = await fetch("https://" + host + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", text: "Reply with the single word OK." }] })
    });
    const data = await r.json().catch(() => ({}));
    return res.status(200).json({
      chatStatus: r.status,
      gotAnswer: typeof data.answer === "string" && data.answer.trim().length > 0,
      answerPreview: typeof data.answer === "string" ? data.answer.slice(0, 60) : null,
      error: typeof data.error === "string" ? data.error.slice(0, 300) : null
    });
  } catch (e) {
    return res.status(200).json({ fetchError: String(e && e.message || e).slice(0, 200) });
  }
};
