'use client'

import { useState, useCallback } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { trackNavigationClick, trackScrollToSection } from '@/utils/analytics'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { scrollYProgress } = useScroll()
  const scrollProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 25, mass: 0.2 })
  const pathname = usePathname()
  const router = useRouter()

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')

    trackNavigationClick(targetId)
    trackScrollToSection(targetId)

    // If we're not on the home page, navigate there with the hash
    if (pathname !== '/') {
      router.push(`/${href}`)
      setIsMenuOpen(false)
      return
    }

    if (targetId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const targetElement = document.getElementById(targetId)

      if (targetElement) {
        const headerHeight = 80 // Account for fixed header height
        const targetPosition = targetElement.offsetTop - headerHeight

        window.scrollTo({ top: targetPosition, behavior: 'smooth' })
      }
    }

    setIsMenuOpen(false)
  }, [pathname, router])

  const handleRouteNav = useCallback((route: string, label: string) => {
    trackNavigationClick(label)
    router.push(route)
    setIsMenuOpen(false)
  }, [router])

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Experience', href: '#experience' },
    { name: 'Projects', href: '#projects' },
    { name: 'Skills', href: '#skills' },
    { name: 'Contact', href: '#contact' },
    { name: 'Game', href: '/game' },
  ]

  return (
    <header className="fixed top-0 w-full z-50 bg-zinc-950/90 backdrop-blur-xl border-b border-white/10">
      {/* Scroll progress */}
      <motion.div
        className="h-0.5 w-full origin-left bg-blue-500"
        style={{ scaleX: scrollProgress }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div>
            <a
              href="#home"
              onClick={(e) => handleSmoothScroll(e, '#home')}
              className="text-xl lg:text-2xl font-bold tracking-tight text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
            >
              Matthieu Constant
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.href.startsWith('#') ? (
                  <a
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className="relative px-4 py-2 text-zinc-400 hover:text-white transition-colors duration-200 font-medium group cursor-pointer"
                  >
                    {item.name}
                    {/* Hover underline effect */}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleRouteNav(item.href, item.name)}
                    className="relative px-4 py-2 text-zinc-400 hover:text-white transition-colors duration-200 font-medium group cursor-pointer"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}
              </div>
            ))}

            {/* CTA Button */}
            <div className="ml-4">
              <a
                href="#projects"
                onClick={(e) => handleSmoothScroll(e, '#projects')}
                className="px-5 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-500 transition-colors duration-200 cursor-pointer"
              >
                View My Work
              </a>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-colors duration-200"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center items-center">
              <span
                className={`w-5 h-0.5 bg-current block transition-all duration-300 ${
                  isMenuOpen ? 'rotate-45 translate-y-1.5' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-current block mt-1 transition-all duration-300 ${
                  isMenuOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`w-5 h-0.5 bg-current block mt-1 transition-all duration-300 ${
                  isMenuOpen ? '-rotate-45 -translate-y-1.5' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full">
          <div className="px-4 pt-2 pb-4 space-y-1 bg-zinc-950/95 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.href.startsWith('#') ? (
                  <a
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className="block px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200 font-medium cursor-pointer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleRouteNav(item.href, item.name)}
                    className="block px-4 py-3 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors duration-200 font-medium cursor-pointer"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}

            {/* Mobile CTA */}
            <div className="pt-2">
              <a
                href="#projects"
                onClick={(e) => handleSmoothScroll(e, '#projects')}
                className="block px-4 py-3 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-500 transition-colors duration-200 cursor-pointer"
              >
                View My Work
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
