"use client";

import { type FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CountdownUnits, remainingHms } from "@/components/common/EventCountdown";
import { useHackathonClock } from "@/components/hackathon/HackathonClockProvider";
import { ClockRequestError, authorizeJury, startOfficialWindow } from "@/hackathon/officialClock";

const buttonClass =
  "inline-flex w-full max-w-sm items-center justify-center font-mono-custom text-xs tracking-[0.22em] uppercase min-h-11 px-5 py-3 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--bg-secondary)] transition-colors disabled:cursor-wait disabled:opacity-50 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2";

function LiveReadout({ endIso, nowMs }: { endIso: string; nowMs: number }) {
  const left = remainingHms(endIso, nowMs);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-mono-custom text-[9px] tracking-[0.3em] uppercase text-[#8A8A8A]">
        AI Odyssey // Live
      </p>
      <CountdownUnits
        units={[
          { value: left.hours, label: "Hrs" },
          { value: left.minutes, label: "Min" },
          { value: left.seconds, label: "Sec" },
        ]}
      />
      <p className="font-mono-custom text-[9px] tracking-[0.3em] uppercase text-[#8A8A8A]">
        Official 24-hour build window
      </p>
    </div>
  );
}

function EndedReadout() {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="label-tech">AI Odyssey 24</p>
      <h2 className="font-serif text-3xl text-[var(--text-primary)] md:text-5xl">Mission complete</h2>
      <CountdownUnits
        units={[
          { value: 0, label: "Hrs" },
          { value: 0, label: "Min" },
          { value: 0, label: "Sec" },
        ]}
      />
      <p className="font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[#8A8A8A]">
        The 24-hour Odyssey has ended.
      </p>
    </div>
  );
}

