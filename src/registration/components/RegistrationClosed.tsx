"use client";

import "./RegistrationClosed.css";

/** Closed screen. Title turns in on the Z/X axis, then settles. Site colors and type stay. */
export function RegistrationClosed({ checking = false }: { checking?: boolean }) {
  return (
    <main className="reg-closed odyssey-reg" aria-labelledby="reg-closed-title">
      <div className="reg-closed__stage">
        <div className="reg-closed__plate reg-closed__plate--mark" aria-hidden="true">
          <span className="reg-closed__ring" />
          <span className="reg-closed__core" />
        </div>

        {checking ? (
          <p className="reg-closed__status">Checking capacity</p>
        ) : (
          <>
            <p className="reg-closed__status reg-closed__plate reg-closed__plate--status">
              Capacity reached
            </p>
            <h1
              id="reg-closed-title"
              className="reg-closed__title reg-closed__plate reg-closed__plate--title"
            >
              Registrations are closed.
            </h1>
            <p className="reg-closed__wait reg-closed__plate reg-closed__plate--wait">
              Wait for <span className="reg-closed__mark">AI Odyssey 2.0</span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
