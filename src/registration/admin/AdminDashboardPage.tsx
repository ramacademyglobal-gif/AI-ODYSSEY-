"use client";

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AdminRecentRegistrations,
  AdminSummaryCards,
  AdminTeamStatusOverview,
} from '@/registration/admin/components'
import { AdminShell } from '@/registration/admin/components/'
import { ROUTES } from '@/registration/admin/routes'
import { ApiError } from '@/registration/services/api'
import { adminLogout } from '@/registration/admin/services/adminAuth'
import {
  fetchDashboardRecent,
  fetchDashboardStats,
  type DashboardRecent,
  type DashboardStats,
} from '@/registration/admin/services/adminDashboard'
import {
  downloadPaymentsExcel,
  downloadRosterExcel,
} from '@/registration/admin/services/adminExport'
import { useRevealOnScroll } from '@/registration/hooks/useRevealOnScroll'
import '@/registration/admin/styles/admin.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      stats: DashboardStats
      recent: DashboardRecent
    }

async function loadDashboardData(): Promise<{
  stats: DashboardStats
  recent: DashboardRecent
}> {
  const [stats, recent] = await Promise.all([
    fetchDashboardStats(),
    fetchDashboardRecent(20),
  ])
  return { stats, recent }
}

export function AdminDashboardPage() {
  const router = useRouter()
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [reloadToken, setReloadToken] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  useRevealOnScroll([state.status])

  useEffect(() => {
    let cancelled = false

    void loadDashboardData()
      .then((data) => {
        if (!cancelled) {
          setState({ status: 'ready', ...data })
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return

        if (err instanceof ApiError && err.status === 401) {
          adminLogout()
          router.replace(ROUTES.adminLogin)
          return
        }

        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to load dashboard data.'
        setState({ status: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [router, reloadToken])

  useEffect(() => {
    if (state.status !== 'ready') return
    if (window.location.hash !== '#crew-status') return
    const el = document.getElementById('crew-status')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [state.status])

  function handleRefresh() {
    setState({ status: 'loading' })
    setExportError(null)
    setReloadToken((value) => value + 1)
  }

  async function handleExport(kind: 'roster' | 'payments') {
    setExportError(null)
    setExporting(true)
    try {
      if (kind === 'roster') {
        await downloadRosterExcel()
      } else {
        await downloadPaymentsExcel()
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        adminLogout()
        router.replace(ROUTES.adminLogin)
        return
      }
      setExportError(
        err instanceof ApiError
          ? err.message
          : kind === 'roster'
            ? 'Failed to export roster. Please try again.'
            : 'Failed to export payments. Please try again.',
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminShell
      title="Admin Dashboard"
      subtitle="Live registration and team overview for organizers."
      onRefresh={handleRefresh}
      refreshing={state.status === 'loading'}
      onExportRoster={() => void handleExport('roster')}
      onExportPayments={() => void handleExport('payments')}
      exporting={exporting}
    >
      {exportError ? (
        <p className="admin-dash__status admin-dash__status--error" role="alert">
          {exportError}
        </p>
      ) : null}

      {state.status === 'loading' ? (
        <p className="admin-dash__status" role="status">
          Loading dashboard…
        </p>
      ) : null}

      {state.status === 'error' ? (
        <div className="admin-dash__status admin-dash__status--error" role="alert">
          <p>{state.message}</p>
          <button
            className="primary-button"
            type="button"
            onClick={handleRefresh}
          >
            Try again
          </button>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className="admin-dash__grid" data-reveal>
          <AdminSummaryCards summary={state.stats.summary} />
          <AdminTeamStatusOverview teams={state.stats.team_status} />
          <AdminRecentRegistrations
            registrations={state.recent.registrations}
          />
        </div>
      ) : null}
    </AdminShell>
  )
}
