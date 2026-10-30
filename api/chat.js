const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "শুধু POST request গ্রহণ করা হয়।" });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: "Gemini API key সেট করা নেই। Vercel Project Settings → Environment Variables-এ GEMINI_API_KEY যোগ করো, তারপর redeploy করো।"
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
      return res.status(400).json({ error: "একটি user message পাঠাও।" });
    }

    const response = await fetch(
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
              text: "তোমার নাম Nirob AI। তুমি একজন সহায়ক, নির্ভুল ও বন্ধুসুলভ বাংলা AI সহকারী। ব্যবহারকারী বাংলায় বা Banglish-এ লিখলে স্বাভাবিক বাংলায় উত্তর দেবে। ব্যবহারকারী ইংরেজিতে লিখলে প্রয়োজনে ইংরেজিতে উত্তর দেবে। সহজ ভাষায়, পরিষ্কারভাবে এবং প্রশ্নের সঙ্গে প্রাসঙ্গিক উত্তর দেবে। তথ্য নিশ্চিত না হলে অনিশ্চয়তা জানাবে; কখনো তথ্য বানিয়ে বলবে না।"
            }]
          },
          contents: messages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const googleMessage = data && data.error && data.error.message;
      const safeMessage = response.status === 429
        ? "Gemini API-এর quota বা rate limit শেষ হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করো।"
        : response.status === 401 || response.status === 403
          ? "Gemini API key গ্রহণ করা হয়নি। Vercel-এ সঠিক GEMINI_API_KEY আছে কি না এবং Google AI Studio-তে key/API restriction ঠিক আছে কি না যাচাই করো।"
          : "Gemini API থেকে উত্তর পাওয়া যায়নি। আবার চেষ্টা করো।";
      console.error("Gemini API error:", response.status, googleMessage || "No details");
      return res.status(response.status === 429 ? 429 : 502).json({ error: safeMessage });
    }

    const answer = (data.candidates && data.candidates[0] &&
      data.candidates[0].content && data.candidates[0].content.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "AI কোনো text উত্তর দেয়নি। আবার প্রশ্ন করো।" });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Nirob AI handler error:", error);
    return res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে। আবার চেষ্টা করো।" });
  }
};
