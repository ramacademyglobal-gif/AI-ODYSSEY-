import { createWorker } from "tesseract.js";
import { EVENT_CONFIG } from "@/registration/config";

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

const REJECT_LAYOUT =
  'Upload the correct payment screenshot image (UPI / bank confirmation screen after scanning the QR).'

const REJECT_NO_TXN_VISIBLE =
  'Transaction ID / UTR is not visible in this screenshot. Open “View details” / receipt in your UPI app and upload a screenshot where the Transaction ID is clearly visible so organizers can cross-check.'

const REJECT_SUMMARY_ONLY =
  'This looks like a “Payment Successful” summary screen without the Transaction ID. Tap View details / Share receipt, then upload the screen that shows the UTR / Transaction ID.'

export type PaymentScreenshotCheck = {
  ok: boolean
  message?: string
  previewUrl?: string
  detectedAmount?: number | null
}

export type TeamFeeAmount = 300 | 400

export function expectedFeeForTeamSize(teamSize: 3 | 4 | null | undefined): TeamFeeAmount | null {
  if (teamSize === 3) return 300
  if (teamSize === 4) return 400
  return null
}

function rejectWrongAmount(
  expected: TeamFeeAmount | null,
  found: number | null,
): string {
  if (expected === 300 || expected === 400) {
    return `Payment screenshot must show ₹${expected} (team of ${expected === 300 ? 3 : 4}). ${
      found != null ? `Detected ₹${found} instead.` : 'Could not read ₹300 or ₹400 from this image.'
    }`
  }
  return `Payment screenshot must show ₹300 or ₹400 (full team fee). ${
    found != null ? `Detected ₹${found} instead.` : 'Could not read the paid amount.'
  }`
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read that image. Try another file.'))
    }
    img.src = url
  })
}

function loadImageFromUrl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () =>
      reject(new Error('Could not load the official payment QR for validation.'))
    img.src = src
  })
}

function sampleGrid(img: HTMLImageElement, size = 24): Float32Array {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return new Float32Array(size * size)
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const out = new Float32Array(size * size)
  for (let i = 0; i < size * size; i++) {
    const o = i * 4
    out[i] =
      (data[o]! * 0.299 + data[o + 1]! * 0.587 + data[o + 2]! * 0.114) / 255
  }
  return out
}

function meanAbsDiff(a: Float32Array, b: Float32Array): number {
  const n = Math.min(a.length, b.length)
  let sum = 0
  for (let i = 0; i < n; i++) {
    sum += Math.abs((a[i] ?? 0) - (b[i] ?? 0))
  }
  return sum / n
}

function isSkinTone(r: number, g: number, b: number): boolean {
  return (
    r > 95 &&
    g > 40 &&
    b > 20 &&
    r > g &&
    r > b &&
    r - Math.min(g, b) > 15 &&
    Math.abs(r - g) > 15
  )
}

type LayoutStats = {
  skinRatio: number
  flatRatio: number
  uiChromeRatio: number
  successGreenRatio: number
  topGreenRatio: number
  bottomPhotoRatio: number
  horizontalBandScore: number
  uniqueBuckets: number
  localVariance: number
  darkRatio: number
  meanLuminance: number
}

