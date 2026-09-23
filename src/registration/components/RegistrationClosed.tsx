"use client";

import "./RegistrationClosed.css";

const STATUS = "CAPACITY REACHED";
const TITLE = ["Registrations", "are", "closed."];
const WAIT = ["Wait", "for"];
const NEXT = ["AI", "Odyssey", "2.0"];

function Word({
  text,
  delay,
  accent = false,
}: {
  text: string;
  delay: number;
  accent?: boolean;
}) {
  return (
    <span className="reg-closed__mask">
      <span
        className={accent ? "reg-closed__in reg-closed__mark" : "reg-closed__in"}
        style={{ animationDelay: `${delay}s` }}
      >
        {text}
      </span>
    </span>
  );
}

/** Closed-registration screen. Words arrive in sequence; colors and type stay on the site tokens. */
export function RegistrationClosed({ checking = false }: { checking?: boolean }) {
  return (
    <main className="reg-closed odyssey-reg" aria-labelledby="reg-closed-title">
      <div className="reg-closed__stage">
        <div className="reg-closed__loader" aria-hidden="true">
          <span className="reg-closed__ring" />
          <span className="reg-closed__arc" />
          <span className="reg-closed__core" />
        </div>
        {checking ? (
          <p className="reg-closed__status">Checking capacity</p>
        ) : (
          <>
            <p className="reg-closed__status" aria-hidden="true">
              {STATUS.split("").map((char, index) => (
                <span
                  key={`${char}-${index}`}
                  className="reg-closed__letter"
                  style={{ animationDelay: `${0.15 + index * 0.045}s` }}
                >
                  {char === " " ? "\u00a0" : char}
                </span>
              ))}
            </p>
            <h1 id="reg-closed-title" className="reg-closed__title">
              {TITLE.map((word, index) => (
                <Word key={word} text={word} delay={1.15 + index * 0.28} />
              ))}
            </h1>
            <p className="reg-closed__wait">
              {WAIT.map((word, index) => (
                <Word key={word} text={word} delay={2.15 + index * 0.18} />
              ))}
              {NEXT.map((word, index) => (
                <Word key={word} text={word} delay={2.55 + index * 0.16} accent />
              ))}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
