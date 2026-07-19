import type { Category } from "./categories";
import { normalizeCategory } from "./categories";

export type Categorization = {
  category: Category;
  summary: string;
};

/**
 * Lightweight, dependency-free categorizer used as the graceful fallback
 * whenever the AI call is unavailable, fails, or times out.
 *
 * The product's non-negotiable is that the user never loses their input to an
 * AI failure. This local heuristic keeps entries feeling sorted even with no
 * API key — and only degrades to "uncategorized" when the text is empty.
 */
const KEYWORDS: Record<Exclude<Category, "uncategorized">, string[]> = {
  study: [
    "study", "read", "reading", "book", "lecture", "course", "class", "exam",
    "revise", "revision", "homework", "assignment", "paper", "research",
    "learn", "learning", "notes", "flashcard", "tutorial", "lesson", "quiz",
    "test", "math", "calculus", "physics", "chemistry", "biology", "history",
    "essay", "thesis", "certificate", "duolingo", "khan",
  ],
  skill: [
    "practice", "practise", "build", "code", "coding", "program", "programming",
    "project", "ship", "design", "draw", "drawing", "paint", "music", "guitar",
    "piano", "write", "writing", "draft", "prototype", "gym", "train", "drill",
    "rehearse", "edit", "deploy", "refactor", "github", "portfolio", "compose",
    "sketch", "craft", "workshop", "typing",
  ],
  health: [
    "run", "running", "walk", "walking", "gym", "workout", "exercise", "yoga",
    "stretch", "sleep", "meditate", "meditation", "stretch", "bike", "cycle",
    "swim", "swimming", "hike", "lift", "weights", "pushup", "push-up",
    "calisthenics", "cook", "meal", "water", "hydrate", "rest", "breathe",
    "jog", "treadmill", "steps", "diet", "eat", "salad",
  ],
  other: [
    "email", "emails", "inbox", "admin", "errand", "clean", "laundry", "grocery",
    "groceries", "call", "call mom", "family", "friends", "plan", "organize",
    "journal", "garden", "fix", "pay bills", "declutter",
  ],
};

function scoreText(text: string): Partial<Record<Category, number>> {
  const lower = ` ${text.toLowerCase()} `;
  const scores: Partial<Record<Category, number>> = {};
  (Object.keys(KEYWORDS) as Array<Exclude<Category, "uncategorized">>).forEach(
    (cat) => {
      let score = 0;
      for (const kw of KEYWORDS[cat]) {
        if (lower.includes(kw)) score += kw.length > 5 ? 2 : 1;
      }
      if (score) scores[cat] = score;
    },
  );
  return scores;
}

function bestCategory(
  scores: Partial<Record<Category, number>>,
): Category | null {
  let best: Category | null = null;
  let bestScore = 0;
  for (const cat of Object.keys(scores) as Category[]) {
    const s = scores[cat] ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = cat;
    }
  }
  return best;
}

/** Produce a calm, short summary from raw text (max ~64 chars). */
export function summarizeText(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "No description";
  if (clean.length <= 64) return clean;
  const cut = clean.slice(0, 61);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

export function localCategorize(rawText: string): Categorization {
  const text = rawText.trim();
  if (!text) {
    return { category: "uncategorized", summary: "No description" };
  }
  const scores = scoreText(text);
  const best = bestCategory(scores);
  return {
    category: best ?? "other",
    summary: summarizeText(text),
  };
}

/** Parse the (possibly messy) JSON an LLM returns into a clean categorization. */
export function parseAiJson(raw: string, fallbackText: string): Categorization {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("no json object");
    const obj = JSON.parse(cleaned.slice(start, end + 1));
    const category = normalizeCategory(obj?.category ?? obj?.type);
    const summary = summarizeText(
      String(obj?.short_description ?? obj?.summary ?? fallbackText),
    );
    return { category, summary };
  } catch {
    // Malformed JSON — degrade gracefully, never block.
    return localCategorize(fallbackText);
  }
}
