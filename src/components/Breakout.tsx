'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

type Brick = { x: number; y: number; w: number; h: number; alive: boolean }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function Breakout() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [status, setStatus] = useState<'idle' | 'running' | 'won' | 'lost'>('idle')
  const [score, setScore] = useState(0)

  // Keep game loop stable (avoid reinitializing on score/status changes)
  const statusRef = useRef<'idle' | 'running' | 'won' | 'lost'>('idle')
  const scoreRef = useRef(0)

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const start = useCallback(() => {
    scoreRef.current = 0
    statusRef.current = 'running'
    setScore(0)
    setStatus('running')
  }, [])

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = wrapRef.current!.getBoundingClientRect()
      const w = Math.max(320, Math.floor(rect.width))
      const h = Math.max(420, Math.floor(Math.min(640, rect.width * 0.62)))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h }
    }

    let { w, h } = resize()
    const ro = new ResizeObserver(() => {
      ;({ w, h } = resize())
    })
    ro.observe(wrapRef.current)

    // State
    let tPrev = performance.now()
    let paddleX = w / 2
    const paddleW = () => Math.max(90, Math.min(140, w * 0.22))
    const paddleY = () => h - 34
    let ball = { x: w / 2, y: h - 60, vx: 260, vy: -320, r: 7 }

    const buildBricks = () => {
      const rows = 5
      const cols = 9
      const gap = 8
      const bw = (w - 2 * 20 - (cols - 1) * gap) / cols
      const bh = 18
      const out: Brick[] = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          out.push({
            x: 20 + c * (bw + gap),
            y: 60 + r * (bh + gap),
            w: bw,
            h: bh,
            alive: true,
          })
        }
      }
      return out
    }
    let bricks = buildBricks()

    const resetBall = () => {
      paddleX = w / 2
      ball = { x: w / 2, y: h - 60, vx: 260, vy: -320, r: 7 }
    }

    // Input
    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        keys.add(e.key)
        if (statusRef.current === 'running') e.preventDefault()
      }
      if (e.key === 'Enter' && statusRef.current !== 'running') start()
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: true })

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      paddleX = clamp(x, paddleW() / 2 + 8, w - paddleW() / 2 - 8)
    }
    canvas.addEventListener('pointermove', onPointerMove, { passive: true })

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#071022')
      bg.addColorStop(1, '#02030b')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      // Bricks
      bricks.forEach((b, i) => {
        if (!b.alive) return
        const hue = 210 + (i % 9) * 9
        ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.9)`
        ctx.fillRect(b.x, b.y, b.w, b.h)
        ctx.fillStyle = `hsla(${hue}, 85%, 78%, 0.55)`
        ctx.fillRect(b.x, b.y, b.w, 4)
      })

      // Paddle
      const pw = paddleW()
      const px = paddleX - pw / 2
      const py = paddleY()
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillRect(px, py, pw, 10)
      ctx.fillStyle = 'rgba(56,189,248,0.8)'
      ctx.fillRect(px, py, pw, 3)

      // Ball
      ctx.fillStyle = 'rgba(34,211,238,0.95)'
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
      ctx.fill()

      // HUD
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '600 14px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText(`Score: ${scoreRef.current}`, 14, 24)

      const s = statusRef.current
      if (s !== 'running') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 22px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(s === 'idle' ? 'Breakout' : s === 'won' ? 'You Win!' : 'Game Over', w / 2, h / 2 - 16)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '500 14px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
        ctx.fillText('Move with mouse or ← →. Press Enter to start.', w / 2, h / 2 + 14)
        ctx.textAlign = 'left'
      }
    }

    const step = (tNow: number) => {
      const dt = Math.min(0.033, (tNow - tPrev) / 1000)
      tPrev = tNow

      if (statusRef.current === 'running') {
        const left = keys.has('ArrowLeft') || keys.has('a')
        const right = keys.has('ArrowRight') || keys.has('d')
        if (left) paddleX -= 520 * dt
        if (right) paddleX += 520 * dt
        paddleX = clamp(paddleX, paddleW() / 2 + 8, w - paddleW() / 2 - 8)

        // Ball
        ball.x += ball.vx * dt
        ball.y += ball.vy * dt

        // Walls
        if (ball.x - ball.r < 0) {
          ball.x = ball.r
          ball.vx *= -1
        } else if (ball.x + ball.r > w) {
          ball.x = w - ball.r
          ball.vx *= -1
        }
        if (ball.y - ball.r < 0) {
          ball.y = ball.r
          ball.vy *= -1
        }

        // Paddle collision
        const pw = paddleW()
        const px = paddleX - pw / 2
        const py = paddleY()
        if (ball.y + ball.r >= py && ball.y + ball.r <= py + 12 && ball.x >= px && ball.x <= px + pw && ball.vy > 0) {
          ball.y = py - ball.r
          const hit = (ball.x - paddleX) / (pw / 2)
          ball.vx = 360 * hit
          ball.vy *= -1
        }

        // Brick collisions
        for (const b of bricks) {
          if (!b.alive) continue
          if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w || ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) {
            continue
          }
          b.alive = false
          scoreRef.current += 10
          setScore(scoreRef.current)
          ball.vy *= -1
          break
        }

        // Win / lose
        if (bricks.every((b) => !b.alive)) {
          statusRef.current = 'won'
          setStatus('won')
          resetBall()
          bricks = buildBricks()
        } else if (ball.y - ball.r > h) {
          statusRef.current = 'lost'
          setStatus('lost')
          resetBall()
          bricks = buildBricks()
        }
      }

      draw()
      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = window.setTimeout(step, 33) as unknown as number
      }
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        window.clearTimeout(rafRef.current)
      }
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointermove', onPointerMove)
    }
  }, [prefersReducedMotion, start])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="text-gray-300 text-sm">
          <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Mouse / ← → to move</span>
        </div>
        <button
          type="button"
          onClick={start}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
        >
          {status === 'running' ? 'Restart' : 'Start'}
        </button>
      </div>

      <div ref={wrapRef} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
        <canvas ref={canvasRef} className="block w-full h-auto" />
      </div>
    </div>
  )
}

