"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'
import { AdminShell } from '@/registration/admin/components/'
import { ROUTES } from '@/registration/admin/routes'
import { ApiError } from '@/registration/services/api'
import { adminLogout } from '@/registration/admin/services/adminAuth'
import {
  fetchAdminParticipant,
  fetchAdminParticipants,
  setAdminParticipantStatus,
  updateAdminParticipant,
  type AdminParticipant,
  type ParticipantListResult,
} from '@/registration/admin/services/adminParticipants'
import '@/registration/admin/styles/admin.css'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'] as const
const STATUSES = ['REGISTERED', 'CANCELLED'] as const
const PAGE_SIZE = 20

type Filters = {
  search: string
  status: string
  year: string
}

type EditForm = {
  full_name: string
  email: string
  phone: string
  college: string
  department: string
  year: string
}

type FieldErrors = Partial<Record<keyof EditForm, string>>

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: ParticipantListResult }

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function toEditForm(participant: AdminParticipant): EditForm {
  return {
    full_name: participant.full_name,
    email: participant.email,
    phone: participant.phone,
    college: participant.college,
    department: participant.department,
    year: participant.year,
  }
}

function validateEditForm(form: EditForm): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.full_name.trim() || form.full_name.trim().length > 150) {
    errors.full_name = 'Full name is required (max 150 characters)'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  const phone = form.phone.replace(/\s+/g, '')
  if (phone.length < 10 || phone.length > 20) {
    errors.phone = 'Phone must be 10–20 characters'
  }
  if (!form.college.trim() || form.college.trim().length > 255) {
    errors.college = 'College is required'
  }
  if (!form.department.trim() || form.department.trim().length > 150) {
    errors.department = 'Department is required'
  }
  if (!form.year.trim()) {
    errors.year = 'Select a year of study'
  }
  return errors
}

function filtersFromSearchParams(
  params: URLSearchParams | { get(name: string): string | null },
): Filters {
  return {
    search: params.get('search')?.trim() || '',
    status: params.get('status')?.trim() || '',
    year: params.get('year')?.trim() || '',
  }
}

