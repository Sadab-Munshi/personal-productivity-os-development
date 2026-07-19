import type { Categorization } from "./categorize";
import { parseAiJson } from "./categorize";

/**
 * Calls OpenRouter (model `tencent/hy3:free` per spec) server-side only.
 * The API key is read from the environment and never shipped to the client.
 *
 * Returns `null` on any failure (no key, network error, timeout, bad JSON) so
 * the caller can fall back to the local categorizer — the user's entry is
 * never blocked by an AI failure.
 */
export async function aiCategorize(rawText: string): Promise<Categorization | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "tencent/hy3:free";

  if (!apiKey) return null; // No key configured — use local fallback.

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter recommends these for ranking/attributing the app.
        "HTTP-Referer": process.env.OPENROUTER_REFERER || "https://steady.app",
        "X-Title": "Steady",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 120,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You categorize a single short daily intention into exactly one category. " +
              'Respond ONLY with compact JSON: {"category": "study"|"skill"|"health"|"other", "short_description": "string"}. ' +
              "Categories: study = learning/reading/revision; skill = building/practicing a craft or project; " +
              "health = movement/sleep/rest/nutrition; other = admin/chores/social/planning. " +
              "short_description must be a calm phrase (max 6 words) restating the intention.",
          },
          { role: "user", content: rawText.slice(0, 500) },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return parseAiJson(content, rawText);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
