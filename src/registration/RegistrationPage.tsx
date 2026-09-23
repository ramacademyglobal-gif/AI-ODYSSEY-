"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  DigitalHackerPass,
  type DigitalHackerPassData,
} from "@/registration/components/DigitalHackerPass";
import { PostRegistrationActions } from "@/registration/components/PostRegistrationActions";
import { RegistrationClosed } from "@/registration/components/RegistrationClosed";
import {
  ApiError,
  checkRegistrationAvailability,
  fetchRegistrationCapacity,
  getTeam,
  registerWithPaymentProof,
  type ApiParticipant,
  type ApiTeam,
  type RegistrationCapacity,
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

type TeamSize = 3 | 4

function ReqMark() {
  return (
    <span className="req" aria-hidden="true">
      *
    </span>
  )
}

type MemberDraft = {
  fullName: string
  department: string
  year: string
  rollNumber: string
}

interface FormData {
  teamName: string
  college: string
  teamSize: TeamSize | null
  leaderFullName: string
  leaderEmail: string
  leaderMobile: string
  leaderDepartment: string
  leaderYear: string
  leaderRoll: string
  members: MemberDraft[]
}

interface Errors {
  [key: string]: string
}

const years = ['1st Year', '2nd Year', '3rd Year', '4th Year']
const TOTAL_STEPS = 3

function emptyMember(): MemberDraft {
  return { fullName: '', department: '', year: '', rollNumber: '' }
}

function membersForSize(size: TeamSize, previous: MemberDraft[]): MemberDraft[] {
  const count = size - 1
  return Array.from({ length: count }, (_, i) => previous[i] ?? emptyMember())
}

function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.details[0] || err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}

