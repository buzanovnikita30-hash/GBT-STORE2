'use client'

import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'framer-motion'

interface WaveStream {
  yBase: number       // 0-1 relative to canvas height
  amplitude: number   // 0-1 relative to canvas height
  frequency: number   // wave frequency
  phase: number       // initial phase offset
  speed: number       // animation speed
  color: string       // rgba color base
  dotSpacing: number  // px between dot columns
  spread: number      // vertical spread of dot cloud in px
  dotRadius: number   // base dot radius
  dotOpacity: number  // max dot opacity
  dotCount: number    // dots per column
  solid?: boolean     // draw solid line instead of dots
  lineWidth?: number
  opacityScale?: number
}

function WaveParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Predefined noise offsets so dots don't flicker
    const noiseCache: number[][] = []
    for (let i = 0; i < 2000; i++) {
      noiseCache.push(
        Array.from({ length: 12 }, () => (Math.random() - 0.5) * 2)
      )
    }

    const streams: WaveStream[] = [
      // Main green particle wave
      {
        yBase: 0.46, amplitude: 0.16, frequency: 0.0055, phase: 0,
        speed: 0.0006, color: '16,163,127',
        dotSpacing: 9, spread: 44, dotRadius: 1.8, dotOpacity: 0.6, dotCount: 8, opacityScale: 1.2,
      },
      // Wide soft green band
      {
        yBase: 0.50, amplitude: 0.14, frequency: 0.006, phase: Math.PI * 0.9,
        speed: 0.0005, color: '16,163,127',
        dotSpacing: 10, spread: 64, dotRadius: 1.5, dotOpacity: 0.35, dotCount: 10, opacityScale: 1.15,
      },
      // Blue particle wave
      {
        yBase: 0.58, amplitude: 0.16, frequency: 0.0048, phase: Math.PI * 1.6,
        speed: 0.00045, color: '26,86,219',
        dotSpacing: 10, spread: 48, dotRadius: 1.8, dotOpacity: 0.48, dotCount: 9, opacityScale: 1.2,
      },
      // Cyan thin wave
      {
        yBase: 0.54, amplitude: 0.11, frequency: 0.0075, phase: Math.PI * 0.4,
        speed: 0.0007, color: '77,217,224',
        dotSpacing: 8, spread: 30, dotRadius: 1.4, dotOpacity: 0.42, dotCount: 6, opacityScale: 1.1,
      },
      // Fine blue band
      {
        yBase: 0.62, amplitude: 0.11, frequency: 0.005, phase: Math.PI * 1.1,
        speed: 0.0004, color: '26,86,219',
        dotSpacing: 11, spread: 34, dotRadius: 1.3, dotOpacity: 0.32, dotCount: 7, opacityScale: 1.1,
      },
      // Solid green line 1
      {
        yBase: 0.47, amplitude: 0.14, frequency: 0.0055, phase: 0.3,
        speed: 0.0006, color: '16,163,127',
        dotSpacing: 1, spread: 0, dotRadius: 0, dotOpacity: 0, dotCount: 0,
        solid: true, lineWidth: 1.8,
      },
      // Solid blue line
      {
        yBase: 0.59, amplitude: 0.15, frequency: 0.0048, phase: Math.PI * 1.5,
        speed: 0.00045, color: '26,86,219',
        dotSpacing: 1, spread: 0, dotRadius: 0, dotOpacity: 0, dotCount: 0,
        solid: true, lineWidth: 1.4,
      },
    ]

    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const H = canvas.height
      const W = canvas.width

      streams.forEach((s) => {
        const yBase = s.yBase * H
        const amp = s.amplitude * H
        const phaseAnim = s.phase + t * s.speed * Math.PI * 2

        if (s.solid) {
          // Smooth solid curve
          ctx.beginPath()
          ctx.strokeStyle = `rgba(${s.color},0.65)`
          ctx.lineWidth = s.lineWidth ?? 1.5
          ctx.lineJoin = 'round'
          for (let x = 0; x <= W; x += 3) {
            const y = yBase + amp * Math.sin(s.frequency * x + phaseAnim)
            if (x === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.stroke()
          return
        }

        // Particle cloud around wave path
        const cols = Math.ceil(W / s.dotSpacing)
        for (let ci = 0; ci < cols; ci++) {
          const x = ci * s.dotSpacing
          const centerY = yBase + amp * Math.sin(s.frequency * x + phaseAnim)

          const noise = noiseCache[ci % noiseCache.length]

          for (let di = 0; di < s.dotCount; di++) {
            // Gaussian-ish distribution: most dots near center
            const n = noise[di % noise.length]
            const yOffset = n * s.spread
            const distRatio = Math.abs(yOffset) / s.spread
            // Opacity falls off away from center
            const opacityFactor = Math.max(0, 1 - distRatio * distRatio * 1.4)
            const finalOpacity = s.dotOpacity * opacityFactor * (s.opacityScale ?? 1)

            if (finalOpacity < 0.02) continue

            // Slight x jitter
            const xJitter = (noise[(di + 2) % noise.length] * s.dotSpacing * 0.3)

            ctx.beginPath()
            ctx.arc(x + xJitter, centerY + yOffset, s.dotRadius, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${s.color},${finalOpacity})`
            ctx.fill()
          }
        }
      })

      t++
      rafRef.current = requestAnimationFrame(draw)
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0.88 }}
    />
  )
}

export function AnimatedBackground() {
  const shouldReduce = useReducedMotion()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || shouldReduce) return null

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <WaveParticleCanvas />
    </div>
  )
}
