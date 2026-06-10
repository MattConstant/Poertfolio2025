import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GamePortal from '@/components/GamePortal'
import BackToTop from '@/components/BackToTop'
import { Suspense } from 'react'

export default function GamePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative pt-28 pb-20 bg-zinc-950 overflow-hidden">
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Suspense
            fallback={
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-white/80">
                Loading games…
              </div>
            }
          >
            <GamePortal />
          </Suspense>
        </div>
      </section>

      <Footer />
      <BackToTop />
    </main>
  )
}

