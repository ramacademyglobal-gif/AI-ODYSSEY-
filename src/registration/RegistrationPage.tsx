"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import {
  DigitalHackerPass,
  type DigitalHackerPassData,
} from "@/registration/components/DigitalHackerPass";
import { PostRegistrationActions } from "@/registration/components/PostRegistrationActions";
import {
  ApiError,
  getTeam,
  registerWithPaymentProof,
  type ApiParticipant,
  type ApiTeam,
} from "@/registration/services/api";
import {
  buildPassSnapshotFromRegistration,
  downloadHackerPassPdf,
  loadCompletedRegistration,
  saveCompletedRegistration,
  savePassSnapshot,
  type CompletedRegistration,
} from "@/registration/utils/passStore";
import { triggerRouteVeil } from "@/registration/components/triggerRouteVeil";
import { useRevealOnScroll } from "@/registration/hooks/useRevealOnScroll";
import "@/registration/styles/odyssey-register.css";

type TeamMode = 'create' | 'join' | null
type TeamSize = 3 | 4

function ReqMark() {
  return (
    <span className="req" aria-hidden="true">
      *
    </span>
  )
}

interface FormData {
  fullName: string
  email: string
  mobile: string
  college: string
  department: string
  year: string
  teamName: string
  teamSize: TeamSize | null
  teamCode: string
}

interface TeamDraft {
  team_name: string
  team_size: TeamSize
}

interface Errors {
  [key: string]: string
}

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const TOTAL_STEPS = 3

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.details[0] || err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

