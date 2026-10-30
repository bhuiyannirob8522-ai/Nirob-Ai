# Nirob AI

Nirob AI is a personal AI chat assistant with an English interface and support for Bangla, Banglish, and English conversations.

## Features

- Responsive chat interface with light and dark themes
- Conversation history saved in the browser
- Voice input and read-aloud support, depending on browser capabilities
- Server-side AI requests so the API key is not exposed in the browser

## Local development

1. Install Node.js and the Vercel CLI.
2. Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_api_key
```

3. Start the local development server:

```bash
vercel dev
```

## Deployment

Import this repository into Vercel. Add `GEMINI_API_KEY` as a sensitive environment variable for Production, Preview, and Development, then redeploy.

Never put the API key in `index.html`, commit it to GitHub, or share it publicly.

The server currently uses the stable `gemini-3.8-flash` model. The model is an implementation detail and is not shown in the app interface.

## Notes

- Chat history is saved in the current browser's local storage.
- Voice typing and read-aloud depend on available browser speech features.
- Before making the app public to many users, add authentication, request limits, and abuse protection.
