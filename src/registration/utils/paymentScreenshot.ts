const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const MAX_BYTES = 5 * 1024 * 1024
const MIN_TXN_LENGTH = 10
const MAX_TXN_LENGTH = 128
const TXN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9\s\-_/]*$/

export type PaymentScreenshotCheck = {
  ok: boolean
  message?: string
  previewUrl?: string
}

export type TeamFeeAmount = 300 | 400

/** Display helper — team fee totals shown on the payment card. */
export function expectedFeeForTeamSize(
  teamSize: 3 | 4 | null | undefined,
): TeamFeeAmount | null {
  if (teamSize === 3) return 300
  if (teamSize === 4) return 400
  return null
}

/**
 * Accept any payment / money screenshot image.
 * No OCR, amount, layout, or UTR-in-image checks — organizers verify manually.
 */
export async function validatePaymentScreenshot(
  file: File,
  _options?: { teamSize?: 3 | 4 | null },
): Promise<PaymentScreenshotCheck> {
  void _options

  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      message: 'Upload a JPG, PNG, or WEBP image of your payment screenshot.',
    }
  }

  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      message: 'Payment screenshot must be under 5 MB.',
    }
  }

  const previewUrl = URL.createObjectURL(file)
  return { ok: true, previewUrl }
}

export function validateTransactionId(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return 'Transaction ID is required (minimum 10 characters).'
  }
  if (trimmed.length < MIN_TXN_LENGTH) {
    return `Transaction ID must be at least ${MIN_TXN_LENGTH} characters.`
  }
  if (trimmed.length > MAX_TXN_LENGTH) {
    return `Transaction ID must be at most ${MAX_TXN_LENGTH} characters.`
  }
  if (!TXN_PATTERN.test(trimmed)) {
    return 'Enter a valid transaction ID (letters and numbers).'
  }
  return null
}

export { MIN_TXN_LENGTH }
