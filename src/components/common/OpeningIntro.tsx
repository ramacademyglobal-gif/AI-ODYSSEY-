"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const TITLE = "AI ODYSSEY";
const LETTERS = TITLE.split("");

/**
 * First-load cinematic entry — text-mask / wipe choreography.
 * Mounted in root layout: plays on full load/refresh only.
 */
export default function OpeningIntro() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      body.style.overflow = prevBody;
    };
  }, [visible]);

  useEffect(() => {
    const duration = reduceMotion ? 400 : 3200;
    const id = window.setTimeout(() => setVisible(false), duration);
    return () => window.clearTimeout(id);
  }, [reduceMotion]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="opening-intro"
          className="fixed inset-0 z-[10000] flex h-[100dvh] min-h-[100vh] w-screen items-center justify-center overflow-hidden bg-[#070707]"
          style={{ willChange: "clip-path, opacity" }}
          initial={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          animate={
            reduceMotion
              ? { opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }
              : {
                  opacity: 1,
                  clipPath: [
                    "inset(0% 0% 0% 0%)",
                    "inset(0% 0% 0% 0%)",
                    "inset(50% 0% 50% 0%)",
                  ],
                }
          }
          exit={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, clipPath: "inset(50% 0% 50% 0%)" }
          }
          transition={
            reduceMotion
              ? { duration: 0.35, ease: EASE }
              : {
                  clipPath: {
                    duration: 3.2,
                    times: [0, 0.72, 1],
                    ease: EASE_OUT,
                  },
                  opacity: { duration: 0.25, delay: 3.0 },
                }
          }
          aria-hidden="true"
        >
          {/* Soft orange bloom — extremely subtle */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(ellipse 55% 40% at 50% 48%, rgba(255,77,28,0.12), transparent 70%)",
            }}
          />

          <div className="pointer-events-none relative z-10 flex w-full max-w-[94vw] flex-col items-center px-4 text-center">
            {/* Sweep line */}
            <motion.div
              className="mb-7 h-px origin-center bg-[var(--accent)]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                reduceMotion
                  ? { scaleX: 1, opacity: 0.7, width: 56 }
                  : {
                      scaleX: [0, 1, 1, 0],
                      opacity: [0, 1, 1, 0],
                      width: [0, 88, 88, 0],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.2 }
                  : {
                      duration: 2.6,
                      times: [0, 0.18, 0.78, 1],
                      ease: EASE,
                      delay: 0.08,
                    }
              }
              style={{ width: 88 }}
            />

            <motion.p
              className="mb-5 font-mono-custom text-[10px] uppercase tracking-[0.42em] text-[var(--text-muted)]"
              initial={{ opacity: 0, y: 12 }}
              animate={
                reduceMotion
                  ? { opacity: 0.75, y: 0 }
                  : { opacity: [0, 1, 1, 0], y: [12, 0, 0, -10] }
              }
              transition={
                reduceMotion
                  ? { duration: 0.25 }
                  : {
                      duration: 2.7,
                      times: [0, 0.22, 0.75, 1],
                      ease: EASE,
                      delay: 0.2,
                    }
              }
            >
              AI ODYSSEY 24
            </motion.p>

            {/* Masked letter rise — AE-style text reveal */}
            <motion.h1
              className="flex flex-wrap items-baseline justify-center font-display text-[clamp(2.4rem,10vw,5.75rem)] font-light uppercase leading-none tracking-[-0.02em]"
              initial={{ scale: 1.08 }}
              animate={
                reduceMotion
                  ? { scale: 1 }
                  : { scale: [1.08, 1, 1, 1.04] }
              }
              transition={
                reduceMotion
                  ? { duration: 0.3, ease: EASE }
                  : {
                      duration: 2.9,
                      times: [0, 0.35, 0.78, 1],
                      ease: EASE_OUT,
                      delay: 0.15,
                    }
              }
            >
              {LETTERS.map((char, i) => (
                <span
                  key={`${char}-${i}`}
                  className="relative inline-block overflow-hidden align-baseline"
                  style={{
                    marginRight: char === " " ? "0.22em" : undefined,
                    width: char === " " ? "0.22em" : undefined,
                  }}
                >
                  {char === " " ? (
                    <span className="inline-block w-[0.22em]">&nbsp;</span>
                  ) : (
                    <motion.span
                      className="origin-gradient-text inline-block"
                      initial={{ y: "110%", opacity: 0 }}
                      animate={
                        reduceMotion
                          ? { y: "0%", opacity: 1 }
                          : {
                              y: ["110%", "0%", "0%", "-8%"],
                              opacity: [0, 1, 1, 0],
                            }
                      }
                      transition={
                        reduceMotion
                          ? { duration: 0.25, delay: i * 0.02 }
                          : {
                              duration: 2.55,
                              times: [0, 0.22, 0.78, 1],
                              ease: EASE_OUT,
                              delay: 0.28 + i * 0.045,
                            }
                      }
                    >
                      {char}
                    </motion.span>
                  )}
                </span>
              ))}
            </motion.h1>

            {/* Horizontal wipe under title */}
            <motion.div
              className="mt-6 h-px w-full max-w-[min(28rem,70vw)] origin-left bg-[color-mix(in_srgb,var(--accent)_55%,transparent)]"
              initial={{ scaleX: 0, opacity: 0 }}
              animate={
                reduceMotion
                  ? { scaleX: 1, opacity: 0.5 }
                  : { scaleX: [0, 1, 1, 0], opacity: [0, 0.7, 0.7, 0] }
              }
              transition={
                reduceMotion
                  ? { duration: 0.25, delay: 0.1 }
                  : {
                      duration: 2.4,
                      times: [0, 0.3, 0.78, 1],
                      ease: EASE,
                      delay: 0.85,
                    }
              }
            />

            <motion.p
              className="mt-5 max-w-sm font-mono-custom text-[9px] uppercase tracking-[0.28em] text-[var(--text-muted)] sm:text-[10px]"
              initial={{ opacity: 0, y: 14, clipPath: "inset(0 0 100% 0)" }}
              animate={
                reduceMotion
                  ? { opacity: 0.7, y: 0, clipPath: "inset(0 0 0% 0)" }
                  : {
                      opacity: [0, 0.9, 0.9, 0],
                      y: [14, 0, 0, -8],
                      clipPath: [
                        "inset(0 0 100% 0)",
                        "inset(0 0 0% 0)",
                        "inset(0 0 0% 0)",
                        "inset(100% 0 0% 0)",
                      ],
                    }
              }
              transition={
                reduceMotion
                  ? { duration: 0.25, delay: 0.08 }
                  : {
                      duration: 2.2,
                      times: [0, 0.28, 0.75, 1],
                      ease: EASE,
                      delay: 1.0,
                    }
              }
            >
              24 HOURS. ONE MISSION.
              <br />
              INFINITE AI POSSIBILITIES.
            </motion.p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
