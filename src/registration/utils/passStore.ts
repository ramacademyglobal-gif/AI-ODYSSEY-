import type { ApiParticipant, ApiTeam } from "@/registration/services/api";

export type PassMemberSnapshot = {
  participant_id: string
  hacker_id: string
  full_name: string
  role: 'LEADER' | 'MEMBER'
  checked_in: boolean
  checked_in_at: string | null
}

export type PassSnapshot = {
  qr_token: string
  participant: {
    id: string
    hacker_id: string
    full_name: string
    email: string
    college?: string
    status: string
  }
  team: {
    team_code: string
    team_name: string
    team_size: number
    member_count: number
    status: string
  } | null
  role?: 'LEADER' | 'MEMBER' | null
  members: PassMemberSnapshot[]
  saved_at: string
}

export type CompletedRegistration = {
  participant: ApiParticipant
  team: ApiTeam
  role: 'LEADER' | 'MEMBER'
  saved_at: string
}

const PASS_PREFIX = 'odyssey-pass:'
const COMPLETED_KEY = 'odyssey-registration-complete'

export function savePassSnapshot(pass: PassSnapshot): void {
  try {
    localStorage.setItem(`${PASS_PREFIX}${pass.qr_token}`, JSON.stringify(pass))
  } catch {
    // ignore quota / private mode
  }
}

export function loadPassSnapshot(qrToken: string): PassSnapshot | null {
  try {
    const raw = localStorage.getItem(`${PASS_PREFIX}${qrToken}`)
    if (!raw) return null
    return JSON.parse(raw) as PassSnapshot
  } catch {
    return null
  }
}

export function saveCompletedRegistration(data: CompletedRegistration): void {
  try {
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(data))
  } catch {
    // ignore
  }
}

export function loadCompletedRegistration(): CompletedRegistration | null {
  try {
    const raw = localStorage.getItem(COMPLETED_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CompletedRegistration
  } catch {
    return null
  }
}

export function clearCompletedRegistration(): void {
  try {
    localStorage.removeItem(COMPLETED_KEY)
  } catch {
    // ignore
  }
}

export function buildCheckinUrl(qrToken: string): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  return `${origin}/checkin/${encodeURIComponent(qrToken)}`
}

