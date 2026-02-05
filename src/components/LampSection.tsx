'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState, useCallback } from 'react'
import { trackContactClick, trackScrollToSection } from '@/utils/analytics'

// Seeded random function to ensure consistent positioning
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function LampSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particlePositions, setParticlePositions] = useState<Array<{left: number, top: number}>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    
    // Track different types of clicks
    if (targetId === 'contact') {
      trackContactClick('Hero CTA Button')
    } else if (targetId === 'projects') {
      trackContactClick('View My Work Button')
    }
    
    trackScrollToSection(targetId)
    
    if (targetId === 'home') {
      // For home, scroll to the very top
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    } else {
      const targetElement = document.getElementById(targetId)
      
      if (targetElement) {
        const headerHeight = 80 // Account for fixed header height
        const targetPosition = targetElement.offsetTop - headerHeight
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        })
      }
    }
  }, [])

  useEffect(() => {
    // Only add mouse tracking if user doesn't prefer reduced motion
    if (prefersReducedMotion) return

    let ticking = false
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking && containerRef.current) {
        requestAnimationFrame(() => {
          const rect = containerRef.current!.getBoundingClientRect()
          setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          })
          ticking = false
        })
        ticking = true
      }
    }

    // Generate consistent particle positions (reduced for mobile performance)
    const positions = Array.from({ length: 8 }, (_, i) => ({
      left: seededRandom(i * 123.456) * 100,
      top: seededRandom(i * 789.012) * 100,
    }))
    setParticlePositions(positions)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [prefersReducedMotion])

  return (
    <div
      id="home"
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800" />
      
      {/* Subtle background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Minimalist Lamp */}
      <div className="relative z-10">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Lamp container */}
          <div className="relative mx-auto w-64 h-64 flex flex-col items-center">
            {/* Simple light beam */}
            <motion.div
              className="absolute top-0 w-[500px] h-[500px] bg-gradient-to-b from-blue-400/15 to-transparent rounded-full"
              animate={prefersReducedMotion ? {} : {
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={prefersReducedMotion ? {} : {
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Clean lamp shade */}
            <div className="relative z-20">
              <div className="w-20 h-12 bg-gradient-to-b from-gray-200/90 to-gray-300/70 dark:from-gray-700/90 dark:to-gray-600/70 rounded-t-full border border-gray-300/30 dark:border-gray-500/30 shadow-sm" />
              
              {/* Simple light source */}
              <motion.div
                className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-400 rounded-full"
                animate={prefersReducedMotion ? {} : {
                  opacity: [0.7, 1, 0.7],
                }}
                transition={prefersReducedMotion ? {} : {
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>
            
            {/* Minimal stem */}
            <div className="w-2 h-24 bg-gradient-to-b from-gray-400/60 to-gray-500/40 dark:from-gray-600/60 dark:to-gray-700/40 rounded-full" />
            
            {/* Simple base */}
            <div className="w-16 h-4 bg-gradient-to-r from-gray-300/60 to-gray-400/40 dark:from-gray-600/60 dark:to-gray-700/40 rounded-full shadow-sm" />
          </div>
        </motion.div>

        {/* Main content */}
        <div className="relative z-20 text-center mt-12">
          <motion.h1
            className="text-6xl md:text-8xl font-bold text-gray-900 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Matthieu Constant
            </span>
          </motion.h1>
          
          <motion.p
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Junior Software Developer & Creative Problem Solver
          </motion.p>
          
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <a
              href="#projects"
              onClick={(e) => handleSmoothScroll(e, '#projects')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer"
            >
              View My Work
            </a>
            <a
              href="#contact"
              onClick={(e) => handleSmoothScroll(e, '#contact')}
              className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all duration-200 font-medium text-lg cursor-pointer"
            >
              Get In Touch
            </a>
          </motion.div>
        </div>
      </div>

      {/* Minimal floating particles - only show if not reduced motion */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particlePositions.map((position, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gray-400/40 dark:bg-gray-300/40 rounded-full"
              style={{
                left: `${position.left}%`,
                top: `${position.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4 + seededRandom(i * 456.789) * 2,
                repeat: Infinity,
                delay: seededRandom(i * 321.654) * 2,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
} 