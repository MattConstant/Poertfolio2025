'use client'

import { useMemo, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import MinecraftLite from '@/components/MinecraftLite'
import ArcadeDodger from '@/components/ArcadeDodger'
import PowderSandbox from '@/components/PowderSandbox'
import Breakout from '@/components/Breakout'

type GameId = 'mattcraft' | 'dodger' | 'powder' | 'breakout'

type GameDef = {
  id: GameId
  name: string
  description: string
  badge?: string
  component: React.ReactNode
}

export default function GamePortal() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const games: GameDef[] = useMemo(
    () => [
      {
        id: 'mattcraft',
        name: 'Mattcraft',
        description: '2D block sandbox (mine, place, explore).',
        badge: 'New',
        component: <MinecraftLite />,
      },
      {
        id: 'powder',
        name: 'Powder Sandbox',
        description: 'Falling sand + water simulation (Dan-Ball-ish vibes).',
        component: <PowderSandbox />,
      },
      {
        id: 'dodger',
        name: 'Arcade Dodger',
        description: 'Dodge meteors and shoot on cooldown.',
        component: <ArcadeDodger />,
      },
      {
        id: 'breakout',
        name: 'Breakout',
        description: 'Classic paddle + bricks.',
        component: <Breakout />,
      },
    ],
    []
  )

  const activeId = (searchParams.get('g') as GameId | null) ?? null
  const active = activeId ? games.find((g) => g.id === activeId) : null

  const setGame = useCallback(
    (id: GameId | null) => {
      const url = id ? `/game?g=${id}` : '/game'
      router.push(url)
    },
    [router]
  )

  if (active) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{active.name}</h1>
            <p className="text-gray-300 mt-1">{active.description}</p>
          </div>

          <button
            type="button"
            onClick={() => setGame(null)}
            className="px-4 py-2 rounded-lg border border-white/15 text-white/90 hover:bg-white/5 transition-colors"
          >
            Back to menu
          </button>
        </div>

        {active.component}
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Game Hub</h1>
          <p className="text-gray-300 mt-1">Pick a game.</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setGame(g.id)}
            className="group text-left rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/7 hover:border-blue-500/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">{g.name}</h2>
                  {g.badge && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-200 border border-blue-500/30">
                      {g.badge}
                    </span>
                  )}
                </div>
                <p className="text-gray-300 mt-2">{g.description}</p>
              </div>

              <div className="shrink-0 w-10 h-10 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-white/80"
                  />
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