function analyzeLayout(img: HTMLImageElement): LayoutStats {
  const w = 96
  const h = 160
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    return {
      skinRatio: 1,
      flatRatio: 0,
      uiChromeRatio: 0,
      successGreenRatio: 0,
      topGreenRatio: 0,
      bottomPhotoRatio: 0,
      horizontalBandScore: 0,
      uniqueBuckets: 0,
      localVariance: 1,
      darkRatio: 0,
      meanLuminance: 0.5,
    }
  }

  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const total = w * h
  const topLimit = Math.floor(h * 0.28)
  const bottomStart = Math.floor(h * 0.55)

  let skin = 0
  let flat = 0
  let uiChrome = 0
  let successGreen = 0
  let topGreen = 0
  let topPixels = 0
  let bottomPhoto = 0
  let dark = 0
  let lumSum = 0
  const buckets = new Set<number>()
  let varianceSum = 0
  let varianceCount = 0
  const rowLum = new Float32Array(h)

  for (let y = 0; y < h; y++) {
    let rowSum = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      const lum = r * 0.299 + g * 0.587 + b * 0.114
      rowSum += lum
      lumSum += lum
      buckets.add(((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5))

      if (lum < 55) dark += 1
      if (isSkinTone(r, g, b)) skin += 1

      if (x < w - 1 && y < h - 1) {
        const iRight = i + 4
        const iDown = i + w * 4
        const d1 =
          Math.abs(r - data[iRight]!) +
          Math.abs(g - data[iRight + 1]!) +
          Math.abs(b - data[iRight + 2]!)
        const d2 =
          Math.abs(r - data[iDown]!) +
          Math.abs(g - data[iDown + 1]!) +
          Math.abs(b - data[iDown + 2]!)
        if (d1 < 18 && d2 < 18) flat += 1

        const lumR =
          data[iRight]! * 0.299 +
          data[iRight + 1]! * 0.587 +
          data[iRight + 2]! * 0.114
        varianceSum += Math.abs(lum - lumR)
        varianceCount += 1

        if (y >= bottomStart && (d1 > 35 || d2 > 35)) {
          bottomPhoto += 1
        }
      }

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / max
      // Light + dark UPI chrome (blues / greens / purple accents / near-white)
      if (
        (b > 90 && b > r + 12 && b >= g - 5) ||
        (g > 100 && g > r + 15 && g > b + 8) ||
        (r > 70 && b > 100 && g < 120) ||
        (r > 200 && g > 200 && b > 200 && sat < 0.15) ||
        (r < 40 && g < 40 && b < 40)
      ) {
        uiChrome += 1
      }

      // Light + dark success greens (incl. muted checkmarks)
      const isGreen =
        (g > 110 && g > r + 18 && g > b + 10) ||
        (g > 90 && g > r + 25 && g > b + 20)
      if (isGreen) successGreen += 1

      if (y < topLimit) {
        topPixels += 1
        if (g > 120 && g > r + 15 && g > b + 8) topGreen += 1
      }
    }
    rowLum[y] = rowSum / w
  }

  let bandJumps = 0
  for (let y = 1; y < h; y++) {
    if (Math.abs((rowLum[y] ?? 0) - (rowLum[y - 1] ?? 0)) > 12) {
      bandJumps += 1
    }
  }

  const neighborSamples = Math.max((w - 1) * (h - 1), 1)
  const bottomNeighborSamples = Math.max(
    (w - 1) * Math.max(h - bottomStart - 1, 1),
    1,
  )

  return {
    skinRatio: skin / total,
    flatRatio: flat / neighborSamples,
    uiChromeRatio: uiChrome / total,
    successGreenRatio: successGreen / total,
    topGreenRatio: topPixels ? topGreen / topPixels : 0,
    bottomPhotoRatio: bottomPhoto / bottomNeighborSamples,
    horizontalBandScore: bandJumps / h,
    uniqueBuckets: buckets.size,
    localVariance: varianceCount ? varianceSum / varianceCount : 0,
    darkRatio: dark / total,
    meanLuminance: lumSum / total / 255,
  }
}

/** GPay / similar “Payment Successful” summary without details. */
function isSummaryOnlySuccessScreen(stats: LayoutStats): boolean {
  return (
    stats.topGreenRatio > 0.45 &&
    stats.successGreenRatio > 0.12 &&
    stats.bottomPhotoRatio > 0.12
  )
}

/**
 * Soft layout gate for light + dark UPI apps.
 * OCR (txn + amount) is the authoritative check afterward.
 */
function looksLikePaymentScreenshotLayout(
  stats: LayoutStats,
  aspect: number,
): boolean {
  // Allow near-square crops from share sheets; still prefer portrait.
  if (aspect < 0.85) return false
  // Selfies / people photos
  if (stats.skinRatio > 0.12) return false
  // Completely noisy photos
  if (stats.flatRatio < 0.08 && stats.uniqueBuckets > 140) return false

  const isDarkUi = stats.darkRatio > 0.35 || stats.meanLuminance < 0.42
  if (isDarkUi) {
    // Dark GPay / PhonePe: low flat ratio is OK; need some structure or accent color
    if (
      stats.uiChromeRatio < 0.02 &&
      stats.successGreenRatio < 0.004 &&
      stats.horizontalBandScore < 0.02
    ) {
      return false
    }
    return true
  }

  // Light UPI screens
  if (stats.flatRatio < 0.12) return false
  if (
    stats.uiChromeRatio < 0.04 &&
    stats.successGreenRatio < 0.008 &&
    stats.horizontalBandScore < 0.025
  ) {
    return false
  }
  return true
}

function imageToCanvas(
  img: HTMLImageElement,
  options?: { invert?: boolean; maxW?: number },
): HTMLCanvasElement {
  const maxW = options?.maxW ?? 900
  const scale = Math.min(1, maxW / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const filters = ['contrast(1.2)', 'brightness(1.08)']
    if (options?.invert) filters.push('invert(1)')
    ctx.filter = filters.join(' ')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
  }
  return canvas
}

/** Crop the usual GPay/PhonePe amount band (large ₹300 / ₹400). */
function amountBandCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  const top = Math.floor(srcH * 0.1)
  const height = Math.max(40, Math.floor(srcH * 0.22))
  const left = Math.floor(srcW * 0.08)
  const width = Math.max(40, Math.floor(srcW * 0.84))

  const canvas = document.createElement('canvas')
  // Upscale — large display fonts OCR better when bigger
  canvas.width = 720
  canvas.height = Math.max(80, Math.round((height / width) * 720))
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.filter = 'grayscale(1) contrast(1.35) brightness(1.1) invert(1)'
    ctx.drawImage(img, left, top, width, height, 0, 0, canvas.width, canvas.height)
    ctx.filter = 'none'
  }
  return canvas
}

