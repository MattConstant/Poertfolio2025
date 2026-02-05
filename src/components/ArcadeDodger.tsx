'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

type Meteor = { x: number; y: number; r: number; v: number }
type Bullet = { x: number; y: number; v: number }

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function ArcadeDodger() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [status, setStatus] = useState<'idle' | 'running' | 'gameover'>('idle')
  const [shotsHit, setShotsHit] = useState(0)

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const start = useCallback(() => {
    setScore(0)
    setStatus('running')
    setIsRunning(true)
  }, [])

  const stop = useCallback(() => {
    setIsRunning(false)
    setStatus('gameover')
  }, [])

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Sizing
    const resize = () => {
      const rect = wrapRef.current!.getBoundingClientRect()
      const w = Math.max(320, Math.floor(rect.width))
      const h = Math.max(360, Math.floor(Math.min(560, rect.width * 0.62)))
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

    // Game state (mutable, avoids re-rendering every frame)
    let tPrev = performance.now()
    let shipX = w / 2
    const shipY = () => h - 44
    let shipVX = 0
    let meteors: Meteor[] = []
    let bullets: Bullet[] = []
    let spawnTimer = 0
    let localScore = 0
    let localHits = 0
    const shotCooldownMs = 260
    let lastShotAt = -Infinity

    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'a' || e.key === 'd') {
        keys.add(e.key)
        e.preventDefault()
      }
      if (e.key === ' ' || e.key === 'Spacebar') {
        keys.add(' ')
        e.preventDefault()
      }
      if (e.key === 'Enter' && status !== 'running') start()
      if (e.key === 'Escape' && status === 'running') stop()
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: true })

    const shoot = (tNow: number) => {
      if (!isRunning) return
      if (tNow - lastShotAt < shotCooldownMs) return
      lastShotAt = tNow
      const y0 = shipY() - 18
      bullets.push({ x: shipX, y: y0, v: 820 })
      // cap bullets so long sessions don't build up too much
      if (bullets.length > 10) bullets = bullets.slice(bullets.length - 10)
    }

    const onPointerDown = (e: PointerEvent) => {
      // Click/tap to shoot
      e.preventDefault()
      shoot(performance.now())
    }
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false })

    const spawn = () => {
      const r = 8 + Math.random() * 10
      const x = r + Math.random() * (w - r * 2)
      meteors.push({ x, y: -r, r, v: 160 + Math.random() * 140 })
    }

    const draw = () => {
      // Background
      ctx.clearRect(0, 0, w, h)
      const g = ctx.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#0b1220')
      g.addColorStop(1, '#050814')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      for (let i = 0; i < 28; i++) {
        const sx = (i * 97) % w
        const sy = (i * 53) % h
        ctx.fillRect(sx, sy, 1, 1)
      }

      // Meteors
      for (const m of meteors) {
        const mg = ctx.createRadialGradient(m.x - m.r * 0.25, m.y - m.r * 0.25, 1, m.x, m.y, m.r * 1.6)
        mg.addColorStop(0, 'rgba(99,102,241,0.9)')
        mg.addColorStop(1, 'rgba(99,102,241,0.05)')
        ctx.fillStyle = mg
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r * 1.3, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = 'rgba(255,255,255,0.65)'
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Bullets
      for (const b of bullets) {
        ctx.strokeStyle = 'rgba(34,211,238,0.95)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(b.x, b.y)
        ctx.lineTo(b.x, b.y + 10)
        ctx.stroke()
      }

      // Ship
      const y = shipY()
      ctx.save()
      ctx.translate(shipX, y)
      ctx.fillStyle = 'rgba(56,189,248,0.9)'
      ctx.beginPath()
      ctx.moveTo(0, -14)
      ctx.lineTo(12, 14)
      ctx.lineTo(0, 8)
      ctx.lineTo(-12, 14)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // HUD
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.font = '600 14px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText(`Score: ${Math.floor(localScore)}`, 14, 24)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText(`Best: ${best}`, 14, 44)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'
      ctx.fillText(`Hits: ${localHits}`, 14, 64)

      // Cooldown indicator
      const cd = clamp((performance.now() - lastShotAt) / shotCooldownMs, 0, 1)
      ctx.fillStyle = 'rgba(255,255,255,0.18)'
      ctx.fillRect(w - 114, 14, 100, 10)
      ctx.fillStyle = cd >= 1 ? 'rgba(34,211,238,0.85)' : 'rgba(99,102,241,0.75)'
      ctx.fillRect(w - 114, 14, 100 * cd, 10)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.strokeRect(w - 114, 14, 100, 10)
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.font = '500 10px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText('SHOOT', w - 114, 36)

      if (status !== 'running') {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'
        ctx.fillRect(0, 0, w, h)
        ctx.fillStyle = 'rgba(255,255,255,0.92)'
        ctx.font = '700 22px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(status === 'idle' ? 'Arcade Dodger' : 'Game Over', w / 2, h / 2 - 18)
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '500 14px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
        ctx.fillText('Use ← → (or A / D) to move. Space / click to shoot.', w / 2, h / 2 + 10)
        ctx.fillText('Press Esc to end a run.', w / 2, h / 2 + 32)
        ctx.textAlign = 'left'
      }
    }

    const step = (tNow: number) => {
      const dt = Math.min(0.033, (tNow - tPrev) / 1000)
      tPrev = tNow

      if (isRunning && !prefersReducedMotion) {
        // Input
        const left = keys.has('ArrowLeft') || keys.has('a')
        const right = keys.has('ArrowRight') || keys.has('d')
        const accel = 2100
        if (left) shipVX -= accel * dt
        if (right) shipVX += accel * dt
        shipVX *= Math.pow(0.0002, dt) // damping (a bit less sticky)
        shipX = clamp(shipX + shipVX * dt, 18, w - 18)

        // Shooting
        if (keys.has(' ')) shoot(tNow)

        // Spawn
        spawnTimer += dt
        const difficulty = 0.6 + localScore / 800
        const spawnEvery = clamp(0.65 / difficulty, 0.22, 0.65)
        while (spawnTimer > spawnEvery) {
          spawnTimer -= spawnEvery
          spawn()
        }

        // Update meteors
        meteors = meteors
          .map((m) => ({ ...m, y: m.y + m.v * dt * (1 + localScore / 1200) }))
          .filter((m) => m.y < h + 60)

        // Update bullets
        bullets = bullets
          .map((b) => ({ ...b, y: b.y - b.v * dt }))
          .filter((b) => b.y > -40)

        // Bullet vs meteor collisions
        if (bullets.length && meteors.length) {
          const nextBullets: Bullet[] = []
          const deadMeteor = new Set<number>()

          for (const b of bullets) {
            let hit = false
            for (let i = 0; i < meteors.length; i++) {
              if (deadMeteor.has(i)) continue
              const m = meteors[i]
              const dist = Math.hypot(m.x - b.x, m.y - b.y)
              if (dist < m.r + 4) {
                hit = true
                deadMeteor.add(i)
                localHits += 1
                localScore += 18 // reward hits
                break
              }
            }
            if (!hit) nextBullets.push(b)
          }

          if (deadMeteor.size) {
            meteors = meteors.filter((_, idx) => !deadMeteor.has(idx))
          }
          bullets = nextBullets
        }

        // Score
        localScore += dt * 60

        // Collision
        const sy = shipY()
        for (const m of meteors) {
          const dx = m.x - shipX
          const dy = m.y - sy
          const dist = Math.hypot(dx, dy)
          if (dist < m.r + 12) {
            setScore(Math.floor(localScore))
            setBest((b) => Math.max(b, Math.floor(localScore)))
            stop()
            break
          }
        }
      } else if (isRunning && prefersReducedMotion) {
        // Reduced motion: keep it playable, but with simpler update (no easing)
        const left = keys.has('ArrowLeft') || keys.has('a')
        const right = keys.has('ArrowRight') || keys.has('d')
        if (left) shipX -= 460 * dt
        if (right) shipX += 460 * dt
        shipX = clamp(shipX, 18, w - 18)

        if (keys.has(' ')) shoot(tNow)

        spawnTimer += dt
        while (spawnTimer > 0.55) {
          spawnTimer -= 0.55
          spawn()
        }

        meteors = meteors.map((m) => ({ ...m, y: m.y + m.v * dt })).filter((m) => m.y < h + 60)
        bullets = bullets
          .map((b) => ({ ...b, y: b.y - b.v * dt }))
          .filter((b) => b.y > -40)

        if (bullets.length && meteors.length) {
          const nextBullets: Bullet[] = []
          const deadMeteor = new Set<number>()
          for (const b of bullets) {
            let hit = false
            for (let i = 0; i < meteors.length; i++) {
              if (deadMeteor.has(i)) continue
              const m = meteors[i]
              const dist = Math.hypot(m.x - b.x, m.y - b.y)
              if (dist < m.r + 4) {
                hit = true
                deadMeteor.add(i)
                localHits += 1
                localScore += 14
                break
              }
            }
            if (!hit) nextBullets.push(b)
          }
          if (deadMeteor.size) meteors = meteors.filter((_, idx) => !deadMeteor.has(idx))
          bullets = nextBullets
        }

        localScore += dt * 45

        const sy = shipY()
        for (const m of meteors) {
          const dist = Math.hypot(m.x - shipX, m.y - sy)
          if (dist < m.r + 12) {
            setScore(Math.floor(localScore))
            setBest((b) => Math.max(b, Math.floor(localScore)))
            stop()
            break
          }
        }
      }

      // keep React state loosely in sync
      if (status === 'running') {
        setScore(Math.floor(localScore))
        setShotsHit(localHits)
      }

      draw()
      rafRef.current = requestAnimationFrame(step)
    }

    // start loop
    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown as any)
      window.removeEventListener('keyup', onKeyUp as any)
      canvas.removeEventListener('pointerdown', onPointerDown as any)
    }
  }, [best, isRunning, prefersReducedMotion, start, status, stop])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Game</h1>
          <p className="text-gray-300 mt-1">A tiny arcade mini-game. No installs, just play.</p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={start}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            {status === 'running' ? 'Restart' : 'Start'}
          </button>
          <button
            type="button"
            onClick={stop}
            disabled={status !== 'running'}
            className="px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          >
            End
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        <canvas ref={canvasRef} className="block w-full h-auto" />

        <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-xs text-white/80">
          <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">← → / A D to move</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Space / click to shoot</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Enter to start</span>
          <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Esc to stop</span>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-300">
        <span className="text-white/90 font-medium">Score:</span> {score}{' '}
        <span className="mx-2 text-white/20">•</span>
        <span className="text-white/90 font-medium">Best:</span> {best}
        <span className="mx-2 text-white/20">•</span>
        <span className="text-white/90 font-medium">Hits:</span> {shotsHit}
      </div>
    </div>
  )
}

