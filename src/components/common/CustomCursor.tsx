"use client";

import { useEffect, useState } from "react";

export default function CustomCursor() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const onMove = (e: MouseEvent) => {
      if (!fine.matches || reduce.matches) return;
      setActive(true);
      setPos({ x: e.clientX, y: e.clientY });
    };

    const onOver = (e: MouseEvent) => {
      if (!fine.matches || reduce.matches) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const interactive = t.closest("a, button, [data-cursor='interactive']");
      setHover(Boolean(interactive));
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="custom-cursor-root pointer-events-none fixed inset-0 z-[100] hidden md:block" aria-hidden>
      <div
        className="absolute rounded-full border border-[var(--accent)] transition-[width,height,background-color,opacity] duration-150"
        style={{
          left: pos.x,
          top: pos.y,
          width: hover ? 36 : 10,
          height: hover ? 36 : 10,
          transform: "translate(-50%, -50%)",
          background: hover ? "transparent" : "var(--accent)",
          opacity: hover ? 0.9 : 0.75,
          mixBlendMode: "difference",
        }}
      />
    </div>
  );
}
