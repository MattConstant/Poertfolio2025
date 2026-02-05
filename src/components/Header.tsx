'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, useScroll, useSpring } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { trackNavigationClick, trackScrollToSection } from '@/utils/analytics'

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const scrollProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 25, mass: 0.2 })
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    const targetId = href.replace('#', '')
    
    // Track navigation click
    trackNavigationClick(targetId)
    trackScrollToSection(targetId)

    // If we're not on the home page, navigate there with the hash
    if (pathname !== '/') {
      router.push(`/${href}`)
      setIsMenuOpen(false)
      return
    }
    
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
    
    // Close mobile menu if open
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
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-gray-900/95 backdrop-blur-xl shadow-2xl border-b border-gray-700/50' 
          : 'bg-gray-900/80 backdrop-blur-md border-b border-gray-700/30'
      }`}
    >
      {/* Scroll progress */}
      <motion.div
        className="h-0.5 w-full origin-left bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-300"
        style={{ scaleX: scrollProgress }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo */}
          <div>
            <a 
              href="#home" 
              onClick={(e) => handleSmoothScroll(e, '#home')}
              className="text-2xl lg:text-3xl font-bold text-white hover:text-blue-400 transition-colors duration-200 cursor-pointer"
            >
              Portfolio
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
                    className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 font-medium group cursor-pointer"
                  >
                    {item.name}
                    {/* Hover underline effect */}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => handleRouteNav(item.href, item.name)}
                    className="relative px-4 py-2 text-gray-300 hover:text-white transition-all duration-200 font-medium group cursor-pointer"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )}
              </div>
            ))}
            
            {/* CTA Button */}
            <div className="ml-4">
              <a
                href="#projects"
                onClick={(e) => handleSmoothScroll(e, '#projects')}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
              >
                View My Work
              </a>
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-200"
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

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-4 space-y-1 bg-gray-900/95 backdrop-blur-xl border-t border-gray-700/50 rounded-b-lg shadow-2xl">
              {navItems.map((item) => (
                <div key={item.name}>
                    {item.href.startsWith('#') ? (
                      <a
                        href={item.href}
                        onClick={(e) => handleSmoothScroll(e, item.href)}
                        className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium cursor-pointer"
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => handleRouteNav(item.href, item.name)}
                        className="block px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-lg transition-all duration-200 font-medium cursor-pointer"
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
                  className="block px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 cursor-pointer"
                >
                  View My Work
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header 