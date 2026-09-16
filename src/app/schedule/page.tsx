"use client";

import { useEffect, useMemo, useState } from "react";
import { SCHEDULE_LIVE } from "@/data/schedule";
import { EVENT_CONFIG } from "@/config/event";
import PageHero from "@/components/common/PageHero";
import { clsx } from "clsx";

/** Parse "09:00 AM – 10:00 AM" against event day into Date range (IST). */
function parseSlotRange(day: 1 | 2, time: string): { start: Date; end: Date } | null {
  const match = time.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i
  );
  if (!match) return null;

  const to24 = (h: number, period: string) => {
    const p = period.toUpperCase();
    if (p === "AM") return h === 12 ? 0 : h;
    return h === 12 ? 12 : h + 12;
  };

  const y = 2026;
  const month = 8; // September
  const dateNum = day === 1 ? 28 : 29;
  const startH = to24(Number(match[1]), match[3]);
  const endH = to24(Number(match[4]), match[6]);
  const startM = Number(match[2]);
  const endM = Number(match[5]);

  const start = new Date(`${y}-09-${dateNum}T${String(startH).padStart(2, "0")}:${String(startM).padStart(2, "0")}:00+05:30`);
  let end = new Date(`${y}-09-${dateNum}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00+05:30`);

  // Overnight slots that end after midnight (end before start on same calendar day)
  if (end <= start) {
    const nextDay = day === 1 ? 29 : 30;
    end = new Date(`${y}-09-${String(nextDay).padStart(2, "0")}T${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}:00+05:30`);
  }

  // "10:00 AM onwards" style — handled separately
  void month;
  return { start, end };
}

function isOnwards(time: string) {
  return /onwards/i.test(time);
}

export default function SchedulePage() {
  const [day, setDay] = useState<1 | 2>(1);
  const [now, setNow] = useState(() => new Date());
  const items = useMemo(() => SCHEDULE_LIVE.filter((i) => i.day === day), [day]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const eventStart = EVENT_CONFIG.eventStart ? new Date(EVENT_CONFIG.eventStart) : null;
  const eventEnd = EVENT_CONFIG.eventEnd ? new Date(EVENT_CONFIG.eventEnd) : null;
  const isLive =
    eventStart && eventEnd ? now >= eventStart && now <= new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000) : false;

  const activeId = useMemo(() => {
    if (!isLive) return null;
    for (const item of SCHEDULE_LIVE) {
      if (isOnwards(item.time) && item.day === 2) {
        const start = new Date("2026-09-29T10:00:00+05:30");
        if (now >= start) return item.id;
        continue;
      }
      const range = parseSlotRange(item.day as 1 | 2, item.time);
      if (range && now >= range.start && now < range.end) return item.id;
    }
    return null;
  }, [isLive, now]);

  const progress = useMemo(() => {
    if (!items.length) return 0;
    const idx = items.findIndex((i) => i.id === activeId);
    if (idx < 0) return 0;
    return ((idx + 1) / items.length) * 100;
  }, [items, activeId]);

  return (
    <div className="page-shell pb-20">
      <PageHero
        pageId="SCHEDULE"
        index="03"
        title="The 24-hour"
        titleAccent="odyssey."
        description="From check-in on 28 September to awards on 29 September — every phase mapped."
      />

      <section className="content-wrap section-pad">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div className="inline-flex border border-[var(--border-primary)] self-center sm:self-start">
            {([1, 2] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(d)}
                className={clsx(
                  "min-h-11 px-6 font-mono-custom text-[10px] tracking-[0.2em] uppercase",
                  day === d
                    ? "bg-[var(--accent)] text-[var(--bg-secondary)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                DAY-{String(d).padStart(2, "0")} · SEP {d === 1 ? "28" : "29"}
              </button>
            ))}
          </div>
          {isLive ? (
            <p className="font-mono-custom text-[10px] tracking-widest uppercase text-[var(--accent)] text-center sm:text-right">
              ● Live phase tracking
            </p>
          ) : null}
        </div>

        <div className="mb-6 h-px bg-[var(--border-primary)] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="border border-[var(--border-primary)]">
          {items.map((item, idx) => {
            const current = item.id === activeId;
            return (
              <li
                key={item.id}
                className={clsx(
                  "grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-6 p-5 md:p-6 border-b border-[var(--border-primary)] last:border-b-0 transition-colors",
                  item.highlight && !current && "bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]",
                  current && "bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] border-l-2 border-l-[var(--accent)]"
                )}
              >
                <div className="md:col-span-1 font-mono-custom text-[var(--accent)] text-xs tracking-widest">
                  {String(idx + 1).padStart(2, "0")}
                </div>
                <div className="md:col-span-3 font-mono-custom text-xs text-[var(--text-muted)] tracking-wider uppercase">
                  {item.time}
                  {current ? (
                    <span className="ml-2 text-[var(--accent)]">· Now</span>
                  ) : null}
                </div>
                <div className="md:col-span-8">
                  <h2 className="font-serif text-xl text-[var(--text-primary)]">{item.title}</h2>
                  {item.description ? (
                    <p className="mt-1 text-sm text-[var(--text-muted)] leading-relaxed">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
