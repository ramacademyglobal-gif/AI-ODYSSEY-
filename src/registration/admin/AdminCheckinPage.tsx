"use client";

import { useCallback, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AdminShell } from '@/registration/admin/components/'
import { AdminQrScanner } from '@/registration/admin/components/'
import { ROUTES } from '@/registration/admin/routes'
import { ApiError } from '@/registration/services/api'
import { adminLogout } from '@/registration/admin/services/adminAuth'
import {
  extractQrToken,
  scanAdminCheckin,
  submitAdminCheckin,
  type CheckinScanResult,
} from '@/registration/admin/services/adminCheckin'
import '@/registration/admin/styles/admin.css'

type ScanState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string; code?: string }
  | { status: 'ready'; data: CheckinScanResult; token: string }
  | {
      status: 'success'
      data: CheckinScanResult
      token: string
      already: boolean
    }

function formatCheckinTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function roleLabel(role: string): string {
  return role === 'LEADER' ? 'TEAM LEADER' : 'MEMBER'
}

export function AdminCheckinPage() {
  const router = useRouter()
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  const [manualValue, setManualValue] = useState('')
  const [checkingIn, setCheckingIn] = useState(false)
  const [pauseScanner, setPauseScanner] = useState(false)

  const handleUnauthorized = useCallback(() => {
    adminLogout()
    router.replace(ROUTES.adminLogin)
  }, [router])

  const lookupToken = useCallback(
    async (raw: string) => {
      const token = extractQrToken(raw)
      if (!token) {
        setState({
          status: 'error',
          message: 'Invalid QR. Expected a Digital Hacker Pass check-in code.',
          code: 'INVALID_QR',
        })
        return
      }

      setPauseScanner(true)
      setState({ status: 'loading' })

      try {
        const data = await scanAdminCheckin(token)
        setState({ status: 'ready', data, token })
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized()
          return
        }
        const code = err instanceof ApiError ? err.code : undefined
        const message =
          err instanceof ApiError
            ? err.message
            : 'Failed to look up this QR code.'
        setState({ status: 'error', message, code })
      } finally {
        setPauseScanner(false)
      }
    },
    [handleUnauthorized],
  )

  function handleManualSubmit(event: FormEvent) {
    event.preventDefault()
    void lookupToken(manualValue)
  }

  async function handleCheckIn() {
    if (state.status !== 'ready' && state.status !== 'success') return
    const token = state.token
    setCheckingIn(true)
    try {
      const result = await submitAdminCheckin(token)
      setState({
        status: 'success',
        data: result,
        token,
        already: result.already_checked_in,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized()
        return
      }
      setState({
        status: 'error',
        message:
          err instanceof ApiError ? err.message : 'Check-in failed.',
        code: err instanceof ApiError ? err.code : undefined,
      })
    } finally {
      setCheckingIn(false)
    }
  }

  function handleScanAnother() {
    setState({ status: 'idle' })
    setManualValue('')
  }

  const viewData =
    state.status === 'ready' || state.status === 'success' ? state.data : null
  const scannedCheckedIn = viewData?.participant.checked_in ?? false
  const alreadyBanner =
    state.status === 'success' && state.already
      ? true
      : state.status === 'ready' && scannedCheckedIn

  return (
    <AdminShell
      title="Check-in"
      subtitle="Scan Digital Hacker Pass QR codes to check participants in."
    >
      <div className="admin-checkin">
        <p className="section-label">AI ODYSSEY 24</p>
        <h2 className="admin-checkin__title">CHECK-IN</h2>

        {state.status === 'idle' || state.status === 'error' ? (
          <>
            <AdminQrScanner onScan={(raw) => void lookupToken(raw)} paused={pauseScanner} />

            <form className="admin-checkin__manual" onSubmit={handleManualSubmit}>
              <div className="form-field full-width">
                <label htmlFor="manual-qr">Or paste QR URL / token</label>
                <input
                  id="manual-qr"
                  type="text"
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder="https://…/checkin/<token> or UUID"
                />
              </div>
              <button className="primary-button" type="submit">
                Look up
              </button>
            </form>
          </>
        ) : null}

        {state.status === 'loading' ? (
          <p className="admin-dash__status" role="status">
            Looking up pass…
          </p>
        ) : null}

        {state.status === 'error' ? (
          <div className="admin-dash__status admin-dash__status--error" role="alert">
            <p>{state.message}</p>
            {state.code === 'PARTICIPANT_NO_TEAM' ? (
              <p>This participant must join a team before check-in.</p>
            ) : null}
            {state.code === 'PARTICIPANT_NOT_FOUND' ? (
              <p>No registered participant matches this QR token.</p>
            ) : null}
            <button
              className="admin-dash__ghost-btn step-back-button"
              type="button"
              onClick={handleScanAnother}
            >
              ← BACK
            </button>
          </div>
        ) : null}

        {viewData ? (
          <div className="admin-checkin__result">
            {alreadyBanner ? (
              <div className="admin-checkin__already" role="status">
                <strong>ALREADY CHECKED IN</strong>
                <p>{viewData.participant.full_name}</p>
                <p>
                  {formatCheckinTime(viewData.participant.checked_in_at) ||
                    'Time on record'}
                </p>
              </div>
            ) : null}

            {state.status === 'success' && !state.already ? (
              <p className="admin-dash__success" role="status">
                Checked in at{' '}
                {formatCheckinTime(viewData.participant.checked_in_at) || 'now'}
              </p>
            ) : null}

            <section className="admin-checkin__card">
              <p className="section-label">SCANNED PARTICIPANT</p>
              <dl className="admin-dash__detail-grid">
                <div>
                  <dt>Hacker ID</dt>
                  <dd>
                    <code>{viewData.participant.hacker_id}</code>
                  </dd>
                </div>
                <div>
                  <dt>Name</dt>
                  <dd>{viewData.participant.full_name}</dd>
                </div>
                <div>
                  <dt>Role</dt>
                  <dd>{roleLabel(viewData.participant.role)}</dd>
                </div>
              </dl>
            </section>

            <section className="admin-checkin__card">
              <p className="section-label">TEAM</p>
              <h3>{viewData.team.team_name}</h3>
              <dl className="admin-dash__detail-grid">
                <div>
                  <dt>Team Code</dt>
                  <dd>
                    <code>{viewData.team.team_code}</code>
                  </dd>
                </div>
                <div>
                  <dt>Team Size</dt>
                  <dd>{viewData.team.team_size}</dd>
                </div>
                <div>
                  <dt>Team Status</dt>
                  <dd>{viewData.team.status}</dd>
                </div>
              </dl>
            </section>

            <section className="admin-checkin__card">
              <p className="section-label">TEAM MEMBERS</p>
              <ul className="admin-checkin__members">
                {viewData.members.map((member) => (
                  <li key={member.hacker_id}>
                    <div className="admin-checkin__member-main">
                      <span className="admin-checkin__mark" aria-hidden>
                        {member.checked_in ? '✓' : '○'}
                      </span>
                      <div>
                        <strong>
                          <code>{member.hacker_id}</code> — {member.full_name}
                        </strong>
                        <p>{roleLabel(member.role)}</p>
                        <p
                          className={
                            member.checked_in
                              ? 'admin-checkin__in'
                              : 'admin-checkin__out'
                          }
                        >
                          {member.checked_in
                            ? `CHECKED IN — ${formatCheckinTime(member.checked_in_at)}`
                            : 'NOT CHECKED IN'}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="admin-checkin__summary">
                CHECK-IN: {viewData.checkin_summary.checked_in} /{' '}
                {viewData.checkin_summary.total}
              </p>
            </section>

            <div className="admin-dash__drawer-actions">
              <button
                className="admin-dash__ghost-btn step-back-button"
                type="button"
                onClick={handleScanAnother}
              >
                ← BACK
              </button>
              {scannedCheckedIn ? (
                <button className="primary-button" type="button" disabled>
                  ✓ ALREADY CHECKED IN
                </button>
              ) : (
                <button
                  className="primary-button"
                  type="button"
                  disabled={checkingIn}
                  onClick={() => void handleCheckIn()}
                >
                  {checkingIn ? 'Checking in…' : 'CHECK IN PARTICIPANT'}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
