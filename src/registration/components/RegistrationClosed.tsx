"use client";

import "./RegistrationClosed.css";

const AI = "AI".split("");
const ODYSSEY = "ODYSSEY".split("");

/** Full title-sequence timing from the recording, with Odyssey words only. */
export function RegistrationClosed({ checking = false }: { checking?: boolean }) {
  if (checking) {
    return (
      <main className="cine odyssey-reg">
        <p className="cine__status">Checking capacity</p>
      </main>
    );
  }

  return (
    <main className="cine odyssey-reg" aria-labelledby="reg-closed-title">
      <div className="cine__eye cine__eye--intro" aria-hidden="true">
        <span className="cine__iris" />
        <span className="cine__pupil" />
        <span className="cine__catch" />
      </div>
      <div className="cine__void" aria-hidden="true" />
      <div className="cine__spark" aria-hidden="true" />
      <div className="cine__eye cine__eye--open" aria-hidden="true">
        <span className="cine__iris" />
        <span className="cine__pupil" />
        <span className="cine__catch" />
      </div>

      <p className="cine__block cine__block--ai" aria-hidden="true">
        {AI.map((char, index) => (
          <span key={char} className="cine__metal" style={{ animationDelay: `${2.9 + index * 0.1}s` }}>
            {char}
          </span>
        ))}
      </p>
      <div className="cine__burst cine__burst--a" aria-hidden="true" />

      <p className="cine__block cine__block--odyssey" aria-hidden="true">
        {ODYSSEY.map((char, index) => (
          <span key={`${char}-${index}`} className="cine__metal" style={{ animationDelay: `${4.15 + index * 0.06}s` }}>
            {char}
          </span>
        ))}
      </p>
      <div className="cine__burst cine__burst--b" aria-hidden="true" />

      <p className="cine__block cine__block--ver" aria-hidden="true">
        <span className="cine__metal" style={{ animationDelay: "5.6s" }}>
          2.0
        </span>
      </p>
      <div className="cine__burst cine__burst--c" aria-hidden="true" />

      <div className="cine__stack" aria-hidden="true">
        <span>Registrations</span>
        <span>are closed</span>
        <span>Wait for</span>
      </div>

      <div className="cine__eye cine__eye--bg" aria-hidden="true">
        <span className="cine__iris" />
        <span className="cine__pupil" />
        <span className="cine__catch" />
      </div>
      <div className="cine__flare" aria-hidden="true" />

      <div className="cine__final">
        <p className="cine__kicker">Registrations are closed</p>
        <h1 id="reg-closed-title" className="cine__title">
          Wait for
          <span>AI Odyssey 2.0</span>
        </h1>
      </div>
    </main>
  );
}
