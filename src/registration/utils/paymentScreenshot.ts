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
const MAX_TXN_LENGTH = 64
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
      buckets.add(((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5))

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
      if (
        (b > 120 && b > r + 15 && b >= g) ||
        (g > 120 && g > r + 15 && g > b + 10) ||
        (r > 90 && b > 120 && g < 110) ||
        (r > 220 && g > 220 && b > 220 && sat < 0.12)
      ) {
        uiChrome += 1
      }

      const isGreen = g > 130 && g > r + 25 && g > b + 15
      if (isGreen) successGreen += 1

      if (y < topLimit) {
        topPixels += 1
        if (g > 140 && g > r + 20 && g > b + 10) topGreen += 1
      }
    }
    rowLum[y] = rowSum / w
  }

  let bandJumps = 0
  for (let y = 1; y < h; y++) {
    if (Math.abs((rowLum[y] ?? 0) - (rowLum[y - 1] ?? 0)) > 18) {
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

function looksLikePaymentScreenshotLayout(
  stats: LayoutStats,
  aspect: number,
): boolean {
  if (aspect < 1.15) return false
  if (stats.skinRatio > 0.045) return false
  if (stats.flatRatio < 0.22) return false
  if (stats.uiChromeRatio < 0.08 && stats.successGreenRatio < 0.015) {
    return false
  }
  if (stats.horizontalBandScore < 0.04) return false
  if (stats.localVariance > 28 && stats.flatRatio < 0.3) return false
  return true
}

function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const maxW = 720
  const scale = Math.min(1, maxW / img.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(img.width * scale))
  canvas.height = Math.max(1, Math.round(img.height * scale))
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
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
    /bank\s*reference/i.test(text)

  // Typical UPI UTR / ref codes are long alphanumeric tokens.
  const codeHit = /(?:^|[^A-Z0-9])[0-9A-Z]{12,}(?:[^A-Z0-9]|$)/i.test(
    text.replace(/\s/g, ''),
  )

  return labelHit || codeHit
}

async function extractScreenshotText(img: HTMLImageElement): Promise<string> {
  const canvas = imageToCanvas(img)
  const worker = await createWorker('eng')
  try {
    const result = await worker.recognize(canvas)
    return result.data.text || ''
  } finally {
    await worker.terminate()
  }
}

/**
 * Validates payment confirmation screenshots.
 * Requires a layout with a clearly visible Transaction ID / UTR
 * (rejects summary-only “Payment Successful” screens).
 */
export async function validatePaymentScreenshot(
  file: File,
): Promise<PaymentScreenshotCheck> {
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

  if (width < 240 || height < 320) {
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

  let ocrText: string
  try {
    ocrText = await extractScreenshotText(uploaded)
  } catch {
    URL.revokeObjectURL(previewUrl)
    return {
      ok: false,
      message:
        'Could not read text from this image. Upload a clearer screenshot where the Transaction ID / UTR is visible.',
    }
  }

  const looksLikeSummaryCopy =
    /payment\s+successful/i.test(ocrText) &&
    !hasVisibleTransactionId(ocrText)

  if (looksLikeSummaryCopy || !hasVisibleTransactionId(ocrText)) {
    URL.revokeObjectURL(previewUrl)
    return { ok: false, message: REJECT_NO_TXN_VISIBLE }
  }

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
