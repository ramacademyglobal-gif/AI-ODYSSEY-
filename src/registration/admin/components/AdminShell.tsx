"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ROUTES } from "@/registration/admin/routes";
import { adminLogout } from "@/registration/admin/services/adminAuth";
import { BackLink } from "@/registration/admin/components/BackLink";

export type AdminExportKind = "roster" | "payments";

type Props = {
  title: string;
  subtitle: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  onExportRoster?: () => void;
  onExportPayments?: () => void;
  exporting?: boolean;
  children: ReactNode;
};

function navClass(pathname: string, href: string, exact = false) {
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return active ? "admin-dash__nav-link is-active" : "admin-dash__nav-link";
}

export function AdminShell({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  onExportRoster,
  onExportPayments,
  exporting = false,
  children,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [settled, setSettled] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportWrapRef = useRef<HTMLDivElement | null>(null);

  const showExport = Boolean(onExportRoster || onExportPayments);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!exportOpen) return;

    function onPointerDown(event: MouseEvent) {
      const el = exportWrapRef.current;
      if (el && !el.contains(event.target as Node)) {
        setExportOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setExportOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exportOpen]);

  function handleLogout() {
    adminLogout();
    router.replace(ROUTES.adminLogin);
  }

  return (
    <main className={`admin-dash${settled ? " is-settled" : ""}`}>
      <div className="admin-dash__inner">
        <div className="admin-dash__back-row">
          <BackLink to={ROUTES.home} className="back-link back-link--admin">
            Site home
          </BackLink>
        </div>

        <header className="admin-dash__header">
          <div>
            <p className="section-label">AI ODYSSEY 24</p>
            <h1>{title}</h1>
            <p className="admin-dash__subtitle">{subtitle}</p>
          </div>
          <div className="admin-dash__actions">
            {showExport ? (
              <div className="admin-dash__export" ref={exportWrapRef}>
                <button
                  className="admin-dash__primary-btn"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={exportOpen}
                  onClick={() => setExportOpen((open) => !open)}
                  disabled={exporting || refreshing}
                >
                  {exporting ? "Exporting…" : "Export"}
                </button>
                {exportOpen && !exporting ? (
                  <div className="admin-dash__export-menu" role="menu">
                    {onExportRoster ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportOpen(false);
                          onExportRoster();
                        }}
                      >
                        Roster (Excel)
                      </button>
                    ) : null}
                    {onExportPayments ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setExportOpen(false);
                          onExportPayments();
                        }}
                      >
                        Payments (Excel)
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            {onRefresh ? (
              <button
                className="admin-dash__ghost-btn"
                type="button"
                onClick={onRefresh}
                disabled={refreshing || exporting}
              >
                {refreshing ? "Refreshing…" : "Refresh"}
              </button>
            ) : null}
            <button className="nav-button" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </header>

        <nav className="admin-dash__nav" aria-label="Admin sections">
          <Link
            href={ROUTES.admin}
            className={navClass(pathname, ROUTES.admin, true)}
          >
            Dashboard
          </Link>
          <Link
            href={ROUTES.adminParticipants}
            className={navClass(pathname, ROUTES.adminParticipants)}
          >
            Participants
          </Link>
          <Link
            href={ROUTES.adminCheckin}
            className={navClass(pathname, ROUTES.adminCheckin)}
          >
            Check-in
          </Link>
        </nav>

        <div className="admin-dash__body">{children}</div>
      </div>
    </main>
  );
}
