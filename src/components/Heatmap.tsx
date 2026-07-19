"use client";

import {
  addDays,
  dayOfWeek,
  diffDays,
  formatHuman,
  weekStartMonday,
} from "@/lib/time";
import { categoryMeta, CATEGORY_ORDER } from "@/lib/categories";

type HeatEntry = { date: string; category: string };

export function Heatmap({
  entries,
  today,
  restDay,
  weeks = 18,
}: {
  entries: HeatEntry[];
  today: string;
  restDay: number;
  weeks?: number;
}) {
  const map = new Map(entries.map((e) => [e.date, e.category]));
  const endWeek = weekStartMonday(today);
  const startWeek = addDays(endWeek, -(weeks - 1) * 7);

  const columns: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    const ws = addDays(startWeek, w * 7);
    columns.push(Array.from({ length: 7 }, (_, i) => addDays(ws, i)));
  }

  // Month labels: show the month abbreviation at the first column where it changes.
  const monthLabel = (col: string[], colIndex: number): string | null => {
    const first = col[0];
    const month = new Date(`${first}T00:00:00Z`).getUTCMonth();
    if (colIndex === 0) return MONTHS[month];
    const prev = columns[colIndex - 1][0];
    const prevMonth = new Date(`${prev}T00:00:00Z`).getUTCMonth();
    return month !== prevMonth ? MONTHS[month] : null;
  };

  const rowLabels = ["", "Mon", "", "Wed", "", "Fri", ""]; // rows 0..6 (Mon..Sun)

  const count = entries.filter((e) => diffDays(e.date, today) >= 0).length;

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink">History</p>
        <p className="text-xs text-ink-faint">
          {count} {count === 1 ? "entry" : "entries"} in view
        </p>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        <div className="inline-flex flex-col gap-1">
          {/* Month row */}
          <div className="flex gap-[3px] pl-7">
            {columns.map((col, i) => (
              <div key={i} className="w-3 text-[9px] leading-none text-ink-faint">
                {monthLabel(col, i)}
              </div>
            ))}
          </div>

          <div className="flex gap-[3px]">
            {/* Weekday gutter */}
            <div className="mr-1 flex w-6 flex-col gap-[3px]">
              {rowLabels.map((l, i) => (
                <div
                  key={i}
                  className="h-3 text-[8px] leading-[12px] text-ink-faint"
                >
                  {l}
                </div>
              ))}
            </div>

            {/* Week columns */}
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-[3px]">
                {col.map((date) => {
                  const cat = map.get(date);
                  const m = categoryMeta(cat);
                  const dow = dayOfWeek(date);
                  const isRest = dow === restDay;
                  const isToday = date === today;
                  const future = diffDays(today, date) > 0;

                  let style: React.CSSProperties;
                  let title: string;
                  if (cat) {
                    style = { backgroundColor: m.color };
                    title = `${formatHuman(date)} · ${m.label}`;
                  } else if (future) {
                    style = {
                      backgroundColor: "transparent",
                      boxShadow: "inset 0 0 0 1px var(--color-line)",
                    };
                    title = `${formatHuman(date)} · upcoming`;
                  } else if (isRest) {
                    style = {
                      backgroundColor: "var(--color-surface-2)",
                      boxShadow:
                        "inset 0 0 0 1px var(--color-line-strong)",
                    };
                    title = `${formatHuman(date)} · rest day`;
                  } else {
                    style = {
                      backgroundColor: "var(--color-paper-2)",
                      opacity: 0.55,
                    };
                    title = `${formatHuman(date)} · no entry`;
                  }

                  return (
                    <div
                      key={date}
                      title={title}
                      className="h-3 w-3 rounded-[3px]"
                      style={{
                        ...style,
                        boxShadow: isToday
                          ? "0 0 0 1.5px var(--color-ink)"
                          : style.boxShadow,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {CATEGORY_ORDER.map((c) => {
          const m = categoryMeta(c);
          return (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-[3px]"
                style={{ backgroundColor: m.color }}
              />
              {m.label}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{
              backgroundColor: "var(--color-surface-2)",
              boxShadow: "inset 0 0 0 1px var(--color-line-strong)",
            }}
          />
          Rest
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[3px]"
            style={{ backgroundColor: "var(--color-paper-2)", opacity: 0.55 }}
          />
          Missed
        </span>
      </div>
    </div>
  );
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
