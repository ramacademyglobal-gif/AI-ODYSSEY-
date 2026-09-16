"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import type { Challenge } from "@/types";

interface ChallengeModalProps {
  challenge: Challenge | null;
  onClose: () => void;
}

export default function ChallengeModal({ challenge, onClose }: ChallengeModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const description =
    challenge?.problemStatement || challenge?.description || "";

  useEffect(() => {
    if (!challenge) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // Defer focus so the dialog is in the DOM
    const t = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
      window.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
      restoreFocusRef.current = null;
    };
  }, [challenge, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {challenge ? (
        <motion.div
          className="challenge-modal-root fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            type="button"
            aria-label="Close dialog backdrop"
            className="challenge-modal-backdrop absolute inset-0"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="modal-orange-frame relative z-[9999] flex w-[min(680px,calc(100vw-24px))] sm:w-[min(680px,calc(100vw-48px))] max-h-[85vh] flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-orange-frame__inner flex min-h-0 max-h-[85vh] flex-col overflow-hidden bg-[#111111]">
              <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-primary)] px-4 py-3.5 sm:px-5">
                <p className="font-mono-custom pt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--accent)]">
                  Problem Statement {"//"}{" "}
                  {challenge.sector.replace(" Sector", "")}
                </p>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  className="font-mono-custom min-h-9 shrink-0 px-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--accent)]"
                  aria-label="Close"
                >
                  ESC
                </button>
              </header>

              <div className="challenge-modal-scroll min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
                <div className="space-y-5">
                  <div>
                    <h2
                      id={titleId}
                      className="font-serif text-[1.625rem] leading-tight text-[var(--text-primary)] sm:text-[2rem] md:text-[2.125rem]"
                    >
                      {challenge.title}
                    </h2>
                    <p className="mt-2.5 font-mono-custom text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                      MISSION-{String(challenge.number).padStart(2, "0")} ·{" "}
                      {challenge.category} ·{" "}
                      {challenge.sector.replace(" Sector", "")}
                    </p>
                  </div>

                  <div className="h-px w-full bg-[var(--border-primary)]" />

                  <div>
                    <p className="mb-2.5 font-mono-custom text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
                      Problem description
                    </p>
                    <p className="text-[15px] leading-[1.65] text-[var(--text-secondary)] whitespace-pre-line sm:text-base">
                      {description}
                    </p>
                  </div>

                  {challenge.shortDescription ? (
                    <div>
                      <p className="mb-2.5 font-mono-custom text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
                        Summary
                      </p>
                      <p className="text-[15px] leading-[1.65] text-[var(--text-muted)] sm:text-base">
                        {challenge.shortDescription}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              <footer className="flex shrink-0 justify-end border-t border-[var(--border-primary)] px-4 py-3.5 sm:px-5">
                <button
                  type="button"
                  onClick={onClose}
                  className="font-mono-custom min-h-10 border border-[var(--border-primary)] px-5 text-xs uppercase tracking-widest text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  Close
                </button>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
