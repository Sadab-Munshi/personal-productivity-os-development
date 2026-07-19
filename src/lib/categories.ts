export type Category =
  | "study"
  | "skill"
  | "health"
  | "other"
  | "uncategorized";

export const CATEGORY_ORDER: Category[] = [
  "study",
  "skill",
  "health",
  "other",
];

type Meta = {
  label: string;
  /** Solid accent color for pills, FAB tints, etc. */
  color: string;
  /** Low-intensity tint used in the heatmap / soft backgrounds. */
  soft: string;
  /** Border tone. */
  border: string;
  emoji: string;
  blurb: string;
};

export const CATEGORY_META: Record<Category, Meta> = {
  study: {
    label: "Study",
    color: "#5b7c99",
    soft: "#dde7ef",
    border: "#c4d4e0",
    emoji: "📖",
    blurb: "Learning something new",
  },
  skill: {
    label: "Skill",
    color: "#b0823f",
    soft: "#f1e6d2",
    border: "#e2cca7",
    emoji: "🛠️",
    blurb: "Practicing a craft",
  },
  health: {
    label: "Health",
    color: "#5f8a63",
    soft: "#dfece0",
    border: "#c2d8c4",
    emoji: "🌱",
    blurb: "Movement, rest, fuel",
  },
  other: {
    label: "Other",
    color: "#8b7aa8",
    soft: "#e7e1ef",
    border: "#d3c7df",
    emoji: "✶",
    blurb: "Something else",
  },
  uncategorized: {
    label: "Uncategorized",
    color: "#9b978c",
    soft: "#ece8df",
    border: "#dbd5c8",
    emoji: "•",
    blurb: "Not yet sorted",
  },
};

export function categoryMeta(c: string | null | undefined): Meta {
  if (c && c in CATEGORY_META) return CATEGORY_META[c as Category];
  return CATEGORY_META.uncategorized;
}

export function isCategory(c: string | null | undefined): c is Category {
  return !!c && c in CATEGORY_META;
}

export function normalizeCategory(c: unknown): Category {
  return isCategory(c as string) ? (c as Category) : "uncategorized";
}
