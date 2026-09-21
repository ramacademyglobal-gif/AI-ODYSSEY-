"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { EVENT_CONFIG } from "@/registration/config";
import {
  validatePaymentScreenshot,
  validateTransactionId,
} from "@/registration/utils/paymentScreenshot";

/** Payment QR + proof upload + WhatsApp actions after registration succeeds. */
export function PostRegistrationActions({
  onPaymentVerified,
  showPaymentProof = true,
  showWhatsApp = true,
  teamSize = null,
}: {
  /** Called after local proof checks pass; may persist registration to the DB. */
  onPaymentVerified?: (proof: {
    file: File
    transactionId: string
  }) => void | Promise<void>
  /** When false, payment QR / proof UI is hidden. */
  showPaymentProof?: boolean
  /** When false, Squad channel card is hidden. */
  showWhatsApp?: boolean
  /** Selected team size — used to show team total (₹300 / ₹400). */
  teamSize?: 3 | 4 | null
}) {
  const [transactionId, setTransactionId] = useState('')
  const [fileName, setFileName] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [screenshotValid, setScreenshotValid] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [txnError, setTxnError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [settled, setSettled] = useState(false)
  const previewRef = useRef<string | null>(null)
  const onVerifiedRef = useRef(onPaymentVerified)

  useEffect(() => {
    onVerifiedRef.current = onPaymentVerified
  }, [onPaymentVerified])

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), 700)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    return () => {
      if (previewRef.current) {
        URL.revokeObjectURL(previewRef.current)
      }
    }
  }, [])

  const clearPreview = () => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
    setPreviewUrl(null)
    setScreenshotValid(false)
    setProofFile(null)
  }

  const markUnverified = () => {
    setSubmitted(false)
  }

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    markUnverified()
    setFormError(null)
    setFileError(null)
    setFileName('')
    clearPreview()

    if (!file) return

    setChecking(true)
    try {
      const result = await validatePaymentScreenshot(file)
      if (!result.ok) {
        setScreenshotValid(false)
        setFileError(
          result.message ??
            'Upload the correct payment screenshot image.',
        )
        event.target.value = ''
        return
      }

      previewRef.current = result.previewUrl ?? null
      setPreviewUrl(result.previewUrl ?? null)
      setFileName(file.name)
      setProofFile(file)
      setScreenshotValid(true)
      setFileError(null)
    } catch {
      setScreenshotValid(false)
      setFileError(
        'Could not validate that image. Upload the correct payment screenshot.',
      )
      event.target.value = ''
    } finally {
      setChecking(false)
    }
  }

  const onSubmitProof = async (event: FormEvent) => {
    event.preventDefault()
    if (checking || submitting || submitted) return

    setFormError(null)
    markUnverified()

    const txnIssue = validateTransactionId(transactionId)
    setTxnError(txnIssue)

    const hasValidScreenshot =
      screenshotValid && Boolean(previewUrl) && Boolean(fileName) && Boolean(proofFile)
    if (!hasValidScreenshot) {
      setFileError(
        fileError ||
          'Upload the correct payment screenshot image (UPI confirmation after scanning the QR).',
      )
    }

    if (!hasValidScreenshot || txnIssue || !proofFile) {
      setFormError('Enter the required details correctly.')
      return
    }

    setSubmitting(true)
    try {
      await onVerifiedRef.current?.({
        file: proofFile,
        transactionId: transactionId.trim(),
      })
      setSubmitted(true)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not save registration. Try again.'
      setFormError(message)
      setSubmitted(false)
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = screenshotValid && !checking && !submitting && !submitted
  const perPerson = EVENT_CONFIG.payment.amountPerPerson
  const teamTotal =
    teamSize === 3 || teamSize === 4 ? teamSize * perPerson : null

  return (
    <section className="success-next-steps" aria-label="Next steps">
      {showPaymentProof ? (
      <div className={`success-payment${settled ? ' is-settled' : ''}`}>
        <h3 className="success-payment__heading">
          {EVENT_CONFIG.payment.heading}
        </h3>
        <p className="success-payment__amount" role="status">
          {teamTotal ? (
            <>
              <strong>Team total ₹{teamTotal}</strong>
              <span>
                {' '}
                (₹{perPerson} × {teamSize} members)
              </span>
            </>
          ) : (
            <>
              <strong>Pay ₹{perPerson} per person</strong>
              <span> — team of 3 = ₹300 · team of 4 = ₹400</span>
            </>
          )}
        </p>
        <p className="success-payment__hint">
          Scan the UPI QR for the full team amount
          {teamTotal ? ` (₹${teamTotal})` : ''}, then upload a screenshot
          showing the Transaction ID (min. 10 characters).
        </p>
        <ul className="success-payment__notices" aria-label="Payment rules">
          {EVENT_CONFIG.payment.notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
        <div className="success-payment__frame">
          <img
            src={EVENT_CONFIG.payment.qrImageSrc}
            alt={`${EVENT_CONFIG.name} payment QR code`}
            className="success-payment__qr"
            width={320}
            height={320}
            decoding="async"
          />
        </div>

        <form className="success-payment-proof" onSubmit={(e) => void onSubmitProof(e)} noValidate>
          <label className="success-payment-proof__label" htmlFor="payment-screenshot">
            Payment screenshot
          </label>
          <label
            className={`success-payment-proof__drop ${checking ? 'is-checking' : ''}`}
            htmlFor="payment-screenshot"
          >
            <span className="success-payment-proof__drop-title">
              {checking ? 'Reading screenshot…' : 'Upload payment screenshot'}
            </span>
            <span className="success-payment-proof__drop-sub">
              JPG / PNG / WEBP · Transaction ID / UTR must be visible in the image
            </span>
            {fileName && screenshotValid ? (
              <span className="success-payment-proof__file">{fileName}</span>
            ) : null}
          </label>
          <input
            id="payment-screenshot"
            className="success-payment-proof__input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={(e) => void onFileChange(e)}
            disabled={checking || submitting}
          />

          {previewUrl && screenshotValid ? (
            <div className="success-payment-proof__preview-wrap">
              <img
                src={previewUrl}
                alt="Uploaded payment screenshot preview"
                className="success-payment-proof__preview"
              />
            </div>
          ) : null}

          {fileError ? (
            <p className="success-payment-proof__error" role="alert">
              {fileError}
            </p>
          ) : null}

          <label className="success-payment-proof__label" htmlFor="transaction-id">
            Transaction ID
          </label>
          <input
            id="transaction-id"
            className="success-payment-proof__txn"
            type="text"
            value={transactionId}
            onChange={(e) => {
              setTransactionId(e.target.value)
              setTxnError(null)
              markUnverified()
              setFormError(null)
            }}
            placeholder="Min. 10 characters"
            autoComplete="off"
            spellCheck={false}
            minLength={10}
            maxLength={64}
            disabled={submitting || submitted}
          />
          {txnError ? (
            <p className="success-payment-proof__error" role="alert">
              {txnError}
            </p>
          ) : null}

          {formError ? (
            <p className="success-payment-proof__error" role="alert">
              {formError}
            </p>
          ) : null}

          {submitted ? (
            <p className="success-payment-proof__ok" role="status">
              Payment proof verified. Registration saved. Print and download are now unlocked.
            </p>
          ) : null}

          <button
            type="submit"
            className="primary-button success-payment-proof__submit"
            disabled={checking || submitting || submitted}
            aria-disabled={!canSubmit}
          >
            {checking
              ? 'VALIDATING…'
              : submitting
                ? 'SAVING REGISTRATION…'
                : 'SUBMIT PAYMENT PROOF →'}
          </button>
        </form>
      </div>
      ) : null}

      {showWhatsApp ? (
      <div className={`success-whatsapp${settled ? ' is-settled' : ''}`}>
        <h3 className="success-whatsapp__heading">Squad channel</h3>
        <p className="success-whatsapp__hint">
          Join the official participant WhatsApp group for updates and team
          coordination.
        </p>
        <a
          className="primary-button success-whatsapp__link"
          href={EVENT_CONFIG.whatsapp.groupUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          {EVENT_CONFIG.whatsapp.label}
        </a>
      </div>
      ) : null}
    </section>
  )
}
