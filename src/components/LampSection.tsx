'use client'

import { motion } from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { TextFlippingBoard } from '@/components/ui/text-flipping-board'
import { trackContactClick, trackScrollToSection } from '@/utils/analytics'

const boardMessages = [
  'MATTHIEU CONSTANT\nSOFTWARE DEVELOPER',
  'REACT + SPRING BOOT\nFULL-STACK APPS',
  'NOW LIVE\nFISHLIST.CA',
]

export default function LampSection() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % boardMessages.length)
    }, 7000)
    return () => clearInterval(interval)
  }, [])

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')

    if (targetId === 'contact') {
      trackContactClick('Hero CTA Button')
    } else if (targetId === 'projects') {
      trackContactClick('View My Work Button')
    }

    trackScrollToSection(targetId)

    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      const headerHeight = 80
      window.scrollTo({
        top: targetElement.offsetTop - headerHeight,
        behavior: 'smooth',
      })
    }
  }, [])

  return (
    <div
      id="home"
      className="relative min-h-screen w-full overflow-hidden bg-zinc-950 flex flex-col items-center justify-center"
    >
      {/* Dot grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='1.5' cy='1.5' r='1' fill='rgba(255,255,255,0.08)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
        <motion.h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Matthieu Constant
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Software developer at Public Safety Canada, building applications
          with React and Spring Boot.
        </motion.p>

        {/* Split-flap display board */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <TextFlippingBoard text={boardMessages[messageIndex]} />
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a
            href="#projects"
            onClick={(e) => handleSmoothScroll(e, '#projects')}
            className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition-colors duration-200 font-medium text-lg cursor-pointer"
          >
            View My Work
          </a>
          <a
            href="#contact"
            onClick={(e) => handleSmoothScroll(e, '#contact')}
            className="px-8 py-3 border border-white/15 text-white rounded-full hover:bg-white/5 hover:border-white/30 transition-colors duration-200 font-medium text-lg cursor-pointer"
          >
            Get In Touch
          </a>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-zinc-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
