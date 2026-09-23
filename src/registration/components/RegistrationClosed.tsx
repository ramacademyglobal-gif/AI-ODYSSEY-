"use client";

import "./RegistrationClosed.css";

/** Closed-registration screen. Motion only — colors and type stay on the site tokens. */
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
            <p className="reg-closed__status">Capacity reached</p>
            <h1 id="reg-closed-title" className="reg-closed__title">
              Registrations are closed.
            </h1>
            <p className="reg-closed__wait">
              Wait for <span className="reg-closed__mark">AI Odyssey 2.0</span>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