function hasVisibleTransactionId(ocrText: string): boolean {
  const text = ocrText.replace(/\s+/g, ' ').trim()
  if (!text) return false

  const labelHit =
    /transaction\s*id/i.test(text) ||
    /upi\s*transaction\s*id/i.test(text) ||
    /\butr\b/i.test(text) ||
    /reference\s*(no\.?|number|id)/i.test(text) ||
    /txn\s*(id|ref)/i.test(text) ||
    /payment\s*id/i.test(text) ||
    /bank\s*reference/i.test(text) ||
    /google\s*transaction\s*id/i.test(text) ||
    /phonepe\s*transaction\s*id/i.test(text)

  // Typical UPI UTR / ref codes are long alphanumeric tokens (12+).
  const compact = text.replace(/\s/g, '')
  const codeHit = /(?:^|[^A-Z0-9])[0-9A-Z]{12,}(?:[^A-Z0-9]|$)/i.test(compact)

  return labelHit || codeHit
}

function looksLikeUpiPaymentCopy(ocrText: string): boolean {
  return (
    /upi/i.test(ocrText) ||
    /google\s*pay|gpay|phonepe|paytm|bhim/i.test(ocrText) ||
    /payment\s+(of|successful|completed)|completed|transaction\s+successful/i.test(
      ocrText,
    ) ||
    /transaction\s*id|utr/i.test(ocrText) ||
    /paid\s+to|sent\s+to|receiver|debited\s+from/i.test(ocrText)
  )
}

/**
 * Pull paid amounts from OCR.
 * Tesseract often misreads ₹ as %, ¥, R, etc. — treat those as currency.
 */
export function extractRupeeAmounts(ocrText: string): number[] {
  const found = new Set<number>()
  const text = ocrText
    .replace(/\u20b9/g, '₹')
    .replace(/[|]/g, ' ')

  const currency = String.raw`(?:[₹%¥€£$]|rs\.?|inr|inr\.?)`
  const patterns: RegExp[] = [
    new RegExp(`${currency}\\s*([0-9]{1,5})(?:\\.[0-9]{1,2})?`, 'gi'),
    /\b([0-9]{1,5})(?:\.[0-9]{1,2})?\s*(?:rs\.?|inr|rupees)\b/gi,
    /(?:paid|amount|total|sent|debited)\s*(?:of|from|:)?\s*(?:[₹%¥]|rs\.?)?\s*([0-9]{1,5})(?:\.[0-9]{1,2})?/gi,
    // "Tharun %300" / name then amount on PhonePe rows
    /[A-Za-z]{2,}\s+(?:[₹%¥]|rs\.?)?\s*([34]00)(?:\.0+)?\b/g,
  ]

  for (const pattern of patterns) {
    pattern.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = pattern.exec(text)) !== null) {
      const n = Number(match[1])
      if (Number.isFinite(n) && n > 0 && n <= 100000) {
        found.add(Math.round(n))
      }
    }
  }

  // Bare team fees — only when this looks like a UPI receipt (avoid random 300s)
  const hasCurrencyGlyph = /[₹%¥€£$]|rs\.?|inr/i.test(text)
  if (looksLikeUpiPaymentCopy(text) || found.size > 0 || hasCurrencyGlyph) {
    const bare = text.matchAll(/\b([34]00)(?:\.0+)?\b/g)
    for (const m of bare) {
      found.add(Number(m[1]))
    }
  }

  // Digit-only OCR band sometimes returns just "300" / "400"
  const trimmed = text.replace(/\s+/g, ' ').trim()
  if (/^(?:[₹%¥]|rs\.?)?\s*[34]00(?:\.0+)?$/i.test(trimmed)) {
    found.add(Number(trimmed.replace(/\D/g, '').slice(0, 3)))
  }

  return [...found]
}

export function resolvePaidTeamFee(
  amounts: number[],
  expected: TeamFeeAmount | null,
): { ok: boolean; amount: number | null } {
  const teamFees = amounts.filter((a) => a === 300 || a === 400)
  if (expected === 300 || expected === 400) {
    if (teamFees.includes(expected)) {
      return { ok: true, amount: expected }
    }
    const wrongFee = teamFees.find((a) => a !== expected) ?? null
    const other = amounts.find((a) => a !== expected) ?? null
    return { ok: false, amount: wrongFee ?? other }
  }

  if (teamFees.length >= 1) {
    return { ok: true, amount: teamFees[0]! }
  }
  return { ok: false, amount: amounts[0] ?? null }
}

