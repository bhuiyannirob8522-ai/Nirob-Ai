# Nirob AI

A Bengali-first AI chat app powered by the Gemini API.

## Run locally

1. Install Node.js and the Vercel CLI.
2. In this project folder, create a local environment file named `.env.local` with:

```bash
GEMINI_API_KEY=your_new_gemini_api_key
```

3. Run:

```bash
vercel dev
```

Open the local URL printed by Vercel.

## Deploy

Import this GitHub repository into Vercel. In the Vercel project settings, add the environment variable `GEMINI_API_KEY` (Production, Preview, and Development as needed), then redeploy.

The API key is intentionally not stored in this repository or the browser. Never commit `.env.local`.

## Model

The server endpoint uses `gemini-3.8-flash` through Google's Gemini `generateContent` API. Change `GEMINI_MODEL` in the Vercel environment if you want to select another compatible model.

## Notes

- Chat history is stored in the current browser's local storage.
- Voice typing uses the browser's Speech Recognition support and may require microphone permission.
- Read-aloud uses the browser's Speech Synthesis voices.
- This is a starter personal app. For a public multi-user deployment, add authentication, usage limits, and abuse protection before sharing it widely.