const LAUNCH_STEPS = ["3", "2", "1", "ODYSSEY BEGINS"];
function LaunchSequence({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const timer = window.setTimeout(onDone, 400);
      return () => window.clearTimeout(timer);
    }
    const timers = LAUNCH_STEPS.map((_, index) => window.setTimeout(() => setStep(index), index * 700));
    const done = window.setTimeout(onDone, LAUNCH_STEPS.length * 700 + 200);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#070707] px-6" role="status">
      <AnimatePresence mode="wait">
        <motion.p
          key={LAUNCH_STEPS[step]}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="font-mono-custom text-[clamp(2rem,8vw,4.5rem)] tracking-[0.18em] uppercase text-[#ff4d1c]"
        >
          {LAUNCH_STEPS[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function ConfirmStart({
  busy,
  onCancel,
  onConfirm,
}: {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const titleId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="odyssey-card w-full max-w-md p-6 text-center sm:p-8"
      >
        <p className="label-tech">Official launch</p>
        <h2 id={titleId} className="mt-3 font-serif text-3xl text-[var(--text-primary)]">
          Start the official 24-hour window?
        </h2>
        <p className="mt-4 font-mono-custom text-[10px] tracking-[0.16em] uppercase leading-6 text-[#8A8A8A]">
          The official timer will begin immediately. Once started, all participants will see the same countdown.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button ref={cancelRef} type="button" className={buttonClass} onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={buttonClass} onClick={onConfirm} disabled={busy}>
            {busy ? "Starting..." : "Start now"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function OfficialLaunchSection() {
  const { phase, clock, officialNow, adopt, preview } = useHackathonClock();
  const codeId = useId();
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState("");
  const [authorizing, setAuthorizing] = useState(false);
  const [launchToken, setLaunchToken] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sequence, setSequence] = useState(false);
  const [previewEnd, setPreviewEnd] = useState<string | null>(null);
  const finishSequence = useCallback(() => setSequence(false), []);
  const closeConfirm = useCallback(() => {
    if (!starting) setConfirming(false);
  }, [starting]);

  const practice = preview && phase !== "live" && phase !== "ended";
  if (phase === "pre" && !practice) return null;

  const submitCode = async (event: FormEvent) => {
    event.preventDefault();
    if (authorizing) return;
    setAuthorizing(true);
    setNotice("");
    try {
      const token = await authorizeJury(code);
      setLaunchToken(token);
      setCode("");
      setNotice("");
    } catch (err) {
      setLaunchToken(null);
      if (err instanceof ClockRequestError && err.status === 429) {
        setNotice("Try again later");
      } else {
        setNotice("Access denied");
      }
    } finally {
      setAuthorizing(false);
    }
  };

  const confirmStart = async () => {
    if (!launchToken || starting) return;
    setStarting(true);
    setNotice("");
    if (practice) {
      setPreviewEnd(new Date(officialNow + 24 * 60 * 60 * 1000).toISOString());
      setLaunchToken(null);
      setConfirming(false);
      setSequence(true);
      setStarting(false);
      return;
    }
    try {
      const result = await startOfficialWindow(launchToken);
      adopt(result.clock);
      setLaunchToken(null);
      setConfirming(false);
      if (!result.alreadyStarted) setSequence(true);
    } catch {
      setNotice("Unable to start. Please try again.");
    } finally {
      setStarting(false);
    }
  };

  return (
    <section id="official-launch" className="content-wrap section-pad scroll-mt-24">
      <div className="odyssey-card mx-auto max-w-3xl px-5 py-10 text-center sm:px-10 md:py-14">
        {practice ? (
          <p className="mb-6 font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[#ff4d1c]">
            Preview only. This does not start the official clock.
          </p>
        ) : null}

        {phase === "syncing" && !practice ? (
          <p className="font-mono-custom text-[10px] tracking-[0.3em] uppercase text-[#8A8A8A]">
            Syncing official timer...
          </p>
        ) : null}

        {phase === "ended" ? <EndedReadout /> : null}

        {phase === "live" && clock?.officialEndTime ? (
          <LiveReadout endIso={clock.officialEndTime} nowMs={officialNow} />
        ) : null}

        {practice && previewEnd ? <LiveReadout endIso={previewEnd} nowMs={officialNow} /> : null}

        {(phase === "awaiting" || (practice && !previewEnd)) ? (
          <div className="mx-auto flex max-w-md flex-col items-center">
            <p className="label-tech">System // AI Odyssey 24</p>
            <h2 className="mt-3 font-serif text-3xl text-[var(--text-primary)] md:text-5xl">
              {launchToken ? "Access granted" : "Official launch control"}
            </h2>
            <p className="mt-6 inline-flex items-center gap-2 font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[#ff4d1c]">
              <span className="h-2 w-2 rounded-full bg-[#ff4d1c]" aria-hidden="true" />
              {launchToken ? "Ready to launch" : "Awaiting jury authorization"}
            </p>
            <p className="mt-4 font-mono-custom text-[10px] tracking-[0.14em] uppercase leading-6 text-[#8A8A8A]">
              The 24-hour build window has not started yet.
            </p>

            {launchToken ? (
              <button type="button" className={`${buttonClass} mt-8`} onClick={() => setConfirming(true)}>
                Start 24-hour Odyssey
              </button>
            ) : (
              <form className="mt-8 w-full" onSubmit={submitCode}>
                <label
                  htmlFor={codeId}
                  className="mb-3 block font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[#8A8A8A]"
                >
                  Access code
                </label>
                <input
                  id={codeId}
                  type="password"
                  autoComplete="off"
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  className="mb-4 w-full border border-[var(--border-primary)] bg-transparent px-4 py-3 text-center font-mono-custom tracking-[0.2em] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)] min-h-11"
                />
                <button type="submit" className={buttonClass} disabled={authorizing || code.trim().length === 0}>
                  {authorizing ? "Authorizing..." : "Authorize"}
                </button>
              </form>
            )}

            {notice ? (
              <p className="mt-4 font-mono-custom text-[10px] tracking-[0.18em] uppercase text-[#ff4d1c]" role="status">
                {notice}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {confirming ? (
        <ConfirmStart busy={starting} onCancel={closeConfirm} onConfirm={() => void confirmStart()} />
      ) : null}
      {sequence ? <LaunchSequence onDone={finishSequence} /> : null}
    </section>
  );
}
