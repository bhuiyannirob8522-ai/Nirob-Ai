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
      body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with the single word OK." }] }] })
    });
    const d = await r.json().catch(() => ({}));
    return res.status(200).json({
      configured: true,
      providerStatus: r.status,
      accepted: r.ok,
      errorStatus: d && d.error && d.error.status || null,
      errorMessage: d && d.error && d.error.message ? String(d.error.message).slice(0, 300) : null,
      hasText: !!(d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts)
    });
  } catch (e) {
    return res.status(200).json({ configured: true, networkError: String(e && e.message || e).slice(0, 200) });
  }
};
