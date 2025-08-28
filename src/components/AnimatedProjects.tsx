'use client'

import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { trackProjectClick, trackContactClick } from '@/utils/analytics'

export default function AnimatedProjects() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const projects = [
    {
      id: 1,
      title: 'Focus Logistics',
      description: 'A comprehensive logistics company website built for a real client. This application is currently being used by the company and has been purchased for commercial use.',
      image: '/images/Focus.png',
      technologies: ['MongoDB', 'Spring Boot', 'SQL'],
      github: 'https://github.com/MattConstant/LogisticsSite',
      live: 'https://logistics-site-henna.vercel.app/',
      category: 'Client Project',
      featured: true,
      highlight: 'Real client project - purchased and in use'
    },
    {
      id: 2,
      title: 'Locus Point',
      description: 'An innovative app that allows movie location scouts to find the perfect location for their next film. Currently has a waitlist of 100+ users with real stakeholders interested in the project.',
      image: '/images/locafy.png',
      technologies: ['React.js', 'Spring Boot', 'PostgreSQL'],
      github: 'https://github.com/LocafyORG',
      live: 'https://github.com/LocafyORG',
      category: 'Full Stack',
      featured: true,
      highlight: '100+ user waitlist with stakeholder interest'
    },
    {
      id: 3,
      title: 'TrackBuddy',
      description: 'A web app that allows users to track their driving on the track and improve their driving skills using AI.',
      image: '/images/trackbuddy.png',
      technologies: ['SQL', 'Django', 'React.js', 'AI'],
      github: 'https://github.com/LapBuddy/trackbuddy-frontend',
      live: 'https://trackbuddy-frontend-l9wl.vercel.app/',
      category: 'Web App',
      featured: false
    },
    {
      id: 4,
      title: 'Penguino',
      description: 'An Arduino-based interactive robot designed to chat with you vocally in real-time using AI. Built as a capstone project combining speech recognition, text-to-speech synthesis, and AI-driven responses.',
      image: '/images/penguin.png',
      technologies: ['Kotlin', 'C++', 'MongoDB', 'AI Integration', 'Arduino'],
      github: 'https://github.com/MattConstant/Capstone2023',
      live: 'https://github.com/MattConstant/Capstone2023',
      category: 'IoT/AI',
      featured: false
    },
    {
      id: 5,
      title: 'BridgeTech',
      description: 'A web app that enables people to donate their used phones to those in need. Leveraging cutting-edge technologies such as the OpenAI API, Figma, and MongoDB. 🏆 Winner of "Best Use of MongoDB" at Hackville 2024!',
      image: '/images/bridgetech.png',
      technologies: ['React.js', 'Spring Boot', 'Tailwind CSS', 'JavaScript', 'OpenAI API', 'MongoDB'],
      github: 'https://github.com/MattConstant/Hackville2023',
      live: 'https://hackathon2023-frontend.vercel.app/',
      category: 'Web App',
      featured: false,
      highlight: '🏆 Best Use of MongoDB - Hackville 2024'
    }
  ]

  return (
    <section id="projects" ref={containerRef} className="relative py-20 bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            My Projects
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-4" />
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Here are some of the projects I&apos;ve worked on, showcasing my skills in full-stack development, AI integration, and client solutions.
          </p>
        </motion.div>

        {/* Featured Projects */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">Featured Projects</h3>
          <div className="grid lg:grid-cols-2 gap-8">
            {projects.filter(project => project.featured).map((project, index) => (
              <motion.div
                key={project.id}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                viewport={{ once: true }}
                onHoverStart={() => setHoveredIndex(project.id)}
                onHoverEnd={() => setHoveredIndex(null)}
                style={{ transformOrigin: 'center' }}
              >
                {/* Project Image */}
                <div className="relative h-32 overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10" />
                  
                  {/* Hover overlay */}
                  <motion.div
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === project.id ? 1 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <div className="flex space-x-4">
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProjectClick(project.title, 'github')}
                        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors duration-200"
                      >
                        GitHub
                      </a>
                      <a
                        href={project.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProjectClick(project.title, 'live_demo')}
                        className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors duration-200"
                      >
                        Live Demo
                      </a>
                    </div>
                  </motion.div>
                </div>

                {/* Project Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30">
                      {project.category}
                    </span>
                    <span className="text-gray-400 text-sm">{project.id.toString().padStart(2, '0')}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors duration-200">
                    {project.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Highlight badge */}
                  {project.highlight && (
                    <div className="mb-4">
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm border border-green-500/30 font-medium">
                        {project.highlight}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs border border-white/20"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* All Projects Grid */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 text-center">All Projects</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                className="group bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                viewport={{ once: true }}
                style={{ transformOrigin: 'center' }}
              >
                {/* Project Image */}
                <div className="relative h-24 overflow-hidden">
                  <img 
                    src={project.image} 
                    alt={project.title}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="flex space-x-3">
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProjectClick(project.title, 'github')}
                        className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded text-white text-sm hover:bg-white/30 transition-colors duration-200"
                      >
                        Code
                      </a>
                      <a
                        href={project.live}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackProjectClick(project.title, 'live_demo')}
                        className="px-3 py-1 bg-blue-600 rounded text-white text-sm hover:bg-blue-700 transition-colors duration-200"
                      >
                        Demo
                      </a>
                    </div>
                  </div>
                </div>

                {/* Project Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs border border-blue-500/30">
                      {project.category}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors duration-200">
                    {project.title}
                  </h4>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-3">
                    {project.description}
                  </p>

                  {/* Highlight badge for non-featured projects */}
                  {project.highlight && !project.featured && (
                    <div className="mb-3">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs border border-green-500/30 font-medium">
                        {project.highlight}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs border border-white/20"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs border border-white/20">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <p className="text-gray-300 mb-6">
            Interested in working together? Let&apos;s discuss your next project!
          </p>
          <a
            href="#contact"
            onClick={() => trackContactClick('Projects CTA Button')}
            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Get In Touch
          </a>
        </motion.div>
      </div>
    </section>
  )
} 