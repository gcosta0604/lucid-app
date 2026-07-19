// /api/gemini.js
// Vercel serverless function — proxies to Google's Gemini API so the API key
// never reaches the browser. Set GEMINI_API_KEY in Vercel project settings
// (Settings → Environment Variables), then redeploy.
//
// The client sends requests shaped like Anthropic's Messages API (this proxy
// used to call Claude) — translating that shape into Gemini's generateContent
// format here means src/App.jsx doesn't need to change at all.

const MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

function toGeminiRole(role) {
  return role === "assistant" || role === "ai" ? "model" : "user";
}

// Anthropic-style content is either a plain string or an array of blocks:
// {type:"text", text} or {type:"document", source:{type:"base64", media_type, data}}.
function toGeminiParts(content) {
  if (typeof content === "string") return [{ text: content }];
  return content.map(block => {
    if (block.type === "document") {
      return { inline_data: { mime_type: block.source.media_type, data: block.source.data } };
    }
    return { text: block.text || "" };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY" });
    return;
  }

  const { system, messages, max_tokens } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "messages is required" });
    return;
  }

  let contents = messages.map(m => ({
    role: toGeminiRole(m.role),
    parts: toGeminiParts(m.content),
  }));

  // Gemini requires the first turn to come from the user — drop any leading
  // assistant turn (e.g. the app's canned greeting) instead of erroring.
  const firstUserIdx = contents.findIndex(c => c.role === "user");
  contents = firstUserIdx > 0 ? contents.slice(firstUserIdx) : contents;

  const body = {
    contents,
    generationConfig: {
      maxOutputTokens: max_tokens || 1000,
      // gemini-2.5-flash spends part of maxOutputTokens on internal "thinking"
      // before it writes the visible answer — with a modest token budget that
      // can eat the whole response and cut it short. This app wants fast,
      // concise replies, not deep reasoning, so thinking is switched off.
      thinkingConfig: { thinkingBudget: 0 },
    },
  };
  if (system) body.systemInstruction = { parts: [{ text: system }] };

  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      res.status(geminiRes.status).json({ error: data?.error?.message || "Gemini API error" });
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
    res.status(200).json({ content: [{ text }] });
  } catch {
    res.status(502).json({ error: "Failed to reach Gemini API" });
  }
}