export function AdminParticipantsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialFilters = filtersFromSearchParams(searchParams)
  const teamLabel = searchParams.get('team')?.trim() || ''

  const [filters, setFilters] = useState<Filters>(initialFilters)
  const [applied, setApplied] = useState<Filters>(initialFilters)
  const [page, setPage] = useState(1)
  const [reloadToken, setReloadToken] = useState(0)
  const [listState, setListState] = useState<ListState>({ status: 'loading' })

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminParticipant | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<EditForm | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const detailLoading = Boolean(selectedId && !detail && !detailError)

  // Keep filters in sync when arriving from dashboard View / summary cards.
  useEffect(() => {
    const next = filtersFromSearchParams(searchParams)
    setFilters(next)
    setApplied((prev) =>
      prev.search === next.search &&
      prev.status === next.status &&
      prev.year === next.year
        ? prev
        : next,
    )
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    let cancelled = false

    void fetchAdminParticipants({
      page,
      pageSize: PAGE_SIZE,
      search: applied.search || undefined,
      status: applied.status || undefined,
      year: applied.year || undefined,
    })
      .then((data) => {
        if (!cancelled) setListState({ status: 'ready', data })
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
            : 'Failed to load participants.'
        setListState({ status: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [applied, router, page, reloadToken])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    let cancelled = false

    void fetchAdminParticipant(selectedId)
      .then((participant) => {
        if (cancelled) return
        setDetail(participant)
        setEditForm(toEditForm(participant))
        setDetailError(null)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 401) {
          adminLogout()
          router.replace(ROUTES.adminLogin)
          return
        }
        setDetail(null)
        setDetailError(
          err instanceof ApiError
            ? err.message
            : 'Failed to load participant details.',
        )
      })

    return () => {
      cancelled = true
    }
  }, [router, selectedId])

  function handleApplyFilters(event?: FormEvent) {
    event?.preventDefault()
    setPage(1)
    setApplied({ ...filters })
    setListState({ status: 'loading' })
    setReloadToken((v) => v + 1)
  }

  function handleRefresh() {
    setListState({ status: 'loading' })
    setReloadToken((v) => v + 1)
  }

  function openDetails(hackerId: string) {
    setSelectedId(hackerId)
    setEditing(false)
    setSuccessMessage(null)
    setFieldErrors({})
    setDetail(null)
    setDetailError(null)
  }

  function closeDetails() {
    setSelectedId(null)
    setDetail(null)
    setEditing(false)
    setSuccessMessage(null)
    setFieldErrors({})
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !editForm) return

    setSuccessMessage(null)
    const errors = validateEditForm(editForm)
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const updated = await updateAdminParticipant(selectedId, {
        ...editForm,
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.replace(/\s+/g, ''),
        college: editForm.college.trim(),
        department: editForm.department.trim(),
      })
      setDetail(updated)
      setEditForm(toEditForm(updated))
      setEditing(false)
      setSuccessMessage('Participant updated successfully.')
      setListState({ status: 'loading' })
      setReloadToken((v) => v + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminLogout()
        router.replace(ROUTES.adminLogin)
        return
      }
      if (err instanceof ApiError && err.status === 400 && err.details.length) {
        const next: FieldErrors = {}
        for (const detail of err.details) {
          const key = detail.split(' ')[0] as keyof EditForm
          if (key in (editForm ?? {})) {
            next[key] = detail
          }
        }
        if (Object.keys(next).length > 0) {
          setFieldErrors(next)
        } else {
          setDetailError(err.message)
        }
      } else {
        setDetailError(
          err instanceof ApiError ? err.message : 'Update failed.',
        )
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(status: 'REGISTERED' | 'CANCELLED') {
    if (!selectedId) return
    setStatusBusy(true)
    setSuccessMessage(null)
    setDetailError(null)
    try {
      const updated = await setAdminParticipantStatus(selectedId, status)
      setDetail(updated)
      setEditForm(toEditForm(updated))
      setSuccessMessage(
        status === 'CANCELLED'
          ? 'Participant deactivated.'
          : 'Participant reactivated.',
      )
      setListState({ status: 'loading' })
      setReloadToken((v) => v + 1)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        adminLogout()
        router.replace(ROUTES.adminLogin)
        return
      }
      setDetailError(
        err instanceof ApiError ? err.message : 'Status update failed.',
      )
    } finally {
      setStatusBusy(false)
    }
  }

  const pagination =
    listState.status === 'ready' ? listState.data.pagination : null

  return (
    <AdminShell
      title="Participants"
      subtitle="Search, review, and correct registered hacker profiles."
      onRefresh={handleRefresh}
      refreshing={listState.status === 'loading'}
    >
      {applied.search || teamLabel ? (
        <p className="admin-dash__team-banner" role="status">
          {teamLabel
            ? `Showing members of team “${teamLabel}”`
            : `Filtered by “${applied.search}”`}
          {applied.search ? (
            <>
              {' '}
              <button
                type="button"
                className="admin-dash__link-btn"
                onClick={() => {
                  const cleared = { search: '', status: '', year: '' }
                  setFilters(cleared)
                  setApplied(cleared)
                  setPage(1)
                  router.replace(ROUTES.adminParticipants)
                }}
              >
                Clear
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      <form className="admin-dash__filters" onSubmit={handleApplyFilters}>
        <div className="form-field">
          <label htmlFor="participant-search">Search</label>
          <input
            id="participant-search"
            type="search"
            placeholder="Hacker ID, name, email, college, team name…"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
          />
        </div>
        <div className="form-field">
          <label htmlFor="participant-status">Status</label>
          <select
            id="participant-status"
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, status: e.target.value }))
            }
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="participant-year">Year</label>
          <select
            id="participant-year"
            value={filters.year}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, year: e.target.value }))
            }
          >
            <option value="">All years</option>
            {YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button className="primary-button admin-dash__filter-btn" type="submit">
          Apply
        </button>
      </form>

      {listState.status === 'loading' ? (
        <p className="admin-dash__status" role="status">
          Loading participants…
        </p>
      ) : null}

      {listState.status === 'error' ? (
        <div className="admin-dash__status admin-dash__status--error" role="alert">
          <p>{listState.message}</p>
          <button className="primary-button" type="button" onClick={handleRefresh}>
            Try again
          </button>
        </div>
      ) : null}

      {listState.status === 'ready' && listState.data.items.length === 0 ? (
        <p className="admin-dash__empty">No participants match these filters.</p>
      ) : null}

      {listState.status === 'ready' && listState.data.items.length > 0 ? (
        <>
          <div className="admin-dash__table-wrap">
            <table className="admin-dash__table">
              <thead>
                <tr>
                  <th scope="col">Hacker ID</th>
                  <th scope="col">Name</th>
                  <th scope="col">College</th>
                  <th scope="col">Team</th>
                  <th scope="col">Team Code</th>
                  <th scope="col">Status</th>
                  <th scope="col">Registered At</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listState.data.items.map((row) => (
                  <tr key={row.hacker_id}>
                    <td>
                      <code>{row.hacker_id}</code>
                    </td>
                    <td>{row.full_name}</td>
                    <td>{row.college}</td>
                    <td>{row.team?.team_name ?? '—'}</td>
                    <td>
                      {row.team ? <code>{row.team.team_code}</code> : '—'}
                    </td>
                    <td>
                      <span
                        className={
                          row.status === 'CANCELLED'
                            ? 'admin-dash__badge admin-dash__badge--wait'
                            : 'admin-dash__badge admin-dash__badge--ok'
                        }
                      >
                        {row.status}
                      </span>
                    </td>
                    <td>{formatTimestamp(row.created_at)}</td>
                    <td>
                      <button
                        className="admin-dash__link-btn"
                        type="button"
                        onClick={() => openDetails(row.hacker_id)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 ? (
            <div className="admin-dash__pagination">
              <button
                className="admin-dash__ghost-btn"
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  setPage((p) => Math.max(1, p - 1))
                  setListState({ status: 'loading' })
                }}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.total_pages} ·{' '}
                {pagination.total} total
              </span>
              <button
                className="admin-dash__ghost-btn"
                type="button"
                disabled={page >= pagination.total_pages}
                onClick={() => {
                  setPage((p) => p + 1)
                  setListState({ status: 'loading' })
                }}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : null}

      {selectedId
        ? createPortal(
            <aside
              className="admin-dash__drawer"
              aria-label="Participant details"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  closeDetails()
                }
              }}
            >
              <div
                className="admin-dash__drawer-panel"
                role="dialog"
                aria-modal="true"
              >
            <div className="admin-dash__drawer-head">
              <button
                className="admin-dash__ghost-btn step-back-button"
                type="button"
                onClick={closeDetails}
              >
                ← BACK
              </button>
              <h2>Participant details</h2>
            </div>

            {successMessage ? (
              <p className="admin-dash__success" role="status">
                {successMessage}
              </p>
            ) : null}

            {detailLoading ? (
              <p className="admin-dash__status">Loading details…</p>
            ) : null}

            {detailError ? (
              <p className="admin-dash__status admin-dash__status--error" role="alert">
                {detailError}
              </p>
            ) : null}

            {detail && !detailLoading ? (
              editing && editForm ? (
                <form className="admin-dash__edit-form" onSubmit={handleSave} noValidate>
                  {(
                    [
                      ['full_name', 'Full name', 'text'],
                      ['email', 'Email', 'email'],
                      ['phone', 'Mobile', 'tel'],
                      ['college', 'College', 'text'],
                      ['department', 'Department', 'text'],
                    ] as const
                  ).map(([key, label, type]) => (
                    <div className="form-field full-width" key={key}>
                      <label htmlFor={`edit-${key}`}>{label}</label>
                      <input
                        id={`edit-${key}`}
                        type={type}
                        value={editForm[key]}
                        disabled={saving}
                        onChange={(e) => {
                          setEditForm((prev) =>
                            prev ? { ...prev, [key]: e.target.value } : prev,
                          )
                          if (fieldErrors[key]) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              [key]: undefined,
                            }))
                          }
                        }}
                      />
                      {fieldErrors[key] ? (
                        <p className="field-error">{fieldErrors[key]}</p>
                      ) : null}
                    </div>
                  ))}

                  <div className="form-field full-width">
                    <label htmlFor="edit-year">Year</label>
                    <select
                      id="edit-year"
                      value={editForm.year}
                      disabled={saving}
                      onChange={(e) =>
                        setEditForm((prev) =>
                          prev ? { ...prev, year: e.target.value } : prev,
                        )
                      }
                    >
                      <option value="">Select year</option>
                      {YEARS.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.year ? (
                      <p className="field-error">{fieldErrors.year}</p>
                    ) : null}
                  </div>

                  <div className="admin-dash__drawer-actions">
                    <button
                      className="admin-dash__ghost-btn step-back-button"
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false)
                        setEditForm(toEditForm(detail))
                        setFieldErrors({})
                      }}
                    >
                      ← BACK
                    </button>
                    <button
                      className="primary-button"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <dl className="admin-dash__detail-grid">
                    <DetailItem label="Hacker ID" value={<code>{detail.hacker_id}</code>} />
                    <DetailItem label="Name" value={detail.full_name} />
                    <DetailItem label="Email" value={detail.email} />
                    <DetailItem label="Mobile" value={detail.phone} />
                    <DetailItem label="College" value={detail.college} />
                    <DetailItem label="Department" value={detail.department} />
                    <DetailItem label="Year" value={detail.year} />
                    <DetailItem label="Status" value={detail.status} />
                    <DetailItem
                      label="Payment Txn ID"
                      value={
                        detail.payment_txn_id ? (
                          <code>{detail.payment_txn_id}</code>
                        ) : (
                          '—'
                        )
                      }
                    />
                    <DetailItem
                      label="Payment screenshot"
                      value={
                        detail.payment_drive_file_url ? (
                          <a
                            href={detail.payment_drive_file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open payment screenshot
                          </a>
                        ) : (
                          '—'
                        )
                      }
                    />
                    <DetailItem
                      label="Payment verified"
                      value={
                        detail.payment_verified_at
                          ? formatTimestamp(detail.payment_verified_at)
                          : '—'
                      }
                    />
                    <DetailItem
                      label="Registered"
                      value={formatTimestamp(detail.created_at)}
                    />
                    <DetailItem
                      label="Team"
                      value={
                        detail.team ? (
                          <span className="admin-dash__team-detail">
                            <strong>{detail.team.team_name}</strong>
                            <span>
                              {detail.team.team_code} · {detail.team.member_count}/
                              {detail.team.team_size} · {detail.team.status} ·{' '}
                              {detail.team.role}
                            </span>
                          </span>
                        ) : (
                          'No team'
                        )
                      }
                    />
                  </dl>

                  <div className="admin-dash__drawer-actions">
                    <button
                      className="primary-button"
                      type="button"
                      onClick={() => {
                        setEditing(true)
                        setSuccessMessage(null)
                      }}
                    >
                      Edit
                    </button>
                    {detail.status === 'CANCELLED' ? (
                      <button
                        className="admin-dash__ghost-btn"
                        type="button"
                        disabled={statusBusy}
                        onClick={() => void handleStatusChange('REGISTERED')}
                      >
                        {statusBusy ? 'Updating…' : 'Reactivate'}
                      </button>
                    ) : (
                      <button
                        className="admin-dash__ghost-btn"
                        type="button"
                        disabled={statusBusy}
                        onClick={() => void handleStatusChange('CANCELLED')}
                      >
                        {statusBusy ? 'Updating…' : 'Deactivate'}
                      </button>
                    )}
                  </div>
                </>
              )
            ) : null}
              </div>
            </aside>,
            document.body,
          )
        : null}
    </AdminShell>
  )
}

function DetailItem({
  label,
  value,
}: {
  label: string
  value: ReactNode
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}