export type HackerPassDownloadData = {
  hackerId: string
  fullName: string
  college: string
  teamName: string
  teamCode: string
  teamSize: number
  teamStatus: string
  role: string
  qrToken: string | null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Dark-theme Digital Hacker Pass HTML (matches on-screen credential). */
export async function buildHackerPassHtml(
  data: HackerPassDownloadData,
): Promise<string> {
  const roleLabel =
    data.role === 'LEADER' || data.role === 'TEAM LEADER'
      ? 'TEAM LEADER'
      : 'TEAM MEMBER'
  const checkinUrl = data.qrToken ? buildCheckinUrl(data.qrToken) : ''
  const status = (data.teamStatus || 'WAITING').toUpperCase()
  const statusLive = status === 'COMPLETE' || status === 'FULL'

  let logoImg =
    '<div class="logo-fallback">AI ODYSSEY 24</div>'
  try {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : ''
    const logoRes = await fetch(`${origin}/ai-odyssey-24-logo.png`)
    if (logoRes.ok) {
      const blob = await logoRes.blob()
      const logoUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('logo read failed'))
        reader.readAsDataURL(blob)
      })
      logoImg = `<img class="logo" src="${logoUrl}" width="96" height="96" alt="AI Odyssey 24" />`
    }
  } catch {
    // keep text fallback
  }

  let qrImg = ''
  if (checkinUrl) {
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(checkinUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 280,
        color: { dark: '#08090d', light: '#ffffff' },
      })
      qrImg = `<img class="qr-img" src="${dataUrl}" width="148" height="148" alt="Secure check-in QR" />`
    } catch {
      qrImg = '<div class="qr-fallback">SCAN</div>'
    }
  } else {
    qrImg =
      '<div class="qr-fallback">QR<br/><small>Unavailable</small></div>'
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>AI ODYSSEY 24 — ${escapeHtml(data.hackerId || 'Hacker Pass')}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --accent: #d4af37;
      --bg: #0a1628;
      --text: #f4f5f7;
      --muted: #8b90a0;
    }
    * { box-sizing: border-box; }
    html, body { margin: 0; }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 28px 16px;
      font-family: 'EB Garamond', 'Source Serif 4', Georgia, serif;
      font-size: clamp(1rem, 1.1vw, 1.125rem);
      color: var(--text);
      background: #06101f;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .pass {
      position: relative;
      width: min(720px, 100%);
      overflow: hidden;
      border: 1px solid rgba(212,175,55,0.22);
      background:
        linear-gradient(145deg, rgba(212,175,55,0.06), transparent 42%),
        linear-gradient(180deg, #0d1017, var(--bg));
      box-shadow: 0 24px 60px rgba(0,0,0,0.45);
    }
    .pass::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 4px;
      background: linear-gradient(180deg, transparent, var(--accent) 20%, var(--accent) 80%, transparent);
    }
    .top {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 28px 28px 18px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .eyebrow {
      margin: 0 0 6px;
      font-size: 10px;
      letter-spacing: 0.28em;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 700;
    }
    .brand {
      margin: 0;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      font-size: clamp(1.6rem, 4vw, 2.15rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--accent);
    }
    .chip {
      align-self: flex-start;
      padding: 8px 12px;
      border: 1px solid rgba(212,175,55,0.35);
      background: rgba(212,175,55,0.08);
      color: var(--accent);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.18em;
    }
    .brand-row {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }
    .logo {
      display: block;
      width: 96px;
      height: auto;
      object-fit: contain;
      flex-shrink: 0;
      padding: 8px;
      border-radius: 14px;
      background: #f4efe4;
      border: 1px solid rgba(212, 175, 55, 0.28);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
    }
    .logo-fallback {
      width: 96px;
      padding: 10px 8px;
      border-radius: 14px;
      border: 1px solid rgba(212,175,55,0.28);
      background: #f4efe4;
      color: #0a1628;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      font-size: 12px;
      font-weight: 700;
      text-align: center;
      flex-shrink: 0;
    }
    .brand {
      display: none;
    }
    .body {
      display: grid;
      grid-template-columns: 1.35fr 0.85fr;
      gap: 28px;
      padding: 28px;
    }
    .label {
      display: block;
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .hacker-id {
      margin: 4px 0 14px;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: var(--text);
    }
    .name {
      margin: 0;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text);
    }
    .college { margin: 4px 0 0; color: var(--muted); }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px 18px;
      margin-top: 26px;
      padding-top: 22px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .value { font-weight: 700; word-break: break-word; color: var(--text); }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 22px;
      padding: 8px 12px;
      border: 1px solid ${statusLive ? 'rgba(212,175,55,0.4)' : 'rgba(255,255,255,0.12)'};
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.16em;
      color: ${statusLive ? 'var(--accent)' : '#c9ceda'};
      background: rgba(255,255,255,0.03);
    }
    .status-dot {
      width: 7px; height: 7px; border-radius: 50%; background: currentColor;
    }
    .qr-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 18px 14px;
      background: rgba(0,0,0,0.28);
      border: 1px solid rgba(255,255,255,0.08);
      text-align: center;
    }
    .qr-frame { position: relative; background: #fff; padding: 14px; }
    .corner {
      position: absolute; width: 14px; height: 14px;
      border: 2px solid var(--accent);
    }
    .corner.tl { top: -2px; left: -2px; border-right: none; border-bottom: none; }
    .corner.tr { top: -2px; right: -2px; border-left: none; border-bottom: none; }
    .corner.bl { bottom: -2px; left: -2px; border-right: none; border-top: none; }
    .corner.br { bottom: -2px; right: -2px; border-left: none; border-top: none; }
    .qr-img { display: block; width: 148px; height: 148px; }
    .qr-fallback {
      display: grid; place-items: center; width: 148px; height: 148px;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-weight: 800; font-size: 1.4rem; color: #111;
    }
    .qr-fallback small {
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 10px;
      letter-spacing: 0.12em; text-transform: uppercase; color: #666;
    }
    .caption {
      margin: 0; font-size: 10px; font-weight: 800;
      letter-spacing: 0.2em; text-transform: uppercase; color: var(--accent);
    }
    .hint {
      margin: 0; font-size: 12px; color: var(--muted);
    }
    .foot {
      display: flex; justify-content: center; gap: 14px;
      padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06);
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; font-size: 11px; font-weight: 700;
      letter-spacing: 0.28em; color: var(--accent);
    }
    .dot {
      width: 4px; height: 4px; border-radius: 50%;
      background: rgba(212,175,55,0.55); align-self: center;
    }
    @media (max-width: 700px) {
      .body { grid-template-columns: 1fr; }
      .top { flex-direction: column; }
    }
  </style>
