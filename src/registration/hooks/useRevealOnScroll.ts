"use client";

import { useEffect } from "react";

/**
 * Fade/slide elements into view as they enter the viewport.
 * Mark nodes with `data-reveal` (optional values: up | left | right | scale).
 * Pass `deps` to re-scan after step/route content changes.
 */
export function useRevealOnScroll(
  deps: unknown[] = [],
  rootMargin = '0px 0px -8% 0px',
) {
  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-reveal]:not([data-reveal-bound])',
      ),
    )
    if (nodes.length === 0) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      nodes.forEach((el) => {
        el.classList.add('is-inview')
        el.setAttribute('data-reveal-bound', '1')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          el.classList.add('is-inview')
          observer.unobserve(el)
        }
      },
      { root: null, rootMargin, threshold: 0.12 },
    )

    nodes.forEach((el, index) => {
      el.setAttribute('data-reveal-bound', '1')
      el.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 70}ms`)
      observer.observe(el)
    })

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls rescan via deps
  }, [rootMargin, ...deps])
}
