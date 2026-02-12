import { useEffect } from 'react'
import { initContentRevealScroll } from '@/lib/scroll-reveal'

export function useScrollReveal() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Load GSAP from CDN if not already loaded
    if (!window.gsap) {
      const script1 = document.createElement('script')
      script1.src = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js'
      script1.onload = () => {
        const script2 = document.createElement('script')
        script2.src = 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js'
        script2.onload = () => {
          initContentRevealScroll()
        }
        document.head.appendChild(script2)
      }
      document.head.appendChild(script1)
    } else {
      // GSAP already loaded
      initContentRevealScroll()
    }

    return () => {
      // Cleanup if needed
    }
  }, [])
}
