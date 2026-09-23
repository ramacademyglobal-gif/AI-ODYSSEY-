"use client";

import "./RegistrationClosed.css";

const HERO = "AI ODYSSEY".split("");

/** Closed screen. Cinematic 3D title motion, with Odyssey words only. */
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
      <div className="cine__spark" aria-hidden="true" />
      <div className="cine__burst" aria-hidden="true" />
      <div className="cine__flare" aria-hidden="true" />

      <p className="cine__hero" aria-hidden="true">
        {HERO.map((char, index) => (
          <span
            key={`${char}-${index}`}
            className="cine__letter"
            style={{ animationDelay: `${0.55 + index * 0.07}s` }}
          >
            {char === " " ? "\u00a0" : char}
          </span>
        ))}
      </p>

      <p className="cine__version" aria-hidden="true">
        2.0
      </p>

      <div className="cine__lock">
        <p className="cine__kicker">Registrations are closed</p>
        <h1 id="reg-closed-title" className="cine__title">
          Wait for <span>AI Odyssey 2.0</span>
        </h1>
      </div>
    </main>
  );
}
