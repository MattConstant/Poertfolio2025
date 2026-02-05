'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

// 0 air, 1 grass, 2 dirt, 3 stone, 4 water, 5 wood, 6 leaves
type BlockId = 0 | 1 | 2 | 3 | 4 | 5 | 6
type Vec2 = { x: number; y: number }

const BLOCK_SIZE = 18
const WORLD_W = 220
const WORLD_H = 90

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function smoothstep(t: number) {
  return t * t * (3 - 2 * t)
}

function hashStrToSeed(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function key(x: number, y: number) {
  return `${x},${y}`
}

function blockColor(id: BlockId) {
  switch (id) {
    case 1:
      return { top: '#42d66a', mid: '#2aa84a', edge: 'rgba(0,0,0,0.22)' }
    case 2:
      return { top: '#a06a3a', mid: '#7c4f2a', edge: 'rgba(0,0,0,0.22)' }
    case 3:
      return { top: '#9aa3ad', mid: '#667180', edge: 'rgba(0,0,0,0.26)' }
    case 4:
      return { top: 'rgba(56,189,248,0.55)', mid: 'rgba(59,130,246,0.38)', edge: 'rgba(255,255,255,0.10)' }
    case 5:
      return { top: '#b07a40', mid: '#7a4b25', edge: 'rgba(0,0,0,0.25)' }
    case 6:
      return { top: '#52e07a', mid: '#2bb957', edge: 'rgba(0,0,0,0.20)' }
    default:
      return { top: 'transparent', mid: 'transparent', edge: 'transparent' }
  }
}

function isSolid(id: BlockId) {
  // Water is non-solid; everything else is solid.
  return id !== 0 && id !== 4
}

export default function MinecraftLite() {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)

  const [seedText, setSeedText] = useState('matthieu')
  const [selected, setSelected] = useState<BlockId>(2)
  const [status, setStatus] = useState<'idle' | 'running'>('idle')
  const [hint, setHint] = useState('Press Enter to start')
  const [worldKey, setWorldKey] = useState(0)

  const selectedRef = useRef<BlockId>(selected)
  const hintRef = useRef(hint)

  useEffect(() => {
    selectedRef.current = selected
  }, [selected])

  useEffect(() => {
    hintRef.current = hint
  }, [hint])

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  // This is “persistent” storage of world edits only; base world is generated from seed.
  const editsRef = useRef<Record<string, BlockId>>({})
  const seedRef = useRef<number>(hashStrToSeed(seedText))

  const loadSave = useCallback((seed: number) => {
    try {
      const raw = localStorage.getItem(`mc-lite:${seed}`)
      if (!raw) {
        editsRef.current = {}
        return
      }
      const parsed = JSON.parse(raw) as Record<string, BlockId>
      editsRef.current = parsed ?? {}
    } catch {
      editsRef.current = {}
    }
  }, [])

  const save = useCallback((seed: number) => {
    try {
      localStorage.setItem(`mc-lite:${seed}`, JSON.stringify(editsRef.current))
    } catch {
      // ignore
    }
  }, [])

  const start = useCallback(() => {
    const seed = hashStrToSeed(seedText.trim() || 'matthieu')
    seedRef.current = seed
    loadSave(seed)
    setStatus('running')
    setHint('WASD / Arrows to move, Space to jump, LMB mine, RMB place, 1-3 select block')
    setWorldKey((k) => k + 1)
  }, [loadSave, seedText])

  const resetWorld = useCallback(() => {
    const seed = seedRef.current
    editsRef.current = {}
    try {
      localStorage.removeItem(`mc-lite:${seed}`)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!wrapRef.current || !canvasRef.current) return
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const rect = wrap.getBoundingClientRect()
      const w = Math.max(360, Math.floor(rect.width))
      const h = Math.max(420, Math.floor(Math.min(720, rect.width * 0.62)))
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { w, h }
    }

    let { w: viewW, h: viewH } = resize()
    const ro = new ResizeObserver(() => {
      ;({ w: viewW, h: viewH } = resize())
    })
    ro.observe(wrap)

    const tileSize = BLOCK_SIZE
    const worldW = WORLD_W
    const worldH = WORLD_H
    const seaLevel = 56 // higher number = lower in the world (y grows downward)

    // Player (in world coords, pixels)
    const player = {
      pos: { x: worldW * tileSize * 0.5, y: tileSize * 10 } as Vec2,
      vel: { x: 0, y: 0 } as Vec2,
      w: tileSize * 0.75,
      h: tileSize * 1.55,
      grounded: false,
    }

    // Camera
    const cam = { x: 0, y: 0 }

    // deterministic terrain
    const rand01 = (n: number) => mulberry32(seedRef.current + n * 1013)()

    const noise1D = (x: number, period: number) => {
      const fx = x / period
      const i0 = Math.floor(fx)
      const t = fx - i0
      const v0 = rand01(i0)
      const v1 = rand01(i0 + 1)
      const s = smoothstep(t)
      return (v0 * (1 - s) + v1 * s) * 2 - 1 // [-1..1]
    }

    const heightMap = new Int16Array(worldW)
    for (let x = 0; x < worldW; x++) {
      // fBm-ish: smoother, rolling terrain
      const n1 = noise1D(x, 28) * 9
      const n2 = noise1D(x, 14) * 4.5
      const n3 = noise1D(x, 7) * 2.2
      const base = 48
      heightMap[x] = clamp(Math.round(base + n1 + n2 + n3), 26, 66)
    }

    // Decorations: trees (wood/leaves) based on surface
    const deco: Record<string, BlockId> = {}
    let lastTreeX = -999
    for (let x = 4; x < worldW - 4; x++) {
      const top = heightMap[x]
      // no trees under water
      if (top >= seaLevel - 1) continue
      // spread them out a bit
      if (x - lastTreeX < 6) continue
      const r = mulberry32(seedRef.current + x * 17)()
      if (r > 0.11) continue
      lastTreeX = x

      const trunkH = 4 + Math.floor(mulberry32(seedRef.current + x * 31)() * 3) // 4..6
      // trunk
      for (let i = 1; i <= trunkH; i++) {
        deco[key(x, top - i)] = 5
      }
      // leaves blob
      const crownY = top - trunkH
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const ax = x + dx
          const ay = crownY + dy
          if (ax < 0 || ax >= worldW || ay < 0 || ay >= worldH) continue
          const d = Math.abs(dx) + Math.abs(dy)
          const chance = d <= 2 ? 0.95 : 0.55
          if (mulberry32(seedRef.current + ax * 131 + ay * 17)() < chance) {
            // don't overwrite trunk
            if (deco[key(ax, ay)] !== 5) deco[key(ax, ay)] = 6
          }
        }
      }
    }

    const baseBlock = (tx: number, ty: number): BlockId => {
      // tx,ty in tiles. y increases downward.
      if (tx < 0 || tx >= worldW || ty < 0 || ty >= worldH) return 3
      const d = deco[key(tx, ty)]
      if (d !== undefined) return d

      const hTop = heightMap[tx]
      if (ty < hTop) {
        // water fills low valleys up to sea level
        if (ty >= seaLevel && ty < hTop) return 4
        return 0
      }
      if (ty === hTop) return 1
      if (ty <= hTop + 4) return 2
      return 3
    }

    const getBlock = (tx: number, ty: number): BlockId => {
      const edited = editsRef.current[key(tx, ty)]
      if (edited !== undefined) return edited
      return baseBlock(tx, ty)
    }

    const setBlock = (tx: number, ty: number, id: BlockId) => {
      if (tx < 0 || tx >= worldW || ty < 0 || ty >= worldH) return
      // if setting to base, remove edit entry
      const b = baseBlock(tx, ty)
      if (id === b) {
        delete editsRef.current[key(tx, ty)]
      } else {
        editsRef.current[key(tx, ty)] = id
      }
    }

    const rectHitsSolid = (rx: number, ry: number, rw: number, rh: number) => {
      const x0 = Math.floor(rx / tileSize)
      const y0 = Math.floor(ry / tileSize)
      const x1 = Math.floor((rx + rw) / tileSize)
      const y1 = Math.floor((ry + rh) / tileSize)
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          if (isSolid(getBlock(x, y))) return true
        }
      }
      return false
    }

    const getWaterState = () => {
      const cx = player.pos.x + player.w / 2
      const cy = player.pos.y + player.h * 0.6
      const fx = player.pos.x + player.w / 2
      const fy = player.pos.y + player.h - 2
      const hx = player.pos.x + player.w / 2
      const hy = player.pos.y + 4
      const tx1 = Math.floor(cx / tileSize)
      const ty1 = Math.floor(cy / tileSize)
      const tx2 = Math.floor(fx / tileSize)
      const ty2 = Math.floor(fy / tileSize)
      const tx3 = Math.floor(hx / tileSize)
      const ty3 = Math.floor(hy / tileSize)

      const body = getBlock(tx1, ty1) === 4
      const feet = getBlock(tx2, ty2) === 4
      const head = getBlock(tx3, ty3) === 4
      return { inWater: body || feet, headInWater: head, feetInWater: feet }
    }

    const keys = new Set<string>()
    const onKeyDown = (e: KeyboardEvent) => {
      const isSpace = e.code === 'Space' || e.key === ' '
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 'd', 'w', 's'].includes(e.key) || isSpace) {
        keys.add(e.key)
        // Prevent page scrolling while playing (Space/Arrows)
        if (status === 'running') e.preventDefault()
        if (isSpace) keys.add(' ')
      }
      if (e.key === 'Enter' && status !== 'running') start()
      if (e.key === '1') setSelected(1)
      if (e.key === '2') setSelected(2)
      if (e.key === '3') setSelected(3)
    }
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key)
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: true })

    // Pointer interaction
    let pointer = { x: 0, y: 0, down: false }
    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = clientX - rect.left + cam.x
      const y = clientY - rect.top + cam.y
      return { x, y }
    }
    const reachable = (tx: number, ty: number) => {
      const px = player.pos.x + player.w / 2
      const py = player.pos.y + player.h / 2
      const bx = (tx + 0.5) * tileSize
      const by = (ty + 0.5) * tileSize
      const dist = Math.hypot(bx - px, by - py)
      return dist <= tileSize * 5.2
    }

    const onPointerMove = (e: PointerEvent) => {
      const wpos = toWorld(e.clientX, e.clientY)
      pointer = { ...pointer, x: wpos.x, y: wpos.y }
    }
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      const wpos = toWorld(e.clientX, e.clientY)
      pointer = { ...pointer, x: wpos.x, y: wpos.y, down: true }

      if (status !== 'running') return

      const tx = Math.floor(wpos.x / tileSize)
      const ty = Math.floor(wpos.y / tileSize)
      if (!reachable(tx, ty)) return

      if (e.button === 2) {
        // place
        if (getBlock(tx, ty) !== 0) return
        // don't place into player
        const tileRx = tx * tileSize
        const tileRy = ty * tileSize
        const overlap =
          tileRx < player.pos.x + player.w &&
          tileRx + tileSize > player.pos.x &&
          tileRy < player.pos.y + player.h &&
          tileRy + tileSize > player.pos.y
        if (overlap) return
        // require adjacency to an existing block (feels more Minecraft-y)
        const adj =
          isSolid(getBlock(tx + 1, ty)) ||
          isSolid(getBlock(tx - 1, ty)) ||
          isSolid(getBlock(tx, ty + 1)) ||
          isSolid(getBlock(tx, ty - 1))
        if (!adj) return
        setBlock(tx, ty, selectedRef.current)
        save(seedRef.current)
      } else {
        // mine
        if (getBlock(tx, ty) === 0) return
        setBlock(tx, ty, 0)
        save(seedRef.current)
      }
    }
    const onPointerUp = () => {
      pointer = { ...pointer, down: false }
    }
    const onContextMenu = (e: MouseEvent) => e.preventDefault()
    canvas.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown, { passive: true })
    canvas.addEventListener('pointerup', onPointerUp, { passive: true })
    canvas.addEventListener('contextmenu', onContextMenu)

    // Tick
    let tPrev = performance.now()
    let lastSurfaceJumpAt = -Infinity
    const step = (tNow: number) => {
      const dt = Math.min(0.033, (tNow - tPrev) / 1000)
      tPrev = tNow

      if (status === 'running') {
        // movement
        const left = keys.has('ArrowLeft') || keys.has('a')
        const right = keys.has('ArrowRight') || keys.has('d')
        const jump = keys.has(' ') || keys.has('ArrowUp') || keys.has('w')
        const down = keys.has('ArrowDown') || keys.has('s')
        const { inWater, headInWater } = getWaterState()
        const atSurface = inWater && !headInWater
        const stepHeight = tileSize * 0.9

        // Movement tuning (slower + more controllable)
        const accel = prefersReducedMotion ? (inWater ? 1150 : 1350) : (inWater ? 1450 : 1750)
        const maxV = prefersReducedMotion ? (inWater ? 210 : 280) : (inWater ? 260 : 380)
        const friction = player.grounded ? 22 : inWater ? 12 : 6

        if (left) player.vel.x -= accel * dt
        if (right) player.vel.x += accel * dt
        if (!left && !right) {
          player.vel.x -= player.vel.x * friction * dt
        }
        player.vel.x = clamp(player.vel.x, -maxV, maxV)

        // gravity & jump / swim
        if (inWater) {
          // buoyancy + drag (lighter than normal gravity)
          player.vel.y += (prefersReducedMotion ? 700 : 820) * dt
          player.vel.y -= player.vel.y * (prefersReducedMotion ? 4.5 : 6) * dt

          // swim controls (hold space to swim up, S/down to swim down)
          const swimAccel = prefersReducedMotion ? 1300 : 1600
          if (jump) player.vel.y -= swimAccel * dt
          if (down) player.vel.y += (swimAccel * 0.85) * dt

          // "pop out" boost at the surface so you can exit pools
          // This triggers at most ~4x/sec even if Space is held.
          if (atSurface && jump && tNow - lastSurfaceJumpAt > 240 && player.vel.y > -220) {
            player.vel.y = -(prefersReducedMotion ? 460 : 620)
            lastSurfaceJumpAt = tNow
          }
          player.grounded = false
        } else {
          player.vel.y += (prefersReducedMotion ? 1600 : 1900) * dt
          if (jump && player.grounded) {
            player.vel.y = -(prefersReducedMotion ? 420 : 520)
            player.grounded = false
          }
        }

        // integrate with collision resolution (axis-separately)
        let nx = player.pos.x + player.vel.x * dt
        let ny = player.pos.y
        if (!rectHitsSolid(nx, ny, player.w, player.h)) {
          player.pos.x = nx
        } else {
          // Try to step up (lets you climb out of pools / 1-block ledges)
          // Only attempt when moving and not head-underwater.
          const dir = Math.sign(player.vel.x)
          const canStep =
            dir !== 0 &&
            !headInWater &&
            !rectHitsSolid(nx, ny - stepHeight, player.w, player.h) &&
            rectHitsSolid(nx, ny, player.w, player.h)

          if (canStep) {
            player.pos.x = nx
            player.pos.y = ny - stepHeight
            player.grounded = false
          } else {
            // step toward
            while (dir !== 0 && !rectHitsSolid(player.pos.x + dir, ny, player.w, player.h)) {
              player.pos.x += dir
            }
            player.vel.x = 0
          }
        }

        nx = player.pos.x
        ny = player.pos.y + player.vel.y * dt
        if (!rectHitsSolid(nx, ny, player.w, player.h)) {
          player.pos.y = ny
          player.grounded = false
        } else {
          const dir = Math.sign(player.vel.y)
          while (dir !== 0 && !rectHitsSolid(nx, player.pos.y + dir, player.w, player.h)) {
            player.pos.y += dir
          }
          if (dir > 0) player.grounded = true
          player.vel.y = 0
        }

        // keep player in bounds
        player.pos.x = clamp(player.pos.x, 2, worldW * tileSize - player.w - 2)
        player.pos.y = clamp(player.pos.y, 0, worldH * tileSize - player.h - 2)

        // camera follow
        const targetX = player.pos.x + player.w / 2 - viewW / 2
        const targetY = player.pos.y + player.h / 2 - viewH / 2
        const lerp = prefersReducedMotion ? 1 : 1 - Math.pow(0.0015, dt)
        cam.x = prefersReducedMotion ? targetX : cam.x + (targetX - cam.x) * lerp
        cam.y = prefersReducedMotion ? targetY : cam.y + (targetY - cam.y) * lerp

        cam.x = clamp(cam.x, 0, worldW * tileSize - viewW)
        cam.y = clamp(cam.y, 0, worldH * tileSize - viewH)
      }

      // draw
      ctx.clearRect(0, 0, viewW, viewH)

      // sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, viewH)
      sky.addColorStop(0, '#071022')
      sky.addColorStop(1, '#02030b')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, viewW, viewH)

      // subtle stars
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      for (let i = 0; i < 36; i++) {
        const sx = ((i * 173) % viewW) | 0
        const sy = ((i * 97) % viewH) | 0
        ctx.fillRect(sx, sy, 1, 1)
      }

      const startX = Math.floor(cam.x / tileSize) - 1
      const endX = Math.floor((cam.x + viewW) / tileSize) + 1
      const startY = Math.floor(cam.y / tileSize) - 1
      const endY = Math.floor((cam.y + viewH) / tileSize) + 1

      // blocks
      for (let ty = startY; ty <= endY; ty++) {
        for (let tx = startX; tx <= endX; tx++) {
          const id = getBlock(tx, ty)
          if (id === 0) continue
          const px = tx * tileSize - cam.x
          const py = ty * tileSize - cam.y
          const c = blockColor(id)
          if (id === 4) {
            // water (semi-transparent)
            ctx.fillStyle = c.mid
            ctx.fillRect(px, py, tileSize, tileSize)
            ctx.fillStyle = c.top
            ctx.fillRect(px, py, tileSize, Math.max(2, tileSize * 0.16))
            ctx.strokeStyle = c.edge
            ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1)
          } else if (id === 6) {
            // leaves
            ctx.fillStyle = 'rgba(34,197,94,0.55)'
            ctx.fillRect(px, py, tileSize, tileSize)
            ctx.fillStyle = 'rgba(134,239,172,0.35)'
            ctx.fillRect(px, py, tileSize, Math.max(2, tileSize * 0.18))
            ctx.strokeStyle = c.edge
            ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1)
          } else {
            // base
            ctx.fillStyle = c.mid
            ctx.fillRect(px, py, tileSize, tileSize)
            // top highlight
            ctx.fillStyle = c.top
            ctx.fillRect(px, py, tileSize, Math.max(3, tileSize * 0.22))
            // edge
            ctx.strokeStyle = c.edge
            ctx.strokeRect(px + 0.5, py + 0.5, tileSize - 1, tileSize - 1)
          }
        }
      }

      // highlight target block (crosshair)
      const ttx = Math.floor(pointer.x / tileSize)
      const tty = Math.floor(pointer.y / tileSize)
      if (status === 'running' && reachable(ttx, tty)) {
        const hx = ttx * tileSize - cam.x
        const hy = tty * tileSize - cam.y
        ctx.strokeStyle = 'rgba(34,211,238,0.8)'
        ctx.lineWidth = 2
        ctx.strokeRect(hx + 1, hy + 1, tileSize - 2, tileSize - 2)
      }

      // player
      const ppx = player.pos.x - cam.x
      const ppy = player.pos.y - cam.y
      ctx.fillStyle = 'rgba(56,189,248,0.95)'
      ctx.fillRect(ppx, ppy, player.w, player.h)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(ppx, ppy, player.w, 4)

      // hotbar
      const hbW = 220
      const hbH = 44
      const hbX = viewW / 2 - hbW / 2
      const hbY = viewH - hbH - 14
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(hbX, hbY, hbW, hbH)
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'
      ctx.strokeRect(hbX + 0.5, hbY + 0.5, hbW - 1, hbH - 1)

      const slots: BlockId[] = [1, 2, 3]
      for (let i = 0; i < slots.length; i++) {
        const sx = hbX + 14 + i * 64
        const sy = hbY + 10
        const id = slots[i]
        const c = blockColor(id)
        ctx.fillStyle = 'rgba(255,255,255,0.06)'
        ctx.fillRect(sx, sy, 24, 24)
        ctx.fillStyle = c.mid
        ctx.fillRect(sx + 4, sy + 4, 16, 16)
        ctx.fillStyle = c.top
        ctx.fillRect(sx + 4, sy + 4, 16, 4)
        const isSelected = selectedRef.current === id
        ctx.strokeStyle = isSelected ? 'rgba(34,211,238,0.9)' : 'rgba(255,255,255,0.15)'
        ctx.lineWidth = isSelected ? 2 : 1
        ctx.strokeRect(sx + 0.5, sy + 0.5, 24, 24)

        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.font = '600 12px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
        ctx.fillText(String(i + 1), sx + 34, sy + 17)
      }

      // hint
      ctx.fillStyle = 'rgba(255,255,255,0.75)'
      ctx.font = '500 12px Inter, system-ui, -apple-system, Segoe UI, sans-serif'
      ctx.fillText(hintRef.current, 14, 22)

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [loadSave, prefersReducedMotion, save, start, status, worldKey])

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Mattcraft</h1>
          <p className="text-gray-300 mt-1">
            2D block sandbox
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-300" htmlFor="seed">
              Seed
            </label>
            <input
              id="seed"
              value={seedText}
              onChange={(e) => setSeedText(e.target.value)}
              className="w-44 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
              placeholder="seed"
            />
          </div>

          <button
            type="button"
            onClick={start}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
          >
            {status === 'running' ? 'Regenerate' : 'Start'}
          </button>
          <button
            type="button"
            onClick={() => resetWorld()}
            className="px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition-colors"
          >
            Reset edits
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden"
      >
        <canvas ref={canvasRef} className="block w-full h-auto" />
      </div>

      <div className="mt-4 text-sm text-gray-300 flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Move: WASD / Arrows</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Jump: Space</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Mine: Left click</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Place: Right click</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Hotbar: 1-3</span>
      </div>
    </div>
  )
}