</head>
<body>
  <article class="pass" id="pass-root">
    <header class="top">
      <div class="brand-row">
        ${logoImg}
        <div>
          <p class="eyebrow">Official Credential</p>
        </div>
      </div>
      <div class="chip">DIGITAL HACKER PASS</div>
    </header>
    <div class="body">
      <div>
        <span class="label">Hacker ID</span>
        <p class="hacker-id">${escapeHtml(data.hackerId)}</p>
        <p class="name">${escapeHtml(data.fullName)}</p>
        <p class="college">${escapeHtml(data.college)}</p>
        <div class="meta">
          <div><span class="label">Team</span><div class="value">${escapeHtml(data.teamName)}</div></div>
          <div><span class="label">Team Code</span><div class="value">${escapeHtml(data.teamCode)}</div></div>
          <div><span class="label">Squad Size</span><div class="value">${data.teamSize} members</div></div>
          <div><span class="label">Role</span><div class="value">${roleLabel}</div></div>
        </div>
        <div class="status"><span class="status-dot"></span>${escapeHtml(status)}</div>
      </div>
      <aside class="qr-panel">
        <div class="qr-frame">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          ${qrImg}
        </div>
        <p class="caption">Secure Check-in</p>
        ${
          checkinUrl
            ? '<p class="hint">Scan at entry gate</p>'
            : '<p class="hint">QR unavailable</p>'
        }
      </aside>
    </div>
    <footer class="foot">
      <span>24 HOURS</span><span class="dot"></span>
      <span>BUILD</span><span class="dot"></span>
      <span>SHIP</span>
    </footer>
  </article>
