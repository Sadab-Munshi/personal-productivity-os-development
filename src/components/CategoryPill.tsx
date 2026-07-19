import { categoryMeta } from "@/lib/categories";

export function CategoryPill({
  category,
  className = "",
}: {
  category: string;
  className?: string;
}) {
  const m = categoryMeta(category);
  return (
    <span
      style={{
        backgroundColor: m.soft,
        color: m.color,
        borderColor: m.border,
      }}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      <span aria-hidden="true">
        {m.emoji}
      </span>
      {m.label}
    </span>
  );
}
