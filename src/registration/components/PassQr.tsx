"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type PassQrProps = {
  value: string
  size?: number
  className?: string
  alt?: string
}

export function PassQr({
  value,
  size = 128,
  className,
  alt = 'Check-in QR code',
}: PassQrProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void QRCode.toDataURL(value, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size * 2,
      color: {
        dark: '#08090d',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (cancelled) return
        setDataUrl(url)
        setError(null)
      })
      .catch(() => {
        if (cancelled) return
        setDataUrl(null)
        setError('QR unavailable')
      })

    return () => {
      cancelled = true
    }
  }, [value, size])

  if (error) {
    return (
      <div className={className} style={{ width: size, height: size }}>
        {error}
      </div>
    )
  }

  if (!dataUrl) {
    return (
      <div className={className} style={{ width: size, height: size }} aria-busy>
        …
      </div>
    )
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      className={className}
      width={size}
      height={size}
      decoding="async"
    />
  )
}
