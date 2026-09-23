"use client";

import { useEffect, useState } from "react";
import "./RegistrationClosed.css";

const STATUSES = ["Reading capacity", "Checking seats", "Capacity reached"];

/** Closed screen. Status words rise in like a Claude loader, then the final line lands. */
export function RegistrationClosed({ checking = false }: { checking?: boolean }) {
  const [statusIndex, setStatusIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    if (checking) return;
    if (statusIndex >= STATUSES.length - 1) {
      const timer = window.setTimeout(() => setShowMessage(true), 720);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStatusIndex((index) => index + 1), 860);
    return () => window.clearTimeout(timer);
  }, [checking, statusIndex]);

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
            <p className="reg-closed__slot" aria-hidden={showMessage}>
              <span key={STATUSES[statusIndex]} className="reg-closed__status">
                {STATUSES[statusIndex]}
              </span>
            </p>

            <h1
              id="reg-closed-title"
              className={showMessage ? "reg-closed__title is-in" : "reg-closed__title"}
            >
              <span className="reg-closed__mask">
                <span className="reg-closed__in" style={{ animationDelay: "0.05s" }}>
                  Registrations
                </span>
              </span>
              <span className="reg-closed__mask">
                <span className="reg-closed__in" style={{ animationDelay: "0.28s" }}>
                  are
                </span>
              </span>
              <span className="reg-closed__mask">
                <span className="reg-closed__in" style={{ animationDelay: "0.5s" }}>
                  closed.
                </span>
              </span>
            </h1>

            <p className={showMessage ? "reg-closed__wait is-in" : "reg-closed__wait"}>
              <span className="reg-closed__mask">
                <span className="reg-closed__in" style={{ animationDelay: "0.85s" }}>
                  Wait for
                </span>
              </span>
              <span className="reg-closed__mask">
                <span
                  className="reg-closed__in reg-closed__mark"
                  style={{ animationDelay: "1.08s" }}
                >
                  AI Odyssey 2.0
                </span>
              </span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
