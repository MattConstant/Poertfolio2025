'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

export default function AnimatedAbout() {
  const containerRef = useRef<HTMLDivElement>(null)

  const skills = [
    { name: "React.js", icon: "⚛️", level: 90 },
    { name: "Spring Boot", icon: "🍃", level: 85 },
    { name: "MongoDB", icon: "🍃", level: 85 },
    { name: "Java", icon: "☕", level: 80 },
    { name: "TypeScript", icon: "📘", level: 85 },
    { name: "JavaScript", icon: "🟨", level: 90 },
  ]

  return (
    <section id="about" ref={containerRef} className="relative py-24 bg-zinc-950 border-t border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            About Me
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Passionate software developer with expertise in React, Spring Boot, and cloud technologies
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - About content */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-white mb-6">
              Junior Software Developer
            </h3>

            <div className="space-y-4 text-zinc-400">
              <p className="text-lg leading-relaxed">
                I&apos;m a dedicated software developer currently working at Public Safety Canada, where I build interactive React applications and deploy RESTful APIs using Spring Boot. With a strong foundation in both frontend and backend development, I specialize in creating scalable, secure applications.
              </p>

              <p className="text-lg leading-relaxed">
                My journey in software development started at Sheridan College, where I earned an Advanced Diploma with a 3.5 GPA. I led a capstone project on Film Location Scouting that received faculty funding, and won &quot;Best Use of MongoDB&quot; at Hackville 2024 for developing a full-stack application under tight deadlines.
              </p>

              <p className="text-lg leading-relaxed">
                I&apos;m passionate about DevOps practices, having integrated GitLab security testing and Cypress end-to-end tests into CI/CD workflows, reducing compliance review time by 40%. I&apos;m fluent in French, English, and conversational Polish.
              </p>
            </div>

            {/* Education */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-xl font-semibold text-white mb-4">Education</h4>
              <div className="space-y-3">
                <div>
                  <h5 className="text-blue-400 font-medium">Sheridan College, Oakville</h5>
                  <p className="text-zinc-300">Advanced Diploma • 09/2020 - 12/2024</p>
                  <p className="text-zinc-500">Final Year GPA: 3.5</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Skills */}
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold text-white text-center mb-8">
              Technical Skills
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.name}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-blue-500/40 hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-2xl">{skill.icon}</span>
                    <h4 className="text-white font-semibold">{skill.name}</h4>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-blue-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${skill.level}%` }}
                      transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                      viewport={{ once: true }}
                    />
                  </div>
                  <p className="text-zinc-500 text-sm mt-2">{skill.level}%</p>
                </motion.div>
              ))}
            </div>

            {/* Certifications */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h4 className="text-xl font-semibold text-white mb-4">Certifications</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">React</span>
                  <span className="text-blue-400">Udemy, 2022</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">HTML/CSS</span>
                  <span className="text-blue-400">HackerRank, 2022</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-300">Java</span>
                  <span className="text-blue-400">HackerRank, 2022</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
