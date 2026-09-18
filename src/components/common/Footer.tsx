import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import { EVENT_CONFIG } from "@/config/event";

const QUICK_LINKS = [
  { href: "/about", label: "ABOUT" },
  { href: "/challenges", label: "CHALLENGES" },
  { href: "/schedule", label: "SCHEDULE" },
  { href: "/register", label: "REGISTER" },
  { href: "/rules", label: "RULES" },
  { href: "/prizes", label: "PRIZES" },
  { href: "/venue", label: "VENUE" },
];

const ADDRESS_LINES = [
  "Ayyanar Kovil Rd, Venganallur, Rajapalayam",
  "Vadakku Venganallur, Tamil Nadu 626117, India",
];

const ADDRESS_QUERY =
  "Ayyanar Kovil Rd, Venganallur, Rajapalayam, Vadakku Venganallur, Tamil Nadu 626117";

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS_QUERY)}`;

const PHONE_DISPLAY = "+91 86102 84917";
const PHONE_TEL = "tel:+918610284917";
const EMAIL = "ramacademy.global@gmail.com";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 10.5V16M8 8v.01M12 16v-3.5a2 2 0 0 1 4 0V16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const SOCIAL = [
  {
    label: "Instagram",
    href: EVENT_CONFIG.socialLinks.instagram!,
    Icon: InstagramIcon,
  },
  {
    label: "LinkedIn",
    href: EVENT_CONFIG.socialLinks.linkedin!,
    Icon: LinkedInIcon,
  },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <div className="content-wrap py-10 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-8">
          <div className="md:col-span-4 space-y-3">
            <p className="font-display text-2xl md:text-3xl font-light tracking-[0.12em] uppercase text-[var(--text-primary)]">
              AI ODYSSEY 24
            </p>
            <p className="font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[var(--text-muted)] leading-relaxed max-w-sm">
              {EVENT_CONFIG.tagline}
            </p>
            <p className="font-mono-custom text-[10px] tracking-[0.16em] uppercase text-[var(--text-muted)] pt-1">
              28–29 September 2026
              <br />
              {EVENT_CONFIG.venueName}, {EVENT_CONFIG.city}
            </p>
          </div>

          <div className="md:col-span-5 lg:col-span-5 space-y-4 min-w-0">
            <p className="font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[var(--accent)]">
              Contact
            </p>

            <a
              href={MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open venue address in Google Maps"
              className="group grid grid-cols-[1rem_1fr] gap-x-3 gap-y-0.5 items-start text-left min-h-11 transition-colors duration-250"
            >
              <MapPin
                className="w-4 h-4 mt-0.5 shrink-0 text-[var(--accent)] group-hover:brightness-110 col-start-1 row-span-2"
                aria-hidden
              />
              {ADDRESS_LINES.map((line) => (
                <span
                  key={line}
                  className="col-start-2 font-mono-custom text-[11px] sm:text-xs leading-[1.55] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-250"
                >
                  {line}
                </span>
              ))}
            </a>

            <a
              href={PHONE_TEL}
              aria-label={`Call ${PHONE_DISPLAY}`}
              className="group flex gap-3 items-center min-h-11 transition-colors duration-250"
            >
              <Phone
                className="w-4 h-4 shrink-0 text-[var(--accent)] group-hover:brightness-110"
                aria-hidden
              />
              <span className="font-mono-custom text-[11px] sm:text-xs tracking-wide text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-250">
                {PHONE_DISPLAY}
              </span>
            </a>

            <a
              href={`mailto:${EMAIL}`}
              aria-label={`Email ${EMAIL}`}
              className="group flex gap-3 items-center min-h-11 transition-colors duration-250"
            >
              <Mail
                className="w-4 h-4 shrink-0 text-[var(--accent)] group-hover:brightness-110"
                aria-hidden
              />
              <span className="font-mono-custom text-[11px] sm:text-xs tracking-wide text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors duration-250 break-all">
                {EMAIL}
              </span>
            </a>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="font-mono-custom text-[10px] tracking-[0.22em] uppercase text-[var(--accent)]">
              Follow the Odyssey
            </p>
            <ul className="space-y-2">
              {SOCIAL.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-2.5 min-h-11 font-mono-custom text-[11px] tracking-[0.16em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors duration-250"
                    aria-label={`Open ${label}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 text-[var(--accent)]" />
                    <span>{label}</span>
                    <span className="transition-transform duration-250 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-[var(--border-primary)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="font-mono-custom text-[9px] tracking-[0.16em] uppercase text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <p className="font-mono-custom text-[10px] tracking-wider uppercase text-[var(--text-muted)]">
            © {year} {EVENT_CONFIG.eventName}
          </p>
        </div>
      </div>
    </footer>
  );
}
