'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

// 0 empty, 1 sand, 2 water, 3 wall, 4 bomb, 5 fire, 6 oil, 7 gunpowder
type Cell = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7

const W = 160
const H = 96

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function idx(x: number, y: number) {
  return y * W + x
}

export default function PowderSandbox() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [tool, setTool] = useState<Cell>(1)
  const [brush, setBrush] = useState(3) // radius in cells

  const prefersReducedMotion = useMemo(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const gridRef = useRef<Uint8Array>(new Uint8Array(W * H))
  const fireTtlRef = useRef<Uint8Array>(new Uint8Array(W * H)) // fire lifetime
  const bombFuseRef = useRef<Uint16Array>(new Uint16Array(W * H)) // bomb fuse frames
  const pointerRef = useRef({ down: false, x: 0, y: 0, erase: false })
  const keysRef = useRef<Set<string>>(new Set())

  // Player (in cell coords)
  const playerRef = useRef({
    x: Math.floor(W * 0.5),
    y: 8,
    vx: 0,
    vy: 0,
    w: 2,
    h: 3,
    grounded: false,
  })

  const clear = useCallback(() => {
    gridRef.current.fill(0)
    fireTtlRef.current.fill(0)
    bombFuseRef.current.fill(0)
    // respawn player
    playerRef.current = {
      x: Math.floor(W * 0.5),
      y: 8,
      vx: 0,
      vy: 0,
      w: 2,
      h: 3,
      grounded: false,
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // scale canvas with DPR
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const scale = 6 // visual pixel size
    canvas.style.width = `${W * scale}px`
    canvas.style.height = `${H * scale}px`
    canvas.width = Math.floor(W * scale * dpr)
    canvas.height = Math.floor(H * scale * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const imageData = ctx.createImageData(W, H)
    const data = imageData.data
    const off = document.createElement('canvas')
    off.width = W
    off.height = H
    const offCtx = off.getContext('2d')!

    const paint = () => {
      const p = pointerRef.current
      if (!p.down) return
      const g = gridRef.current
      const fireTtl = fireTtlRef.current
      const fuse = bombFuseRef.current
      const r = brush
      const value: Cell = p.erase ? 0 : tool
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue
          const x = clamp(p.x + dx, 1, W - 2)
          const y = clamp(p.y + dy, 1, H - 2)
          g[idx(x, y)] = value
          if (value === 5) {
            fireTtl[idx(x, y)] = 16
          } else if (value === 4) {
            fuse[idx(x, y)] = 0
          } else if (value === 0) {
            fireTtl[idx(x, y)] = 0
            fuse[idx(x, y)] = 0
          }
        }
      }
    }

    const isSolid = (c: Cell) => c === 1 || c === 3 || c === 4 || c === 7 // sand, wall, bomb, gunpowder

    const rectHits = (x: number, y: number, w0: number, h0: number) => {
      const g = gridRef.current
      for (let yy = y; yy < y + h0; yy++) {
        for (let xx = x; xx < x + w0; xx++) {
          if (xx < 0 || xx >= W || yy < 0 || yy >= H) return true
          if (isSolid(g[idx(xx, yy)] as Cell)) return true
        }
      }
      return false
    }

    const igniteAt = (x: number, y: number, ttl = 16) => {
      if (x <= 0 || x >= W - 1 || y <= 0 || y >= H - 1) return
      const i = idx(x, y)
      const g = gridRef.current
      const c = g[i] as Cell
      // don't overwrite walls/bombs directly
      if (c === 3 || c === 4) return
      g[i] = 5
      fireTtlRef.current[i] = Math.max(fireTtlRef.current[i], ttl)
    }

    const explode = (cx: number, cy: number, radius: number) => {
      const g = gridRef.current
      const fireTtl = fireTtlRef.current
      const fuse = bombFuseRef.current

      for (let y = cy - radius; y <= cy + radius; y++) {
        for (let x = cx - radius; x <= cx + radius; x++) {
          if (x <= 0 || x >= W - 1 || y <= 0 || y >= H - 1) continue
          const dx = x - cx
          const dy = y - cy
          if (dx * dx + dy * dy > radius * radius) continue
          const i = idx(x, y)
          g[i] = 0
          fireTtl[i] = 0
          fuse[i] = 0
          // small ring of fire for effect
          if (dx * dx + dy * dy > (radius - 1.5) * (radius - 1.5) && Math.random() < 0.4) {
            g[i] = 5
            fireTtl[i] = 10 + Math.floor(Math.random() * 10)
          }
        }
      }

      // knockback player a bit
      const p = playerRef.current
      const px = p.x + p.w / 2
      const py = p.y + p.h / 2
      const vx = px - cx
      const vy = py - cy
      const dist = Math.hypot(vx, vy)
      if (dist < radius + 6) {
        const k = (radius + 6 - dist) / (radius + 6)
        p.vx += (vx / (dist || 1)) * 10 * k
        p.vy -= 14 * k
      }
    }

    const updatePlayer = () => {
      const p = playerRef.current
      const keys = keysRef.current

      const left = keys.has('ArrowLeft') || keys.has('a')
      const right = keys.has('ArrowRight') || keys.has('d')
      const jump = keys.has(' ') || keys.has('ArrowUp') || keys.has('w')

      // water check (feet or body in water)
      const g = gridRef.current
      const inWater =
        (g[idx(clamp(p.x, 0, W - 1), clamp(p.y + p.h - 1, 0, H - 1))] as Cell) === 2 ||
        (g[idx(clamp(p.x + 1, 0, W - 1), clamp(p.y + Math.floor(p.h / 2), 0, H - 1))] as Cell) === 2

      // Much slower/heavier movement (closer to Powder Game vibes)
      const accel = inWater ? 0.22 : 0.28
      const maxVx = inWater ? 0.9 : 1.15
      if (left) p.vx -= accel
      if (right) p.vx += accel
      if (!left && !right) p.vx *= inWater ? 0.70 : 0.78
      p.vx = clamp(p.vx, -maxVx, maxVx)

      if (inWater) {
        // swim: hold space to go up, otherwise gentle sink
        p.vy += 0.14
        p.vy *= 0.86
        if (jump) p.vy -= 0.34
        p.grounded = false
      } else {
        // gravity + jump
        p.vy += 0.28
        if (jump && p.grounded) {
          p.vy = -3.2
          p.grounded = false
        }
      }

      // integrate with simple axis collision
      let nx = p.x + p.vx
      let ny = p.y
      if (!rectHits(Math.floor(nx), Math.floor(ny), p.w, p.h)) {
        p.x = nx
      } else {
        // Try to push bombs (and only bombs) a bit like Powder Game
        const g2 = gridRef.current
        const dir = p.vx > 0 ? 1 : p.vx < 0 ? -1 : 0
        if (dir !== 0) {
          const frontX = dir > 0 ? Math.floor(p.x + p.w) : Math.floor(p.x - 1)
          const y0 = Math.floor(p.y)
          const y1 = Math.floor(p.y + p.h - 1)
          for (let yy = y0; yy <= y1; yy++) {
            if (frontX < 1 || frontX >= W - 1 || yy < 1 || yy >= H - 1) continue
            const fi = idx(frontX, yy)
            if ((g2[fi] as Cell) === 4) {
              const ti = idx(frontX + dir, yy)
              if ((g2[ti] as Cell) === 0) {
                g2[ti] = 4
                g2[fi] = 0
                bombFuseRef.current[ti] = bombFuseRef.current[fi]
                bombFuseRef.current[fi] = 0
              }
            }
          }
        }

        p.vx = 0
      }

      nx = p.x
      ny = p.y + p.vy
      if (!rectHits(Math.floor(nx), Math.floor(ny), p.w, p.h)) {
        p.y = ny
        p.grounded = false
      } else {
        if (p.vy > 0) p.grounded = true
        p.vy = 0
      }

      p.x = clamp(p.x, 1, W - p.w - 2)
      p.y = clamp(p.y, 1, H - p.h - 2)
    }

    let frame = 0
    const step = () => {
      frame += 1
      const g = gridRef.current
      const fireTtl = fireTtlRef.current
      const fuse = bombFuseRef.current
      // paint first so the sim reacts immediately
      paint()

      // update player before sim so you can affect sand immediately
      updatePlayer()

      // ignite bombs adjacent to fire + spread to flammables
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = idx(x, y)
          const c = g[i] as Cell
          const adjFire =
            (g[idx(x + 1, y)] as Cell) === 5 ||
            (g[idx(x - 1, y)] as Cell) === 5 ||
            (g[idx(x, y + 1)] as Cell) === 5 ||
            (g[idx(x, y - 1)] as Cell) === 5

          if (!adjFire) continue

          if (c === 4 && fuse[i] === 0) {
            fuse[i] = 18
          } else if (c === 6) {
            // oil ignites and spreads fire
            igniteAt(x, y, 20)
          } else if (c === 7) {
            // gunpowder: quick boom
            g[i] = 0
            explode(x, y, 4)
          }
        }
      }

      // simulate bottom-up so gravity looks right
      for (let y = H - 2; y >= 1; y--) {
        const row = y * W
        // Alternate scan direction to avoid systemic drift/bias in fluids.
        const forward = ((y + frame) & 1) === 0
        const xStart = forward ? 1 : W - 2
        const xEnd = forward ? W - 1 : 0
        const xStep = forward ? 1 : -1
        for (let x = xStart; x !== xEnd; x += xStep) {
          const i = row + x
          const c = g[i] as Cell
          if (c === 1) {
            // sand
            const below = g[i + W] as Cell
            if (below === 0 || below === 2) {
              g[i] = below
              g[i + W] = 1
            } else {
              const dl = g[i + W - 1] as Cell
              const dr = g[i + W + 1] as Cell
              const firstLeft = (x + y) % 2 === 0
              if ((firstLeft && (dl === 0 || dl === 2)) || (!firstLeft && (dr === 0 || dr === 2))) {
                const ni = firstLeft ? i + W - 1 : i + W + 1
                const ncell = g[ni] as Cell
                g[i] = ncell
                g[ni] = 1
              } else if (dl === 0 || dl === 2) {
                g[i] = dl
                g[i + W - 1] = 1
              } else if (dr === 0 || dr === 2) {
                g[i] = dr
                g[i + W + 1] = 1
              }
            }
          } else if (c === 2) {
            // water
            const below = g[i + W] as Cell
            if (below === 0) {
              g[i] = 0
              g[i + W] = 2
            } else if (below === 6) {
              // Water is heavier than oil; swap so oil floats.
              g[i] = 6
              g[i + W] = 2
            } else {
              // Prefer diagonal down flow, then "spread" sideways multiple cells to equalize.
              const dir1 = ((x + y + frame) & 1) === 0 ? -1 : 1
              const dir2 = -dir1

              const dl = g[i + W + dir1] as Cell
              const dr = g[i + W + dir2] as Cell
              if (dl === 0) {
                g[i] = 0
                g[i + W + dir1] = 2
              } else if (dr === 0) {
                g[i] = 0
                g[i + W + dir2] = 2
              } else {
                // Sideways diffusion: allow water to travel a few cells in one update
                // which prevents vertical "towers" and makes it feel flowy.
                const maxSpread = 5

                const trySpread = (dir: number) => {
                  for (let dist = 1; dist <= maxSpread; dist++) {
                    const ti = i + dir * dist
                    const tc = g[ti] as Cell
                    if (tc !== 0) {
                      // allow passing through water/oil only; stop at solids
                      if (tc !== 2 && tc !== 6) return false
                      continue
                    }
                    // found empty: move there
                    g[i] = 0
                    g[ti] = 2
                    return true
                  }
                  return false
                }

                // Equalize even when "below" is water: if one side is emptier, flow to it.
                if (!trySpread(dir1)) {
                  trySpread(dir2)
                }
              }
            }
          } else if (c === 6) {
            // oil (lighter than water; flows sideways and floats)
            const below = g[i + W] as Cell
            if (below === 0) {
              g[i] = 0
              g[i + W] = 6
            } else if (below === 2) {
              // float on water
              g[i] = 2
              g[i + W] = 6
            } else {
              const dir1 = ((x + y + frame) & 1) === 0 ? -1 : 1
              const dir2 = -dir1
              const s1 = g[i + dir1] as Cell
              const s2 = g[i + dir2] as Cell
              if (s1 === 0) {
                g[i] = 0
                g[i + dir1] = 6
              } else if (s2 === 0) {
                g[i] = 0
                g[i + dir2] = 6
              }
            }
          } else if (c === 7) {
            // gunpowder: falls like sand but ignites explosively
            const below = g[i + W] as Cell
            if (below === 0 || below === 2 || below === 6) {
              g[i] = below
              g[i + W] = 7
            } else {
              const dl = g[i + W - 1] as Cell
              const dr = g[i + W + 1] as Cell
              const firstLeft = ((x + y + frame) & 1) === 0
              if ((firstLeft && (dl === 0 || dl === 2 || dl === 6)) || (!firstLeft && (dr === 0 || dr === 2 || dr === 6))) {
                const ni = firstLeft ? i + W - 1 : i + W + 1
                const ncell = g[ni] as Cell
                g[i] = ncell
                g[ni] = 7
              } else if (dl === 0 || dl === 2 || dl === 6) {
                g[i] = dl
                g[i + W - 1] = 7
              } else if (dr === 0 || dr === 2 || dr === 6) {
                g[i] = dr
                g[i + W + 1] = 7
              }
            }
          } else if (c === 5) {
            // fire: flicker & decay
            if (fireTtl[i] > 0) fireTtl[i] -= 1
            if (fireTtl[i] === 0) {
              g[i] = 0
            } else {
              // small upward drift
              if ((g[i - W] as Cell) === 0 && Math.random() < 0.25) {
                g[i] = 0
                g[i - W] = 5
                fireTtl[i - W] = Math.max(fireTtl[i - W], fireTtl[i])
              }
              // spread to nearby oil/gunpowder (a little)
              if (Math.random() < 0.08) {
                const dirs = Math.random() < 0.5 ? [[1,0],[-1,0],[0,1],[0,-1]] : [[0,1],[0,-1],[1,0],[-1,0]]
                for (const [dx, dy] of dirs) {
                  const ni = idx(x + dx, y + dy)
                  const nc = g[ni] as Cell
                  if (nc === 6) {
                    igniteAt(x + dx, y + dy, 18)
                    break
                  }
                  if (nc === 7) {
                    g[ni] = 0
                    explode(x + dx, y + dy, 4)
                    break
                  }
                }
              }
            }
          }
        }
      }

      // bombs: tick fuses and explode
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          const i = idx(x, y)
          if ((g[i] as Cell) !== 4) continue
          if (fuse[i] === 0) continue
          fuse[i] -= 1
          if (fuse[i] === 0) {
            explode(x, y, 7)
          } else if (fuse[i] < 6 && Math.random() < 0.4) {
            // sparks
            const si = idx(x + (Math.random() < 0.5 ? -1 : 1), y)
            if ((g[si] as Cell) === 0) {
              g[si] = 5
              fireTtl[si] = 8
            }
          }
        }
      }

      // render
      for (let i = 0; i < g.length; i++) {
        const c = g[i] as Cell
        const o = i * 4
        if (c === 0) {
          data[o + 0] = 7
          data[o + 1] = 12
          data[o + 2] = 26
          data[o + 3] = 255
        } else if (c === 1) {
          data[o + 0] = 245
          data[o + 1] = 204
          data[o + 2] = 110
          data[o + 3] = 255
        } else if (c === 2) {
          data[o + 0] = 80
          data[o + 1] = 170
          data[o + 2] = 255
          data[o + 3] = 210
        } else if (c === 6) {
          // oil
          data[o + 0] = 130
          data[o + 1] = 96
          data[o + 2] = 30
          data[o + 3] = 235
        } else if (c === 7) {
          // gunpowder
          data[o + 0] = 70
          data[o + 1] = 72
          data[o + 2] = 78
          data[o + 3] = 255
        } else {
          // wall / bomb / fire
          if (c === 3) {
            data[o + 0] = 150
            data[o + 1] = 160
            data[o + 2] = 176
            data[o + 3] = 255
          } else if (c === 4) {
            const f = bombFuseRef.current[i]
            const hot = f > 0 ? 70 : 25
            data[o + 0] = 210
            data[o + 1] = hot
            data[o + 2] = 50
            data[o + 3] = 255
          } else {
            // fire
            data[o + 0] = 255
            data[o + 1] = 120 + Math.floor(Math.random() * 40)
            data[o + 2] = 30
            data[o + 3] = 230
          }
        }
      }

      // draw scaled up with crisp pixels
      offCtx.putImageData(imageData, 0, 0)
      ctx.imageSmoothingEnabled = false
      ctx.clearRect(0, 0, W * scale, H * scale)
      ctx.drawImage(off, 0, 0, W * scale, H * scale)

      // draw player on top
      const p = playerRef.current
      ctx.fillStyle = 'rgba(56,189,248,0.95)'
      ctx.fillRect(p.x * scale, p.y * scale, p.w * scale, p.h * scale)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(p.x * scale, p.y * scale, p.w * scale, 3)

      if (!prefersReducedMotion) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = window.setTimeout(step, 33) as unknown as number
      }
    }

    const toCell = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor(((clientX - rect.left) / rect.width) * W)
      const y = Math.floor(((clientY - rect.top) / rect.height) * H)
      return { x: clamp(x, 0, W - 1), y: clamp(y, 0, H - 1) }
    }

    const onPointerMove = (e: PointerEvent) => {
      const p = toCell(e.clientX, e.clientY)
      pointerRef.current.x = p.x
      pointerRef.current.y = p.y
    }
    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId)
      pointerRef.current.down = true
      pointerRef.current.erase = e.button === 2
      onPointerMove(e)
      e.preventDefault()
    }
    const onPointerUp = () => {
      pointerRef.current.down = false
    }
    const onContextMenu = (e: MouseEvent) => e.preventDefault()

    canvas.addEventListener('pointermove', onPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown, { passive: false })
    canvas.addEventListener('pointerup', onPointerUp, { passive: true })
    canvas.addEventListener('pointerleave', onPointerUp, { passive: true })
    canvas.addEventListener('contextmenu', onContextMenu)

    const onKeyDown = (e: KeyboardEvent) => {
      // Prevent page scrolling on space/arrows while this game is mounted.
      if (e.code === 'Space' || e.key.startsWith('Arrow')) e.preventDefault()
      keysRef.current.add(e.key)
      if (e.code === 'Space') keysRef.current.add(' ')
    }
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key)
      if (e.code === 'Space') keysRef.current.delete(' ')
    }
    window.addEventListener('keydown', onKeyDown, { passive: false })
    window.addEventListener('keyup', onKeyUp, { passive: true })

    rafRef.current = requestAnimationFrame(step)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('pointerleave', onPointerUp)
      canvas.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [brush, clear, prefersReducedMotion, tool])

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTool(1)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 1 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Sand
          </button>
          <button
            type="button"
            onClick={() => setTool(2)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 2 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Water
          </button>
          <button
            type="button"
            onClick={() => setTool(3)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 3 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Wall
          </button>
          <button
            type="button"
            onClick={() => setTool(4)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 4 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Bomb
          </button>
          <button
            type="button"
            onClick={() => setTool(5)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 5 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Fire
          </button>
          <button
            type="button"
            onClick={() => setTool(6)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 6 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Oil
          </button>
          <button
            type="button"
            onClick={() => setTool(7)}
            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
              tool === 7 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/7'
            }`}
          >
            Gunpowder
          </button>
          <button
            type="button"
            onClick={clear}
            className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white/80 hover:bg-white/7 text-sm transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">Brush</label>
          <input
            type="range"
            min={1}
            max={7}
            value={brush}
            onChange={(e) => setBrush(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden inline-block">
        <canvas ref={canvasRef} />
      </div>

      <div className="mt-3 text-sm text-gray-300 flex flex-wrap gap-2">
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Left click: paint</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Right click: erase</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Move: A / D</span>
        <span className="px-2 py-1 rounded-md bg-black/30 border border-white/10">Jump / Swim: Space</span>
      </div>
    </div>
  )
}

