"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const STEPS = ["00 : 00 : 00", "SIGNAL RECEIVED", "INITIALIZING // 24H MODE", "OFFICIAL LAUNCH CONTROL"];

export function CountdownTransition({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = window.setTimeout(onDone, 200);
      return () => window.clearTimeout(timer);
    }

    const timers = STEPS.map((_, index) => window.setTimeout(() => setStep(index), index * 650));
    const done = window.setTimeout(onDone, STEPS.length * 650 + 200);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#070707] px-6" role="status">
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={STEPS[step]}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="font-mono-custom text-[clamp(1.1rem,4vw,2rem)] tracking-[0.22em] uppercase text-[#f2f0eb]"
          >
            {STEPS[step]}
          </motion.p>
        </AnimatePresence>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.4, ease: [0.16, 1, 0.3, 1] }}
          className="block h-px w-full max-w-xs origin-left bg-[#ff4d1c]"
        />
      </div>
    </div>
  );
}