function Registration() {
  const previewClosed = useSearchParams().get("preview") === "closed"
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState<Errors>({})
  const [submitting] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [form, setForm] = useState<FormData>({
    teamName: '',
    college: '',
    teamSize: null,
    leaderFullName: '',
    leaderEmail: '',
    leaderMobile: '',
    leaderDepartment: '',
    leaderYear: '',
    leaderRoll: '',
    members: membersForSize(3, []),
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
  const [role, setRole] = useState<'LEADER' | 'MEMBER' | null>(
    () => restored?.role ?? null,
  )
  const [completed, setCompleted] = useState<CompletedRegistration | null>(
    () => restored,
  )
  const [awaitingPayment, setAwaitingPayment] = useState(false)
  const [paymentVerified, setPaymentVerified] = useState(() => Boolean(restored))
  const [forcedClosed, setForcedClosed] = useState(false)
  const [capacity, setCapacity] = useState<RegistrationCapacity | null>(null)
  const [capacityReady, setCapacityReady] = useState(false)
  const skipStepVeil = useRef(true)
  useRevealOnScroll([step, awaitingPayment, completed, paymentVerified])

  useEffect(() => {
    if (skipStepVeil.current) {
      skipStepVeil.current = false
      return
    }
    triggerRouteVeil()
  }, [step, awaitingPayment, paymentVerified])

  useEffect(() => {
    let cancelled = false
    void fetchRegistrationCapacity()
      .then((next) => {
        if (!cancelled) setCapacity(next)
      })
      .catch(() => {
        if (!cancelled) setCapacity(null)
      })
      .finally(() => {
        if (!cancelled) setCapacityReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

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

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const setTeamSize = (size: TeamSize) => {
    setForm((prev) => ({
      ...prev,
      teamSize: size,
      members: membersForSize(size, prev.members),
    }))
    setErrors((prev) => ({ ...prev, teamSize: '', member4: '' }))
  }

  const updateMember = (
    index: number,
    field: keyof MemberDraft,
    value: string,
  ) => {
    setForm((prev) => {
      const members = prev.members.map((m, i) =>
        i === index ? { ...m, [field]: value } : m,
      )
      return { ...prev, members }
    })
    setErrors((prev) => ({ ...prev, [`member${index}_${field}`]: '' }))
  }

  const validateStep1 = () => {
    const newErrors: Errors = {}
    if (!form.teamName.trim() || form.teamName.trim().length < 2) {
      newErrors.teamName = 'Team name is required'
    }
    if (!form.college.trim()) {
      newErrors.college = 'College / Institution is required'
    }
    if (!form.teamSize) {
      newErrors.teamSize = 'Select your team size (3 or 4 members)'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: Errors = {}
    if (!form.leaderFullName.trim() || form.leaderFullName.trim().length < 3) {
      newErrors.leaderFullName = 'Full name is required (min 3 characters)'
    }
    if (
      !form.leaderEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.leaderEmail.trim())
    ) {
      newErrors.leaderEmail = 'Enter a valid email address'
    }
    if (!form.leaderMobile.trim() || !/^\d{10}$/.test(form.leaderMobile.trim())) {
      newErrors.leaderMobile = 'Mobile number must contain exactly 10 digits'
    }
    if (!form.leaderDepartment.trim()) {
      newErrors.leaderDepartment = 'Department is required'
    }
    if (!form.leaderYear) {
      newErrors.leaderYear = 'Select year of study'
    }
    if (!form.leaderRoll.trim()) {
      newErrors.leaderRoll = 'Register / Roll number is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors: Errors = {}
    if (!form.teamSize) {
      newErrors.teamSize = 'Select team size first'
      setErrors(newErrors)
      return false
    }

    const expected = form.teamSize - 1
    form.members.slice(0, expected).forEach((member, index) => {
      const label = `Member ${String(index + 2).padStart(2, '0')}`
      if (!member.fullName.trim() || member.fullName.trim().length < 3) {
        newErrors[`member${index}_fullName`] =
          `${label}: full name is required (min 3 characters)`
      }
      if (!member.department.trim()) {
        newErrors[`member${index}_department`] = `${label}: department is required`
      }
      if (!member.year) {
        newErrors[`member${index}_year`] = `${label}: select year of study`
      }
      if (!member.rollNumber.trim()) {
        newErrors[`member${index}_rollNumber`] =
          `${label}: register / roll number is required`
      }
    })

    const rolls = [
      form.leaderRoll.trim().toLowerCase(),
      ...form.members
        .slice(0, expected)
        .map((m) => m.rollNumber.trim().toLowerCase()),
    ].filter(Boolean)
    if (new Set(rolls).size !== rolls.length) {
      newErrors.form = 'Register / roll numbers must be unique within the team'
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
      try {
        setActionLoading(true)
        setErrors({})
        await checkRegistrationAvailability({
          email: form.leaderEmail.trim().toLowerCase(),
          phone: form.leaderMobile.trim(),
        })
        setStep(3)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (err) {
        const message = formatApiError(err)
        const code = err instanceof ApiError ? err.code : undefined
        if (code === 'EMAIL_TAKEN') {
          setErrors({ leaderEmail: message })
        } else if (code === 'PHONE_TAKEN') {
          setErrors({ leaderMobile: message })
        } else {
          setErrors({ form: message })
        }
      } finally {
        setActionLoading(false)
      }
    }
  }

  const previousStep = () => {
    if (actionLoading || submitting) return
    setErrors({})
    setStep((prev) => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting || actionLoading) return

    if (!validateStep1()) {
      setStep(1)
      return
    }
    if (!validateStep2()) {
      setStep(2)
      return
    }
    if (!validateStep3()) {
      setStep(3)
      return
    }

    try {
      setActionLoading(true)
      setErrors({})
      await checkRegistrationAvailability({
        email: form.leaderEmail.trim().toLowerCase(),
        phone: form.leaderMobile.trim(),
      })
      setAwaitingPayment(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const message = formatApiError(err)
      const code = err instanceof ApiError ? err.code : undefined
      if (code === 'EMAIL_TAKEN') {
        setErrors({ leaderEmail: message })
        setStep(2)
      } else if (code === 'PHONE_TAKEN') {
        setErrors({ leaderMobile: message })
        setStep(2)
      } else {
        setErrors({ form: message })
      }
    } finally {
      setActionLoading(false)
    }
  }

  const persistRegistrationAfterPayment = async (proof: {
    file: File
    transactionId: string
  }) => {
    try {
      if (!form.teamSize) {
        throw new Error('Select team size before paying.')
      }

      const result = await registerWithPaymentProof({
        screenshot: proof.file,
        transaction_id: proof.transactionId,
        team_name: form.teamName.trim(),
        team_size: form.teamSize,
        college: form.college.trim(),
        full_name: form.leaderFullName.trim(),
        email: form.leaderEmail.trim().toLowerCase(),
        phone: form.leaderMobile.trim(),
        department: form.leaderDepartment.trim(),
        year: form.leaderYear,
        roll_number: form.leaderRoll.trim(),
        members: form.members.slice(0, form.teamSize - 1).map((m) => ({
          full_name: m.fullName.trim(),
          department: m.department.trim(),
          year: m.year,
          roll_number: m.rollNumber.trim(),
        })),
      })

      if (!result.participant.qr_token) {
        throw new ApiError(
          500,
          'Backend did not return qr_token. Digital Hacker Pass QR cannot be shown.',
          'QR_TOKEN_MISSING',
        )
      }

      const payload: CompletedRegistration = {
        participant: result.participant,
        team: result.team,
        role: 'LEADER',
        saved_at: new Date().toISOString(),
      }

      const snapshot = buildPassSnapshotFromRegistration(payload)
      if (snapshot) savePassSnapshot(snapshot)
      saveCompletedRegistration(payload)
      setParticipant(result.participant)
      setTeam(result.team)
      setRole('LEADER')
      setCompleted(payload)
      setAwaitingPayment(false)
      setPaymentVerified(true)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'REGISTRATION_CLOSED') {
        setForcedClosed(true)
      }
      throw new Error(formatApiError(err), { cause: err })
    }
  }

  const handleLeaderInput =
    (field: 'leaderFullName' | 'leaderEmail' | 'leaderDepartment' | 'leaderYear' | 'leaderRoll') =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      updateField(field, event.target.value)
    }

  if (previewClosed) {
    return <RegistrationClosed />
  }

  if (!(completed && paymentVerified)) {
    if (!capacityReady) {
      return <RegistrationClosed checking />
    }
    if (forcedClosed || (capacity != null && !capacity.open)) {
      return <RegistrationClosed />
    }
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
            <p className="success-message">
              Your team is registered. The Team Leader Digital Hacker Pass QR
              shows all members at the gate.
            </p>

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
                <strong>TEAM LEADER</strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>{passData.teamStatus}</strong>
              </div>
            </div>

            {team?.members?.length ? (
              <div className="success-summary" style={{ marginTop: '1rem' }}>
                {team.members.map((m) => (
                  <div key={m.participant_id || m.hacker_id}>
                    <span>{m.role === 'LEADER' ? 'TEAM LEADER' : 'MEMBER'}</span>
                    <strong>
                      {m.full_name}
                      {m.hacker_id ? ` · ${m.hacker_id}` : ''}
                    </strong>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <DigitalHackerPass data={passData} />

          {!passData.qrToken ? (
            <p className="success-inline-error no-print" role="alert">
              Remaining backend requirement: registration must return qr_token
              for the Digital Hacker Pass QR.
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
              Pay the full team fee once, then submit proof. We save the whole
              squad and issue the Team Leader Digital Hacker Pass.
            </p>

            <div className="success-summary">
              <div>
                <span>TEAM</span>
                <strong>{form.teamName}</strong>
              </div>
              <div>
                <span>COLLEGE</span>
                <strong>{form.college}</strong>
              </div>
              <div>
                <span>SIZE</span>
                <strong>
                  {form.teamSize ? `${form.teamSize} MEMBERS` : '—'}
                </strong>
              </div>
              <div>
                <span>LEADER</span>
                <strong>{form.leaderFullName}</strong>
              </div>
              <div>
                <span>FEE</span>
                <strong>
                  {form.teamSize === 3
                    ? '₹300'
                    : form.teamSize === 4
                      ? '₹400'
                      : '—'}
                </strong>
              </div>
              <div>
                <span>STATUS</span>
                <strong>AWAITING PAYMENT</strong>
              </div>
            </div>
          </div>

          <div className="no-print">
            <PostRegistrationActions
              teamSize={form.teamSize === 3 || form.teamSize === 4 ? form.teamSize : null}
              onPaymentVerified={persistRegistrationAfterPayment}
            />
          </div>

          <div className="no-print success-pass-actions">
            <p className="success-pass-lock" role="status">
              Submit payment proof above to save your team registration and
              unlock the Team Leader Digital Hacker Pass + PDF.
            </p>
          </div>
        </div>
      </main>
    )
  }

  const memberSlots = form.teamSize ? form.teamSize - 1 : 2

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
              <p className="registration-eyebrow">01 / TEAM DETAILS</p>
              <h1>
                BUILD YOUR
                <br />
                <span>CREW.</span>
              </h1>
              <p className="registration-description">
                One registration for the whole team. Choose size 3 or 4, then
                enter every member before a single team payment.
              </p>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label>
                    TEAM NAME
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Neural Nexus"
                    value={form.teamName}
                    onChange={(e) => updateField('teamName', e.target.value)}
                    disabled={actionLoading}
                  />
                  {errors.teamName ? (
                    <span className="field-error">{errors.teamName}</span>
                  ) : null}
                </div>

                <div className="form-field full-width">
                  <label>
                    COLLEGE / INSTITUTION
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="Shared by the whole team"
                    value={form.college}
                    onChange={(e) => updateField('college', e.target.value)}
                    disabled={actionLoading}
                  />
                  {errors.college ? (
                    <span className="field-error">{errors.college}</span>
                  ) : null}
                </div>

                <div className="form-field full-width">
                  <label>
                    TEAM SIZE
                    <ReqMark />
                  </label>
                  <div className="team-size-grid">
                    <button
                      type="button"
                      className={form.teamSize === 3 ? 'selected' : ''}
                      disabled={actionLoading}
                      onClick={() => setTeamSize(3)}
                    >
                      <strong>3</strong>
                      <span>MEMBERS · ₹300</span>
                    </button>
                    <button
                      type="button"
                      className={form.teamSize === 4 ? 'selected' : ''}
                      disabled={
                        actionLoading ||
                        (capacity != null && !capacity.allowed_team_sizes.includes(4))
                      }
                      onClick={() => setTeamSize(4)}
                    >
                      <strong>4</strong>
                      <span>MEMBERS · ₹400</span>
                    </button>
                  </div>
                  <p className="registration-description">
                    Member 04 appears only when you select 4. Fee is ₹100 ×
                    members, paid once for the team.
                    {capacity && capacity.open && !capacity.allowed_team_sizes.includes(4)
                      ? ` Only ${capacity.remaining} seats are left, so a team of 4 cannot register.`
                      : ''}
                  </p>
                  {errors.teamSize ? (
                    <span className="field-error">{errors.teamSize}</span>
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
                  CONTINUE →
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="registration-step" key={step} data-reveal>
              <p className="registration-eyebrow">02 / TEAM LEADER</p>
              <h1>
                PRIMARY
                <br />
                <span>CONTACT.</span>
              </h1>
              <p className="registration-description">
                Only the Team Leader needs email and phone. They receive the
                Digital Hacker Pass QR for the whole squad.
              </p>

              <div className="form-grid">
                <div className="form-field full-width">
                  <label>
                    FULL NAME
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="Team Leader full name"
                    value={form.leaderFullName}
                    onChange={handleLeaderInput('leaderFullName')}
                    disabled={actionLoading}
                  />
                  {errors.leaderFullName ? (
                    <span className="field-error">{errors.leaderFullName}</span>
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
                    value={form.leaderEmail}
                    onChange={handleLeaderInput('leaderEmail')}
                    disabled={actionLoading}
                  />
                  {errors.leaderEmail ? (
                    <span className="field-error">{errors.leaderEmail}</span>
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
                    value={form.leaderMobile}
                    onChange={(event) => {
                      updateField(
                        'leaderMobile',
                        event.target.value.replace(/\D/g, '').slice(0, 10),
                      )
                    }}
                    disabled={actionLoading}
                  />
                  {errors.leaderMobile ? (
                    <span className="field-error">{errors.leaderMobile}</span>
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
                    value={form.leaderDepartment}
                    onChange={handleLeaderInput('leaderDepartment')}
                    disabled={actionLoading}
                  />
                  {errors.leaderDepartment ? (
                    <span className="field-error">{errors.leaderDepartment}</span>
                  ) : null}
                </div>

                <div className="form-field">
                  <label>
                    YEAR OF STUDY
                    <ReqMark />
                  </label>
                  <select
                    value={form.leaderYear}
                    onChange={handleLeaderInput('leaderYear')}
                    disabled={actionLoading}
                  >
                    <option value="">Select year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.leaderYear ? (
                    <span className="field-error">{errors.leaderYear}</span>
                  ) : null}
                </div>

                <div className="form-field full-width">
                  <label>
                    REGISTER / ROLL NUMBER
                    <ReqMark />
                  </label>
                  <input
                    type="text"
                    placeholder="College register / roll number"
                    value={form.leaderRoll}
                    onChange={handleLeaderInput('leaderRoll')}
                    disabled={actionLoading}
                  />
                  {errors.leaderRoll ? (
                    <span className="field-error">{errors.leaderRoll}</span>
                  ) : null}
                </div>
              </div>

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
                  {actionLoading ? 'CHECKING EMAIL…' : 'CONTINUE →'}
                </button>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="registration-step" key={step} data-reveal>
              <p className="registration-eyebrow">03 / TEAMMATES + REVIEW</p>
              <h1>
                ADD YOUR
                <br />
                <span>SQUAD.</span>
              </h1>
              <p className="registration-description">
                Enter remaining members (no email or phone). Then confirm and
                continue to the team payment of ₹
                {form.teamSize === 4 ? '400' : '300'}.
              </p>

              {Array.from({ length: memberSlots }, (_, index) => {
                const member = form.members[index] ?? emptyMember()
                const label = `MEMBER ${String(index + 2).padStart(2, '0')}`
                return (
                  <div className="team-panel" key={`member-${index}`}>
                    <p className="registration-eyebrow">{label}</p>
                    <div className="form-grid">
                      <div className="form-field full-width">
                        <label>
                          FULL NAME
                          <ReqMark />
                        </label>
                        <input
                          type="text"
                          placeholder={`${label} full name`}
                          value={member.fullName}
                          onChange={(e) =>
                            updateMember(index, 'fullName', e.target.value)
                          }
                          disabled={actionLoading}
                        />
                        {errors[`member${index}_fullName`] ? (
                          <span className="field-error">
                            {errors[`member${index}_fullName`]}
                          </span>
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
                          value={member.department}
                          onChange={(e) =>
                            updateMember(index, 'department', e.target.value)
                          }
                          disabled={actionLoading}
                        />
                        {errors[`member${index}_department`] ? (
                          <span className="field-error">
                            {errors[`member${index}_department`]}
                          </span>
                        ) : null}
                      </div>

                      <div className="form-field">
                        <label>
                          YEAR OF STUDY
                          <ReqMark />
                        </label>
                        <select
                          value={member.year}
                          onChange={(e) =>
                            updateMember(index, 'year', e.target.value)
                          }
                          disabled={actionLoading}
                        >
                          <option value="">Select year</option>
                          {years.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        {errors[`member${index}_year`] ? (
                          <span className="field-error">
                            {errors[`member${index}_year`]}
                          </span>
                        ) : null}
                      </div>

                      <div className="form-field full-width">
                        <label>
                          REGISTER / ROLL NUMBER
                          <ReqMark />
                        </label>
                        <input
                          type="text"
                          placeholder="College register / roll number"
                          value={member.rollNumber}
                          onChange={(e) =>
                            updateMember(index, 'rollNumber', e.target.value)
                          }
                          disabled={actionLoading}
                        />
                        {errors[`member${index}_rollNumber`] ? (
                          <span className="field-error">
                            {errors[`member${index}_rollNumber`]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="review-container">
                <div className="review-section">
                  <div className="review-heading">
                    <span>01</span>
                    <strong>TEAM</strong>
                    <button type="button" onClick={() => setStep(1)}>
                      EDIT
                    </button>
                  </div>
                  <div className="review-grid">
                    <div>
                      <span>TEAM</span>
                      <strong>{form.teamName || '—'}</strong>
                    </div>
                    <div>
                      <span>COLLEGE</span>
                      <strong>{form.college || '—'}</strong>
                    </div>
                    <div>
                      <span>SIZE</span>
                      <strong>
                        {form.teamSize ? `${form.teamSize} MEMBERS` : '—'}
                      </strong>
                    </div>
                    <div>
                      <span>FEE</span>
                      <strong>
                        {form.teamSize === 3
                          ? '₹300'
                          : form.teamSize === 4
                            ? '₹400'
                            : '—'}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="review-section">
                  <div className="review-heading">
                    <span>02</span>
                    <strong>TEAM LEADER</strong>
                    <button type="button" onClick={() => setStep(2)}>
                      EDIT
                    </button>
                  </div>
                  <div className="review-grid">
                    <div>
                      <span>NAME</span>
                      <strong>{form.leaderFullName || '—'}</strong>
                    </div>
                    <div>
                      <span>EMAIL</span>
                      <strong>{form.leaderEmail || '—'}</strong>
                    </div>
                    <div>
                      <span>MOBILE</span>
                      <strong>{form.leaderMobile || '—'}</strong>
                    </div>
                    <div>
                      <span>DEPT</span>
                      <strong>{form.leaderDepartment || '—'}</strong>
                    </div>
                    <div>
                      <span>YEAR</span>
                      <strong>{form.leaderYear || '—'}</strong>
                    </div>
                    <div>
                      <span>ROLL</span>
                      <strong>{form.leaderRoll || '—'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="confirmation-note">
                <span>✓</span>
                <p>
                  By confirming, you verify that all team details are correct.
                  Registration is saved only after you submit the team payment
                  proof on the next step.
                </p>
              </div>

              <div className="registration-actions">
                <button
                  type="button"
                  className="secondary-button step-back-button"
                  onClick={previousStep}
                  disabled={submitting || actionLoading}
                >
                  ← BACK
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={submitting || actionLoading}
                >
                  {actionLoading ? 'CHECKING…' : 'CONTINUE TO PAYMENT →'}
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
