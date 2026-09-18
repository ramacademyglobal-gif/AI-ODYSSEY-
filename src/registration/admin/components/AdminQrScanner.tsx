"use client";

import { useEffect, useId, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

type Props = {
  onScan: (rawValue: string) => void
  paused?: boolean
}

type CameraState =
  | 'idle'
  | 'starting'
  | 'scanning'
  | 'permission-denied'
  | 'unavailable'

/**
 * Camera QR scanner. Failures stay local — never throw into the page tree
 * (blank admin check-in was caused by Html5Qrcode constructor / Strict Mode races).
 */
export function AdminQrScanner({ onScan, paused = false }: Props) {
  const reactId = useId().replace(/:/g, '')
  const elementId = `admin-qr-reader-${reactId}`
  const onScanRef = useRef(onScan)
  const pausedRef = useRef(paused)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastValueRef = useRef('')
  const lastAtRef = useRef(0)

  const [cameraState, setCameraState] = useState<CameraState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let scanner: Html5Qrcode | null = null

    async function start() {
      setCameraState('starting')
      setMessage('Requesting camera access…')

      const host = document.getElementById(elementId)
      if (!host) {
        setCameraState('unavailable')
        setMessage('Scanner mount failed. Paste a QR URL or token below.')
        return
      }

      try {
        scanner = new Html5Qrcode(elementId)
        scannerRef.current = scanner
      } catch (err) {
        if (cancelled) return
        setCameraState('unavailable')
        setMessage(
          err instanceof Error
            ? err.message
            : 'Camera scanner failed to start. Paste a QR URL below.',
        )
        return
      }

      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 8, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (pausedRef.current) return
            const now = Date.now()
            if (
              decoded === lastValueRef.current &&
              now - lastAtRef.current < 2500
            ) {
              return
            }
            lastValueRef.current = decoded
            lastAtRef.current = now
            onScanRef.current(decoded)
          },
          () => {
            // ignore per-frame not-found noise
          },
        )
        if (!cancelled) {
          setCameraState('scanning')
          setMessage('Point the camera at a Digital Hacker Pass QR.')
        }
      } catch (err) {
        if (cancelled) return
        const text = err instanceof Error ? err.message : String(err)
        if (/NotAllowedError|Permission|denied/i.test(text)) {
          setCameraState('permission-denied')
          setMessage(
            'Camera permission denied. Allow camera access or paste a QR URL below.',
          )
        } else {
          setCameraState('unavailable')
          setMessage(
            'Camera unavailable on this device. Paste a QR URL or token below.',
          )
        }
        try {
          scanner.clear()
        } catch {
          // ignore
        }
        scannerRef.current = null
      }
    }

    void start()

    return () => {
      cancelled = true
      const active = scannerRef.current
      scannerRef.current = null
      if (!active) return
      void active
        .stop()
        .catch(() => undefined)
        .finally(() => {
          try {
            active.clear()
          } catch {
            // ignore — clear() can throw if DOM already unmounted
          }
        })
    }
  }, [enabled, elementId])

  return (
    <section className="admin-checkin__scanner">
      {!enabled ? (
        <div className="admin-checkin__camera-placeholder">
          <p>Camera stays off until you enable it.</p>
          <button
            type="button"
            className="admin-dash__ghost-btn"
            onClick={() => setEnabled(true)}
          >
            Enable camera scanner
          </button>
        </div>
      ) : (
        <div id={elementId} className="admin-checkin__camera" />
      )}

      {message ? (
        <p
          className={
            cameraState === 'permission-denied' ||
            cameraState === 'unavailable'
              ? 'admin-dash__status admin-dash__status--error'
              : 'admin-dash__status'
          }
          role="status"
        >
          {cameraState === 'starting' ? 'Starting camera…' : message}
        </p>
      ) : null}
    </section>
  )
}
