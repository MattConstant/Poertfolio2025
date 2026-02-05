import Header from '@/components/Header'
import Footer from '@/components/Footer'
import GamePortal from '@/components/GamePortal'
import BackToTop from '@/components/BackToTop'
import { Suspense } from 'react'

export default function GamePage() {
  return (
    <main className="min-h-screen">
      <Header />

      <section className="relative pt-28 pb-20 bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
        </div>

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