async function extractScreenshotText(
  img: HTMLImageElement,
  isDarkUi: boolean,
): Promise<string> {
  const worker = await createWorker('eng')
  const chunks: string[] = []

  try {
    const primary = imageToCanvas(img, { invert: false })
    chunks.push((await worker.recognize(primary)).data.text || '')

    // Dark UPI screens: also OCR an inverted copy (white-on-black → black-on-white)
    if (isDarkUi) {
      const inverted = imageToCanvas(img, { invert: true })
      chunks.push((await worker.recognize(inverted)).data.text || '')
    }

    // Dedicated amount-band pass (GPay large ₹300 often skipped in full-page OCR)
    const band = amountBandCanvas(img)
    await worker.setParameters({
      // PSM.SPARSE_TEXT = 11 — finds large isolated amounts
      tessedit_pageseg_mode: '11' as never,
      tessedit_char_whitelist: '0123456789',
    })
    chunks.push((await worker.recognize(band)).data.text || '')

    // Reset params and try currency-aware band once more
    await worker.setParameters({
      tessedit_pageseg_mode: '6' as never,
      tessedit_char_whitelist: '',
    })
    const bandFull = amountBandCanvas(img)
    chunks.push((await worker.recognize(bandFull)).data.text || '')
  } finally {
    await worker.terminate()
  }

  return chunks.join('\n')
}

/**
 * Validates payment confirmation screenshots (light + dark UPI apps).
 * Requires visible Transaction ID / UTR and paid amount ₹300 or ₹400
 * matching the selected team size when provided.
 */
export async function validatePaymentScreenshot(
  file: File,
  options?: { teamSize?: 3 | 4 | null },
): Promise<PaymentScreenshotCheck> {
  const expected = expectedFeeForTeamSize(options?.teamSize ?? null)

  if (!ALLOWED_TYPES.has(file.type)) {
    return {
      ok: false,
      message:
        'Upload a payment screenshot image (JPG, PNG, or WEBP) where the Transaction ID is visible.',
    }
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return {
      ok: false,
      message: 'Payment screenshot must be under 5 MB.',
    }
  }

  let uploaded: HTMLImageElement
  try {
    uploaded = await loadImageFromFile(file)
  } catch (err) {
    return {
      ok: false,
      message:
        err instanceof Error
          ? err.message
          : 'Could not read that image. Upload a screenshot with the Transaction ID visible.',
    }
  }

  const previewUrl = uploaded.src
  const { width, height } = uploaded

  if (width < 200 || height < 280) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_LAYOUT }
  }

  let officialQr: HTMLImageElement | undefined
  try {
    officialQr = await loadImageFromUrl(EVENT_CONFIG.payment.qrImageSrc)
  } catch {
    officialQr = undefined
  }

  if (officialQr) {
    const diff = meanAbsDiff(sampleGrid(uploaded), sampleGrid(officialQr))
    if (diff < 0.1) {
      URL.revokeObjectURL(previewUrl)
      return {
        ok: false,
        message:
          'That looks like the payment QR itself. Scan the QR to pay, open payment details, then upload the screenshot with the Transaction ID visible.',
      }
    }
  }

  const aspect = height / width
  const stats = analyzeLayout(uploaded)

  if (!looksLikePaymentScreenshotLayout(stats, aspect)) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_LAYOUT }
  }

  if (isSummaryOnlySuccessScreen(stats)) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_SUMMARY_ONLY }
  }

  const isDarkUi = stats.darkRatio > 0.35 || stats.meanLuminance < 0.42

  let ocrText: string
  try {
    ocrText = await extractScreenshotText(uploaded, isDarkUi)
  } catch {
    URL.revokeObjectURL(previewUrl)
    return {
      ok: false,
      message:
        'Could not read text from this image. Upload a clearer screenshot where the Transaction ID / UTR and amount are visible.',
    }
  }

  const looksLikeSummaryCopy =
    /payment\s+successful/i.test(ocrText) &&
    !hasVisibleTransactionId(ocrText)

  if (looksLikeSummaryCopy || !hasVisibleTransactionId(ocrText)) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_NO_TXN_VISIBLE }
  }

  // Soft check: if OCR found almost no payment wording, still allow when txn + amount pass
  if (!looksLikeUpiPaymentCopy(ocrText) && stats.skinRatio > 0.06) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_LAYOUT }
  }

  const amounts = extractRupeeAmounts(ocrText)
  const fee = resolvePaidTeamFee(amounts, expected)
  if (!fee.ok) {
    URL.revokeObjectURL(previewUrl)
    return {
      ok: false,
      message: rejectWrongAmount(expected, fee.amount),
      detectedAmount: fee.amount,
    }
  }

  return { ok: true, previewUrl, detectedAmount: fee.amount }
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
