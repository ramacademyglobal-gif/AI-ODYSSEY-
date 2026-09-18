"use client";

const ITEMS = [
  { tag: "TIMELINE", text: "24 HOURS OF BUILD", highlight: true },
  { tag: "CHALLENGES", text: "10 PROBLEM STATEMENTS", highlight: false },
  { tag: "DATES", text: "28–29 SEPTEMBER 2026", highlight: true },
  { tag: "VENUE", text: "RAMCO INSTITUTE OF TECHNOLOGY", highlight: true },
  { tag: "CITY", text: "RAJAPALAYAM · TAMIL NADU", highlight: false },
  { tag: "MISSION", text: "ONE MISSION. INFINITE POSSIBILITIES.", highlight: true },
  { tag: "TEAMS", text: "3–4 MEMBER TEAMS", highlight: false },
  { tag: "REGISTER", text: "IN-SITE REGISTRATION OPEN", highlight: true },
];

export default function InfiniteTicker() {
  const loop = [...ITEMS, ...ITEMS];

  return (
    <section className="relative overflow-hidden py-4 sm:py-5 bg-[#040813] border-y border-[#C5A15A]/25 text-white">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A15A]/10 to-transparent pointer-events-none footer-streak" />
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-[#040813] to-transparent z-10" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-[#040813] to-transparent z-10" />

      <div className="animate-infinite-scroll flex items-center gap-8 sm:gap-12 select-none">
        {loop.map((item, idx) => (
          <div key={`${item.text}-${idx}`} className="flex items-center gap-3 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A15A] animate-pulse" />
            <span className="text-[10px] tracking-[0.2em] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-[#E3C984] border border-white/10 font-medium">
              {item.tag}
            </span>
            <span
              className={`text-xs sm:text-sm tracking-[0.16em] uppercase font-extrabold ${
                item.highlight ? "text-white" : "text-slate-400"
              }`}
            >
              {item.text}
            </span>
            <span className="text-white/25 text-xs font-mono">•</span>
          </div>
        ))}
      </div>
    </section>
  );
}
