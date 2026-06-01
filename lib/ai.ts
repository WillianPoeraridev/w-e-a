import { env } from "./env";

const MODEL = "gemini-2.0-flash";

/** Whether the AI features are enabled (a free Gemini key is configured). */
export function aiEnabled(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

/**
 * One-shot call to Google Gemini (free tier) via the REST API — no SDK.
 * Returns the model's text, or null when disabled/on any error (callers fall
 * back to deterministic logic). The API key stays server-side.
 */
export async function gemini(
  prompt: string,
  opts: { system?: string; temperature?: number; maxTokens?: number } = {},
): Promise<string | null> {
  const key = env.GEMINI_API_KEY;
  if (!key) return null;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    ...(opts.system
      ? { systemInstruction: { parts: [{ text: opts.system }] } }
      : {}),
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxTokens ?? 600,
    },
  };

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim();
    return text || null;
  } catch {
    return null;
  }
}
