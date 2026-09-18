"use client";

import { PassQr } from "@/registration/components/PassQr";
import { buildCheckinUrl } from "@/registration/utils/passStore";

export type DigitalHackerPassData = {
  hackerId: string
  fullName: string
  college: string
  teamName: string
  teamCode: string
  teamSize: number
  teamStatus: string
  role: 'LEADER' | 'MEMBER' | string
  qrToken: string | null
}

type DigitalHackerPassProps = {
  data: DigitalHackerPassData
  id?: string
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="hacker-pass__field">
      <span className="hacker-pass__label">{label}</span>
      <strong className="hacker-pass__value">{value || '—'}</strong>
    </div>
  )
}

export function DigitalHackerPass({
  data,
  id = 'digital-hacker-pass',
}: DigitalHackerPassProps) {
  const checkinUrl = data.qrToken ? buildCheckinUrl(data.qrToken) : null
  const roleLabel =
    data.role === 'LEADER' || data.role === 'TEAM LEADER'
      ? 'TEAM LEADER'
      : 'TEAM MEMBER'
  const status = (data.teamStatus || 'WAITING').toUpperCase()
  const statusTone =
    status === 'COMPLETE' || status === 'FULL' ? 'live' : 'wait'
  const serial = (data.qrToken || data.hackerId || 'ODYSSEY')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .toUpperCase()

  return (
    <article className="hacker-pass" id={id} aria-label="Digital Hacker Pass">
      <div className="hacker-pass__glow" aria-hidden="true" />
      <div className="hacker-pass__glow hacker-pass__glow--alt" aria-hidden="true" />
      <div className="hacker-pass__grid" aria-hidden="true" />
      <div className="hacker-pass__orbit" aria-hidden="true" />
      <div className="hacker-pass__watermark" aria-hidden="true">
        24
      </div>
      <div className="hacker-pass__perforation" aria-hidden="true" />

      <header className="hacker-pass__top">
        <div className="hacker-pass__brand-block">
          <img
            className="hacker-pass__logo"
            src="/ai-odyssey-24-logo.png"
            alt="AI Odyssey"
            width={96}
            height={96}
            decoding="sync"
          />
          <div className="hacker-pass__brand-text">
            <p className="hacker-pass__eyebrow">
              <span className="hacker-pass__pulse" aria-hidden="true" />
              Official Credential
            </p>
            <p className="hacker-pass__serial">AUTH · {serial || 'PENDING'}</p>
          </div>
        </div>
        <div className="hacker-pass__chip">DIGITAL HACKER PASS</div>
      </header>

      <div className="hacker-pass__body">
        <div className="hacker-pass__identity">
          <p className="hacker-pass__label">Hacker ID</p>
          <p className="hacker-pass__hacker-id">{data.hackerId || '—'}</p>
          <p className="hacker-pass__name">{data.fullName || '—'}</p>
          <p className="hacker-pass__college">{data.college || '—'}</p>

          <div className="hacker-pass__meta">
            <Field label="Team" value={data.teamName} />
            <Field label="Team Code" value={data.teamCode} />
            <Field
              label="Squad Size"
              value={data.teamSize ? `${data.teamSize} members` : '—'}
            />
            <Field label="Role" value={roleLabel} />
          </div>

          <div className={`hacker-pass__status hacker-pass__status--${statusTone}`}>
            <span className="hacker-pass__status-dot" aria-hidden="true" />
            {status}
          </div>
        </div>

        <aside className="hacker-pass__qr-panel">
          <div className="hacker-pass__qr-ring" aria-hidden="true" />
          <div className="hacker-pass__qr-frame">
            <span className="hacker-pass__corner hacker-pass__corner--tl" />
            <span className="hacker-pass__corner hacker-pass__corner--tr" />
            <span className="hacker-pass__corner hacker-pass__corner--bl" />
            <span className="hacker-pass__corner hacker-pass__corner--br" />
            {checkinUrl ? (
              <PassQr
                value={checkinUrl}
                size={148}
                className="hacker-pass__qr-img"
                alt="Secure check-in QR"
              />
            ) : (
              <div className="hacker-pass__qr-missing">
                QR
                <small>Unavailable</small>
              </div>
            )}
          </div>
          <p className="hacker-pass__qr-caption">Secure Check-in</p>
          {!data.qrToken ? (
            <p className="hacker-pass__qr-note">
              Backend qr_token required for verification QR.
            </p>
          ) : (
            <p className="hacker-pass__qr-hint">Scan at entry gate</p>
          )}
        </aside>
      </div>

      <footer className="hacker-pass__footer">
        <span>24 HOURS</span>
        <span className="hacker-pass__footer-sep" aria-hidden="true" />
        <span>BUILD</span>
        <span className="hacker-pass__footer-sep" aria-hidden="true" />
        <span>SHIP</span>
      </footer>
    </article>
  )
}