function Registration() {
  const [step, setStep] = useState(1)
  const [teamMode, setTeamMode] = useState<TeamMode>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState<FormData>({
    fullName: '',
    email: '',
    mobile: '',
    college: '',
    department: '',
    year: '',
    teamName: '',
    teamSize: null,
    teamCode: '',
  })

  const restored = useMemo(() => {
    const existing = loadCompletedRegistration()
    if (existing?.participant?.hacker_id && existing.team?.team_code) {
      return existing
    }
    return null
  }, [])

  const [participant, setParticipant] = useState<ApiParticipant | null>(
    () => restored?.participant ?? null,
  )
  const [team, setTeam] = useState<ApiTeam | null>(() => restored?.team ?? null)
  const [teamDraft, setTeamDraft] = useState<TeamDraft | null>(null)
  const [previewTeam, setPreviewTeam] = useState<ApiTeam | null>(null)
  const [role, setRole] = useState<'LEADER' | 'MEMBER' | null>(
    () => restored?.role ?? null,
  )
  const [completed, setCompleted] = useState<CompletedRegistration | null>(
    () => restored,
  )
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(() => Boolean(restored))
  const skipStepVeil = useRef(true)
  useRevealOnScroll([step, awaitingPayment, completed, paymentVerified])

  // AI ODYSSEY veil on every wizard / payment / success step change
  useEffect(() => {
    if (skipStepVeil.current) {
      skipStepVeil.current = false
      return
    }
    triggerRouteVeil()
  }, [step, awaitingPayment, paymentVerified])

  // Refresh live team fill/status so COMPLETE shows when the squad is full.
  useEffect(() => {
    const code = completed?.team?.team_code
    if (!code) return

    let cancelled = false
    void getTeam(code)
      .then((fresh) => {
        if (cancelled) return
        setTeam(fresh)
        if (completed) {
          const next = { ...completed, team: fresh, participant: completed.participant }
          setCompleted(next)
          saveCompletedRegistration(next)
          const snapshot = buildPassSnapshotFromRegistration(next)
          if (snapshot) savePassSnapshot(snapshot)
        }
      })
      .catch(() => {
        /* keep cached team if refresh fails */
      })

    return () => {
      cancelled = true
    }
  }, [completed?.team?.team_code])

  const passData: DigitalHackerPassData | null = useMemo(() => {
    const p = completed?.participant ?? participant
    const t = completed?.team ?? team
    const r = completed?.role ?? role
    if (!p || !t || !r) return null
    const memberCount = t.member_count ?? t.members?.length ?? 0
    const derivedStatus =
      t.team_size === 3
        ? memberCount >= 3
          ? 'COMPLETE'
          : 'WAITING'
        : memberCount >= 4
          ? 'FULL'
          : memberCount >= 3
            ? 'COMPLETE'
            : 'WAITING'
    return {
      hackerId: p.hacker_id,
      fullName: p.full_name,
      college: p.college,
      teamName: t.team_name,
      teamCode: t.team_code,
      teamSize: t.team_size,
      teamStatus: derivedStatus,
      role: r,
      qrToken: p.qr_token?.trim() || null,
    }
  }, [completed, participant, team, role])

  const updateField = (
    field: keyof FormData,
    value: string | TeamSize | null,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validateStep1 = () => {
    const newErrors: Errors = {}
    if (!form.fullName.trim() || form.fullName.trim().length < 3) {
      newErrors.fullName = 'Full name is required (min 3 characters)'
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Enter a valid email address'
    }
    if (!form.mobile.trim() || !/^\d{10}$/.test(form.mobile.trim())) {
      newErrors.mobile = 'Mobile number must contain exactly 10 digits'
    }
    if (!form.college.trim()) newErrors.college = 'College / Institution is required'
    if (!form.department.trim()) newErrors.department = 'Department is required'
    if (!form.year) newErrors.year = 'Select your year of study'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Errors = {}
    if (!teamMode) {
      newErrors.teamMode = 'Choose Create a Team or Join a Team'
    }
    if (teamMode === 'create') {
      if (!form.teamName.trim() || form.teamName.trim().length < 2) {
        newErrors.teamName = 'Team name is required'
      }
      if (!form.teamSize) {
        newErrors.teamSize = 'Select your team size (3 or 4 members)'
      }
      if (!teamDraft) {
        newErrors.teamCode = 'Create your team before continuing'
      }
    }
    if (teamMode === 'join') {
      const code = form.teamCode.trim().toUpperCase()
      if (!code) {
        newErrors.teamCode = 'Team code is required'
      } else if (!/^ODYSSEY24-[A-Z0-9]{4}$/.test(code)) {
        newErrors.teamCode = 'Enter a valid code (ODYSSEY24-XXXX)'
      } else if (!previewTeam) {
        newErrors.teamCode = 'Look up your team before continuing'
      } else if (previewTeam.available_slots <= 0) {
        newErrors.teamCode = 'This team is full and cannot be joined'
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = async () => {
    if (submitting || actionLoading) return

    if (step === 1) {
      if (!validateStep1()) return
      setErrors({})
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    if (step === 2) {
      if (!validateStep2()) return
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const previousStep = () => {
    if (actionLoading || submitting) return
    setErrors({})
    setStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCreateTeam = () => {
    if (actionLoading) return
    const newErrors: Errors = {}
    if (!form.teamName.trim() || form.teamName.trim().length < 2) {
      newErrors.teamName = 'Team name is required'
    }
    if (!form.teamSize) {
      newErrors.teamSize = 'Select your team size (3 or 4 members)'
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      return
    }

    setErrors({})
    setTeamDraft({
      team_name: form.teamName.trim(),
      team_size: form.teamSize!,
    })
    setRole('LEADER')
    setTeam(null)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleFindTeam = async () => {
    if (actionLoading) return
    const code = form.teamCode.trim().toUpperCase()
    updateField('teamCode', code)
    setTeam(null)
    setTeamDraft(null)
    setRole(null)

    if (!code) {
      setPreviewTeam(null)
      setErrors((prev) => ({ ...prev, teamCode: 'Team code is required' }))
      return
    }
    if (!/^ODYSSEY24-[A-Z0-9]{4}$/.test(code)) {
      setPreviewTeam(null)
      setErrors((prev) => ({
        ...prev,
        teamCode: 'Enter a valid code (ODYSSEY24-XXXX)',
      }))
      return
    }

    try {
      setActionLoading(true)
      setErrors({})
      const found = await getTeam(code)
      setPreviewTeam(found)
      if (found.available_slots <= 0) {
        setErrors({
          teamCode: `This team is full (${found.member_count}/${found.team_size} · ${found.status})`,
        })
      }
    } catch (err) {
      setPreviewTeam(null)
      setErrors({ teamCode: formatApiError(err) })
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || actionLoading) return

    if (teamMode === 'create') {
      if (!teamDraft) {
        setErrors({ form: 'Create your team before confirming.' })
        return
      }
    } else if (teamMode === 'join') {
      if (!previewTeam) {
        setErrors({ form: 'Look up a valid team before confirming.' })
        return
      }
      if (previewTeam.available_slots <= 0) {
        setErrors({ form: 'This team is full and cannot be joined.' })
        return
      }
    } else {
      setErrors({ form: 'Choose Create a Team or Join a Team.' })
      return
    }

    if (!validateStep1()) {
      setStep(1)
      return
    }

    setErrors({})
    setAwaitingPayment(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  /** Persist participant + team to DB only after payment proof is accepted. */
  const persistRegistrationAfterPayment = async (proof: {
    file: File
    transactionId: string
  }) => {
    try {
      if (teamMode !== 'create' && teamMode !== 'join') {
        throw new Error('Choose Create a Team or Join a Team.')
      }

      const result = await registerWithPaymentProof({
        screenshot: proof.file,
        transaction_id: proof.transactionId,
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.mobile.trim(),
        college: form.college.trim(),
        department: form.department.trim(),
        year: form.year,
        team_mode: teamMode,
        team_name: teamMode === 'create' ? teamDraft?.team_name : undefined,
        team_size: teamMode === 'create' ? teamDraft?.team_size : undefined,
        team_code:
          teamMode === 'join' ? form.teamCode.trim().toUpperCase() : undefined,
      })

      if (!result.participant.qr_token) {
        throw new ApiError(
          500,
          'Backend did not return qr_token. Digital Hacker Pass QR cannot be shown until the create-participant response includes qr_token.',
          'QR_TOKEN_MISSING',
        )
      }

      const payload: CompletedRegistration = {
        participant: result.participant,
        team: result.team,
        role: result.role,
        saved_at: new Date().toISOString(),
      }

      const snapshot = buildPassSnapshotFromRegistration(payload)
      if (snapshot) savePassSnapshot(snapshot)
      saveCompletedRegistration(payload)
      setParticipant(result.participant)
      setTeam(result.team)
      setRole(result.role)
      setCompleted(payload)
      setAwaitingPayment(false)
      setPaymentVerified(true)
    } catch (err) {
      throw new Error(formatApiError(err), { cause: err })
    }
  }

  const handleInput =
    (field: keyof FormData) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(field, event.target.value)
    }

  if (completed && passData && paymentVerified) {
    return (
      <main className="registration-page success-page odyssey-reg">
        <div className="success-container">
          <div className="no-print">
            <div className="success-topbar">
              <Link className="back-home success-topbar__home" href="/">
                ← Back to home
              </Link>
            </div>

            <div className="success-signal" aria-hidden="true">
              <span className="success-signal__ring success-signal__ring--a" />
              <span className="success-signal__ring success-signal__ring--b" />
              <span className="success-signal__ring success-signal__ring--c" />
              <span className="success-signal__core">
                <svg
                  className="success-signal__glyph"
                  viewBox="0 0 64 64"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    className="success-signal__orbit"
                    d="M32 8c13.255 0 24 10.745 24 24S45.255 56 32 56 8 45.255 8 32 18.745 8 32 8Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="6 8"
                  />
                  <path
                    className="success-signal__check"
                    d="M20 33.5 28.5 42 44 24"
                    stroke="currentColor"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    className="success-signal__dot"
                    cx="32"
                    cy="32"
                    r="2.5"
                    fill="currentColor"
                  />
                </svg>
              </span>
            </div>

            <p className="registration-eyebrow">REGISTRATION COMPLETE</p>
            <h1>
              WELCOME TO
              <br />
              <span>AI ODYSSEY 24</span>
            </h1>
            <p className="success-message">YOUR ODYSSEY BEGINS NOW.</p>

            <div className="success-summary">
              <div>
                <span>HACKER ID</span>
                <strong>{passData.hackerId}</strong>
              </div>
              <div>
                <span>TEAM</span>
                <strong>{passData.teamName}</strong>
              </div>
              <div>
                <span>TEAM CODE</span>
                <strong>{passData.teamCode}</strong>
              </div>
              <div>
                <span>SIZE</span>
                <strong>{passData.teamSize} MEMBERS</strong>
              </div>
              <div>
                <span>ROLE</span>
                <strong>
                  {passData.role === 'LEADER' ? 'TEAM LEADER' : 'TEAM MEMBER'}
                </strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>{passData.teamStatus}</strong>
              </div>
            </div>
          </div>

          <DigitalHackerPass data={passData} />

          {!passData.qrToken ? (
            <p className="success-inline-error no-print" role="alert">
              Remaining backend requirement: create-participant must return
              qr_token for the Digital Hacker Pass QR.
            </p>
          ) : null}

          <div className="no-print success-pass-actions">
            <button
              className="primary-button"
              type="button"
              onClick={() => void downloadHackerPassPdf(passData)}
            >
              DOWNLOAD AS PDF
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (awaitingPayment) {
    const draftTeamName =
      teamMode === 'create'
        ? teamDraft?.team_name || form.teamName
        : previewTeam?.team_name || '—'
    const draftTeamCode =
      teamMode === 'create' ? 'Issued after payment' : form.teamCode
    const draftTeamSize =
      teamMode === 'create'
        ? teamDraft?.team_size || form.teamSize
        : previewTeam?.team_size
    const draftRole = teamMode === 'create' ? 'TEAM LEADER' : 'TEAM MEMBER'

    return (
      <main className="registration-page success-page odyssey-reg">
        <div className="success-container">
          <div className="no-print success-payment-top">
            <button
              type="button"
              className="secondary-button success-review-back"
              onClick={() => {
                setAwaitingPayment(false)
                setStep(3)
              }}
            >
              ← BACK TO REVIEW
            </button>
            <p className="registration-eyebrow">PAYMENT REQUIRED</p>
            <h1>
              FINISH WITH
              <br />
              <span>PAYMENT PROOF</span>
            </h1>
            <p className="success-message">
              Your details stay local until you submit payment proof. Then we
              save your registration and issue your Digital Hacker Pass.
            </p>

            <div className="success-summary">
              <div>
                <span>NAME</span>
                <strong>{form.fullName}</strong>
              </div>
              <div>
                <span>TEAM</span>
                <strong>{draftTeamName}</strong>
              </div>
              <div>
                <span>TEAM CODE</span>
                <strong>{draftTeamCode}</strong>
              </div>
              <div>
                <span>SIZE</span>
                <strong>
                  {draftTeamSize ? `${draftTeamSize} MEMBERS` : '—'}
                </strong>
              </div>
              <div>
                <span>ROLE</span>
                <strong>{draftRole}</strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>AWAITING PAYMENT</strong>
              </div>
            </div>
          </div>

          <div className="no-print">
            <PostRegistrationActions
              teamSize={(() => {
                const size =
                  teamMode === "create"
                    ? teamDraft?.team_size || form.teamSize
                    : previewTeam?.team_size;
                return size === 3 || size === 4 ? size : null;
              })()}
              onPaymentVerified={persistRegistrationAfterPayment}
            />
          </div>

          <div className="no-print success-pass-actions">
            <p className="success-pass-lock" role="status">
              Submit payment proof above to save your registration and unlock
              your Digital Hacker Pass + PDF.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="registration-page odyssey-reg">
      <div className="registration-container">
        <header className="registration-header">
          <div>
            <Link className="back-home" href="/">
              ← Back to home
            </Link>
          </div>
          <div className="step-counter">
            STEP {String(step).padStart(2, '0')} / 0{TOTAL_STEPS}
          </div>
        </header>

        <div className="registration-progress">
          <div
            className="registration-progress-fill"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        {errors.form ? (
          <p className="field-error form-banner" role="alert">
            {errors.form}
          </p>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)}>
          {step === 1 && (
            <section className="registration-step" key={step} data-reveal>
              <p className="registration-eyebrow">01 / NAME</p>
              <h1>
                IDENTIFY
                <br />
                <span>YOURSELF.</span>
              </h1>
              <p className="registration-description">
                Every hacker begins with a name. Tell us who is entering the
                Odyssey.
              </p>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label>
                    FULL NAME
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={handleInput('fullName')}
                    disabled={actionLoading}
                  />
                  {errors.fullName ? (
                    <span className="field-error">{errors.fullName}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label>
                    EMAIL
                    <ReqMark />
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleInput('email')}
                    disabled={actionLoading || Boolean(participant)}
                  />
                  {errors.email ? (
                    <span className="field-error">{errors.email}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label>
                    MOBILE NUMBER
                    <ReqMark />
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digit mobile number"
                    value={form.mobile}
                    onChange={(event) => {
                      updateField(
                        'mobile',
                        event.target.value.replace(/\D/g, '').slice(0, 10),
                      )
                    }}
                    disabled={actionLoading}
                  />
                  {errors.mobile ? (
                    <span className="field-error">{errors.mobile}</span>
                  ) : null}
                </div>

                <div className="form-field full-width">
                  <label>
                    COLLEGE / INSTITUTION
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your college / institution"
                    value={form.college}
                    onChange={handleInput('college')}
                    disabled={actionLoading}
                  />
                  {errors.college ? (
                    <span className="field-error">{errors.college}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label>
                    DEPARTMENT
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CSE"
                    value={form.department}
                    onChange={handleInput('department')}
                    disabled={actionLoading}
                  />
                  {errors.department ? (
                    <span className="field-error">{errors.department}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label>
                    YEAR OF STUDY
                    <ReqMark />
                  </label>
                  <select
                    value={form.year}
                    onChange={handleInput('year')}
                    disabled={actionLoading}
                  >
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.year ? (
                    <span className="field-error">{errors.year}</span>
                  ) : null}
                </div>
              </div>

              <div className="registration-actions">
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void nextStep()}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'CONTINUING…' : 'CONTINUE →'}
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="registration-step" key={step} data-reveal>
              <p className="registration-eyebrow">02 / CREATE / JOIN TEAM</p>
              <h1>
                BUILD YOUR
                <br />
                <span>CREW.</span>
              </h1>
              <p className="registration-description">
                AI ODYSSEY 24 teams contain exactly 3 or 4 members. Solo is not
                allowed.
              </p>

              {participant ? (
                <p className="registration-description">
                  Hacker ID issued: <strong>{participant.hacker_id}</strong>
                </p>
              ) : (
                <p className="registration-description">
                  Your Hacker ID and team code are issued after payment proof is
                  submitted.
                </p>
              )}

              <div className="team-mode-grid">
                <button
                  type="button"
                  className={`team-mode-card ${teamMode === 'create' ? 'selected' : ''}`}
                  disabled={actionLoading || Boolean(teamDraft)}
                  onClick={() => {
                    setTeamMode('create')
                    setPreviewTeam(null)
                    setErrors({})
                  }}
                >
                  <span className="team-mode-number">01</span>
                  <strong>CREATE A TEAM</strong>
                  <p>Start a new team and become its Team Leader.</p>
                  <b>{teamMode === 'create' ? 'SELECTED ✓' : 'SELECT'}</b>
                </button>

                <button
                  type="button"
                  className={`team-mode-card ${teamMode === 'join' ? 'selected' : ''}`}
                  disabled={actionLoading || Boolean(teamDraft)}
                  onClick={() => {
                    setTeamMode('join')
                    setTeamDraft(null)
                    setErrors({})
                  }}
                >
                  <span className="team-mode-number">02</span>
                  <strong>JOIN A TEAM</strong>
                  <p>Enter the team code shared by your Team Leader.</p>
                  <b>{teamMode === 'join' ? 'SELECTED ✓' : 'SELECT'}</b>
                </button>
              </div>

              {errors.teamMode ? (
                <span className="field-error">{errors.teamMode}</span>
              ) : null}

              {teamMode === 'create' ? (
                <div className="team-panel">
                  <div className="form-field">
                    <label>
                      TEAM NAME
                      <ReqMark />
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Neural Nexus"
                      value={form.teamName}
                      onChange={handleInput('teamName')}
                      disabled={actionLoading || Boolean(teamDraft)}
                    />
                    {errors.teamName ? (
                      <span className="field-error">{errors.teamName}</span>
                    ) : null}
                  </div>

                  <div className="form-field">
                    <label>
                      TEAM SIZE
                      <ReqMark />
                    </label>
                    <div className="team-size-grid">
                      <button
                        type="button"
                        className={form.teamSize === 3 ? 'selected' : ''}
                        disabled={actionLoading || Boolean(teamDraft)}
                        onClick={() => updateField('teamSize', 3)}
                      >
                        <strong>3</strong>
                        <span>MEMBERS</span>
                      </button>
                      <button
                        type="button"
                        className={form.teamSize === 4 ? 'selected' : ''}
                        disabled={actionLoading || Boolean(teamDraft)}
                        onClick={() => updateField('teamSize', 4)}
                      >
                        <strong>4</strong>
                        <span>MEMBERS</span>
                      </button>
                    </div>
                    <p className="registration-description">
                      Team size is locked after creation. Team code is issued
                      after payment proof.
                    </p>
                    {errors.teamSize ? (
                      <span className="field-error">{errors.teamSize}</span>
                    ) : null}
                  </div>

                  {teamDraft ? (
                    <div className="team-created-box">
                      <span>TEAM READY</span>
                      <strong>{teamDraft.team_name}</strong>
                      <p>
                        Role: <strong>TEAM LEADER</strong>
                      </p>
                      <p>
                        Size: <strong>{teamDraft.team_size} MEMBERS</strong>
                      </p>
                      <p>
                        Team code and Hacker ID are created when you submit
                        payment proof.
                      </p>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => {
                          setStep(3)
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        CONTINUE TO REVIEW →
                      </button>
                      <button
                        type="button"
                        className="secondary-button step-back-button"
                        onClick={() => {
                          setTeamDraft(null)
                          setRole(null)
                        }}
                      >
                        CHANGE TEAM DETAILS
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="generate-team-button"
                      onClick={handleCreateTeam}
                      disabled={actionLoading}
                    >
                      CREATE TEAM →
                    </button>
                  )}
                  {errors.teamCode && teamMode === 'create' ? (
                    <span className="field-error">{errors.teamCode}</span>
                  ) : null}
                </div>
              ) : null}

              {teamMode === 'join' ? (
                <div className="team-panel">
                  <div className="form-field">
                    <label>
                      TEAM CODE
                      <ReqMark />
                    </label>
                    <input
                      type="text"
                      placeholder="ODYSSEY24-0047"
                      value={form.teamCode}
                      onChange={(event) => {
                        updateField('teamCode', event.target.value.toUpperCase())
                        setPreviewTeam(null)
                      }}
                      disabled={actionLoading || Boolean(team)}
                    />
                    {errors.teamCode ? (
                      <span className="field-error">{errors.teamCode}</span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="generate-team-button"
                    onClick={() => void handleFindTeam()}
                    disabled={actionLoading || Boolean(team)}
                  >
                    {actionLoading ? 'LOOKING UP…' : 'FIND TEAM →'}
                  </button>

                  {previewTeam ? (
                    <div className="team-found-box">
                      <span>
                        {previewTeam.available_slots <= 0
                          ? 'TEAM FULL'
                          : 'TEAM FOUND'}
                      </span>
                      <h3>{previewTeam.team_name}</h3>
                      <p>
                        Team Code: <strong>{previewTeam.team_code}</strong>
                      </p>
                      <p>
                        Team Size:{' '}
                        <strong>{previewTeam.team_size} MEMBERS</strong>
                      </p>
                      <p>
                        Current:{' '}
                        <strong>
                          {previewTeam.member_count}/{previewTeam.team_size} ·{' '}
                          {previewTeam.status}
                        </strong>
                      </p>
                      <p>
                        Available slots:{' '}
                        <strong>{previewTeam.available_slots}</strong>
                      </p>
                      <p>
                        Your Role:{' '}
                        <strong>
                          {previewTeam.available_slots <= 0
                            ? 'CANNOT JOIN (FULL)'
                            : 'TEAM MEMBER'}
                        </strong>
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="registration-actions">
                <button
                  type="button"
                  className="secondary-button step-back-button"
                  onClick={previousStep}
                  disabled={actionLoading}
                >
                  ← BACK
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => void nextStep()}
                  disabled={actionLoading}
                >
                  REVIEW →
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="registration-step" key={step} data-reveal>
              <p className="registration-eyebrow">03 / REVIEW</p>
              <h1>
                READY TO ENTER
                <br />
                <span>THE ODYSSEY?</span>
              </h1>
              <p className="registration-description">
                Confirm your details, then submit payment proof. Your Digital
                Hacker Pass is issued only after registration is saved.
              </p>

              <div className="review-container">
                <div className="review-section">
                  <div className="review-heading">
                    <span>01</span>
                    <strong>HACKER PROFILE</strong>
                    <button type="button" onClick={() => setStep(1)}>
                      EDIT
                    </button>
                  </div>
                  <div className="review-grid">
                    <div>
                      <span>NAME</span>
                      <strong>{form.fullName}</strong>
                    </div>
                    <div>
                      <span>EMAIL</span>
                      <strong>{form.email}</strong>
                    </div>
                    <div>
                      <span>MOBILE</span>
                      <strong>{form.mobile}</strong>
                    </div>
                    <div>
                      <span>COLLEGE</span>
                      <strong>{form.college}</strong>
                    </div>
                    <div>
                      <span>DEPARTMENT</span>
                      <strong>{form.department}</strong>
                    </div>
                    <div>
                      <span>YEAR</span>
                      <strong>{form.year}</strong>
                    </div>
                    <div>
                      <span>HACKER ID</span>
                      <strong>
                        {participant?.hacker_id || 'Issued after payment'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <div className="review-heading">
                    <span>02</span>
                    <strong>TEAM</strong>
                    <button type="button" onClick={() => setStep(2)}>
                      EDIT
                    </button>
                  </div>
                  {teamMode === 'create' && teamDraft ? (
                    <div className="team-code-banner">
                      <span>TEAM CODE</span>
                      <strong>Issued after payment proof</strong>
                      <p>
                        After you submit payment proof, your team code appears
                        here for teammates to join.
                      </p>
                    </div>
                  ) : null}
                  <div className="review-grid">
                    <div>
                      <span>TEAM</span>
                      <strong>
                        {teamMode === 'create'
                          ? teamDraft?.team_name || form.teamName
                          : previewTeam?.team_name || '—'}
                      </strong>
                    </div>
                    <div>
                      <span>TEAM CODE</span>
                      <strong>
                        {teamMode === 'create'
                          ? 'Issued after payment'
                          : form.teamCode}
                      </strong>
                    </div>
                    <div>
                      <span>TEAM SIZE</span>
                      <strong>
                        {teamMode === 'create'
                          ? `${teamDraft?.team_size || form.teamSize} MEMBERS`
                          : `${previewTeam?.team_size || '—'} MEMBERS`}
                      </strong>
                    </div>
                    <div>
                      <span>ROLE</span>
                      <strong>
                        {teamMode === 'create' ? 'TEAM LEADER' : 'TEAM MEMBER'}
                      </strong>
                    </div>
                    <div>
                      <span>STATUS</span>
                      <strong>
                        {teamMode === 'create'
                          ? teamDraft
                            ? `1/${teamDraft.team_size} · AWAITING PAYMENT`
                            : '—'
                          : previewTeam
                            ? `${previewTeam.member_count}/${previewTeam.team_size} · ${previewTeam.status}`
                            : '—'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="confirmation-note">
                <span>✓</span>
                <p>
                  By confirming, you verify that the information above is
                  correct. Registration is saved to the database only after you
                  submit payment proof on the next step.
                </p>
              </div>

              <div className="registration-actions">
                <button
                  type="button"
                  className="secondary-button step-back-button"
                  onClick={previousStep}
                  disabled={submitting}
                >
                  ← BACK
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting}
                >
                  CONTINUE TO PAYMENT →
                </button>
              </div>
            </section>
          )}
        </form>
      </div>
    </main>
  )
}

export default Registration