</body>
</html>`
}

/** Capture the on-screen pass and export a clean A4 landscape PDF. */
export async function downloadHackerPassPdf(
  data: HackerPassDownloadData,
  passElementId = 'digital-hacker-pass',
): Promise<void> {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const fileBase = `AI-ODYSSEY-24-${data.hackerId || 'pass'}`

  // Always capture from a fixed-width offscreen host so mobile CSS never
  // collapses the credential into a stacked layout inside the PDF.
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;width:760px;pointer-events:none;z-index:-1;'

  const existing = document.getElementById(passElementId)
  let target: HTMLElement

  if (existing) {
    const clone = existing.cloneNode(true) as HTMLElement
    clone.id = `${passElementId}-pdf-clone`
    clone.classList.add('hacker-pass--pdf')
    clone.style.margin = '0'
    clone.style.maxWidth = '760px'
    clone.style.width = '760px'
    clone.style.boxShadow = 'none'
    clone.style.animation = 'none'
    host.appendChild(clone)
    target = clone
  } else {
    const html = await buildHackerPassHtml(data)
    host.innerHTML = html
    const passRoot =
      host.querySelector<HTMLElement>('#pass-root') ??
      host.querySelector<HTMLElement>('.hacker-pass') ??
      host.querySelector<HTMLElement>('.pass')
    if (!passRoot) {
      throw new Error('Unable to build hacker pass for PDF export.')
    }
    passRoot.classList.add('hacker-pass--pdf')
    target = passRoot
  }

  document.body.appendChild(host)

  try {
    const images = Array.from(target.querySelectorAll('img'))
    await Promise.all(
      images.map(
        (img) =>
          img.complete && img.naturalWidth > 0
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.addEventListener('load', () => resolve(), { once: true })
                img.addEventListener('error', () => resolve(), { once: true })
              }),
      ),
    )
    // Let QR / logo paint settle before rasterizing.
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve())
    })

    const canvas = await html2canvas(target, {
      scale: 3,
      backgroundColor: '#0b0616',
      useCORS: true,
      allowTaint: true,
      logging: false,
      // Force desktop media-query evaluation while capturing.
      windowWidth: 1200,
      windowHeight: 900,
      onclone: (clonedDoc, el) => {
        el.classList.add('hacker-pass--pdf')
        el.style.animation = 'none'
        el.style.margin = '0'
        el.style.width = '760px'
        el.style.maxWidth = '760px'
        el.style.boxShadow = 'none'
        el.style.transform = 'none'

        const body = el.querySelector<HTMLElement>('.hacker-pass__body')
        if (body) {
          body.style.display = 'grid'
          body.style.gridTemplateColumns = '1.35fr 0.85fr'
          body.style.gap = '28px'
        }
        const top = el.querySelector<HTMLElement>('.hacker-pass__top')
        if (top) {
          top.style.flexDirection = 'row'
          top.style.alignItems = 'flex-start'
        }

        // Solid text colors — gradient clipped text often vanishes in html2canvas.
        el.querySelectorAll<HTMLElement>(
          '.hacker-pass__brand, .hacker-pass__name',
        ).forEach((node) => {
          node.style.background = 'none'
          node.style.webkitBackgroundClip = 'unset'
          node.style.backgroundClip = 'unset'
          node.style.color = '#ffffff'
          node.style.webkitTextFillColor = '#ffffff'
        })

        el.querySelectorAll<HTMLElement>('*').forEach((node) => {
          node.style.animation = 'none'
          node.style.transition = 'none'
        })

        // Ensure images in the clone keep absolute URLs for CORS.
        clonedDoc.querySelectorAll('img').forEach((img) => {
          const src = img.getAttribute('src')
          if (src && src.startsWith('/')) {
            img.setAttribute('src', `${window.location.origin}${src}`)
          }
        })
      },
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.96)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    pdf.setProperties({
      title: `AI ODYSSEY 24 — ${data.hackerId || 'Hacker Pass'}`,
      subject: 'Official Digital Hacker Pass',
      author: 'AI Odyssey 24',
      keywords: 'ai odyssey, hacker pass, check-in',
    })

    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()

    // Single clean page: Odyssey dark background + centered pass only.
    pdf.setFillColor(11, 6, 22)
    pdf.rect(0, 0, pageW, pageH, 'F')

    const marginX = 10
    const marginY = 10
    const maxW = pageW - marginX * 2
    const maxH = pageH - marginY * 2
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
    const w = canvas.width * ratio
    const h = canvas.height * ratio
    const x = (pageW - w) / 2
    const y = (pageH - h) / 2

    pdf.addImage(imgData, 'JPEG', x, y, w, h, undefined, 'FAST')
    pdf.save(`${fileBase}.pdf`)
  } finally {
    host.remove()
  }
}

/** @deprecated Prefer downloadHackerPassPdf */
export async function downloadHackerPassHtml(
  data: HackerPassDownloadData,
): Promise<void> {
  return downloadHackerPassPdf(data)
}

export function buildPassSnapshotFromRegistration(
  data: CompletedRegistration,
): PassSnapshot | null {
  const qrToken = data.participant.qr_token?.trim()
  if (!qrToken) return null

  return {
    qr_token: qrToken,
    participant: {
      id: data.participant.id,
      hacker_id: data.participant.hacker_id,
      full_name: data.participant.full_name,
      email: data.participant.email,
      college: data.participant.college,
      status: data.participant.status,
    },
    team: {
      team_code: data.team.team_code,
      team_name: data.team.team_name,
      team_size: data.team.team_size,
      member_count: data.team.member_count,
      status: data.team.status,
    },
    role: data.role,
    members: data.team.members.map((m) => ({
      participant_id: m.participant_id,
      hacker_id: m.hacker_id,
      full_name: m.full_name,
      role: m.role,
      checked_in: false,
      checked_in_at: null,
    })),
    saved_at: data.saved_at,
  }
}
