"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import "./HallDisplay.css";

const BOARDS = [
  {
    name: "Raam Academy",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/company/raamacademyglobal/" },
      { label: "Instagram", href: "https://www.instagram.com/raam_academy/" },
    ],
  },
  {
    name: "Ramco Institute of Technology",
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/school/ramco-institute-of-technology/" },
      { label: "Instagram", href: "https://www.instagram.com/ritrajapalayam/" },
    ],
  },
] as const;

function FlipCard({ digit }: { digit: string }) {
  return (
    <span className="flip-card">
      <span className="flip-card__half flip-card__half--top">
        <span>{digit}</span>
      </span>
      <span className="flip-card__half flip-card__half--bottom">
        <span>{digit}</span>
      </span>
      <span key={digit} className="flip-card__leaf" aria-hidden="true">
        <span>{digit}</span>
      </span>
    </span>
  );
}

function FlipGroup({ value, label }: { value: string; label: string }) {
  const digits = value.padStart(2, "0").slice(-2).split("");
  return (
    <div className="hall-group">
      <div className="hall-group__digits">
        {digits.map((digit, index) => (
          <FlipCard key={`${label}-${index}`} digit={digit} />
        ))}
      </div>
      <span className="hall-group__label">{label}</span>
    </div>
  );
}

function SocialCode({ label, href }: { label: string; href: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void QRCode.toDataURL(href, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 640,
      color: { dark: "#070707", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancel) setSrc(url);
      })
      .catch(() => {
        if (!cancel) setSrc(null);
      });
    return () => {
      cancel = true;
    };
  }, [href]);

  return (
    <a className="hall-code" href={href} target="_blank" rel="noreferrer">
      {src ? (
        <img src={src} alt={`${label} QR code`} />
      ) : (
        <span className="hall-code__fallback">QR</span>
      )}
      <span>{label}</span>
    </a>
  );
}

export function HallClock({
  hours,
  minutes,
  seconds,
  status,
}: {
  hours: number;
  minutes: number;
  seconds: number;
  status: string;
}) {
  return (
    <div className="hall" aria-label="AI Odyssey 24-hour timer">
      <p className="hall__status">{status}</p>
      <div className="hall__clock">
        <FlipGroup value={String(hours)} label="Hours" />
        <span className="hall__colon" aria-hidden="true">
          :
        </span>
        <FlipGroup value={String(minutes)} label="Minutes" />
        <span className="hall__colon" aria-hidden="true">
          :
        </span>
        <FlipGroup value={String(seconds)} label="Seconds" />
      </div>
      <p className="hall__sr" aria-live="polite">
        {`${hours} hours ${minutes} minutes ${seconds} seconds`}
      </p>
      <div className="hall__boards">
        {BOARDS.map((board) => (
          <div key={board.name}>
            <p className="hall-board__name">{board.name}</p>
            <div className="hall-board__codes">
              {board.links.map((link) => (
                <SocialCode key={link.href} label={link.label} href={link.href} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
