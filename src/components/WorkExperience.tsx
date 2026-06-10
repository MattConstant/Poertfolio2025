'use client'

import { useState, useCallback, useMemo } from 'react'
import { trackWorkExperienceClick } from '@/utils/analytics'

export default function WorkExperience() {
  const [activeIndex, setActiveIndex] = useState(0)

  const experiences = useMemo(() => [
    {
      id: 1,
      company: "Public Safety Canada",
      position: "Software Developer",
      duration: "09/2022 - Present",
      location: "Ottawa, ON",
      description: "Building interactive React applications and deploying RESTful APIs using Spring Boot for scalable backend services.",
      technologies: ["React", "Spring Boot", "GitLab CI", "Cypress", "Docker", "Azure"],
      achievements: [
        "Integrated GitLab security testing and Cypress end-to-end tests into CI/CD workflows, reducing compliance review time by 40%",
        "Enhanced CI/CD pipeline with automated testing to boost reliability and deployment efficiency",
        "Regularly facilitated meetings with stakeholders to gather technical requirements and align development with business goals",
        "Extensively utilized React to build interactive, modular user interfaces and manage complex application state"
      ]
    },
    {
      id: 2,
      company: "BattleGoat",
      position: "Junior Software Developer",
      duration: "12/2021 - 04/2022",
      location: "Dundas, ON",
      description: "Developed and executed comprehensive unit tests for video games using C#, validating individual components and functions.",
      technologies: ["C#", "Unit Testing", "Game Development", "Quality Assurance"],
      achievements: [
        "Developed and executed comprehensive unit tests for video games using C#, bolstering overall quality and performance",
        "Trained and onboarded new co-op students, ensuring rapid integration and adherence to team standards and workflows",
        "Meticulous testing approach that improved game quality and performance"
      ]
    }
  ], [])

  const handleExperienceClick = useCallback((company: string, position: string, index: number) => {
    setActiveIndex(index)
    trackWorkExperienceClick(company, position)
  }, [])

  return (
    <section id="experience" className="relative py-24 bg-zinc-950 border-t border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Work Experience
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            My professional journey in software development
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {experiences.map((experience, index) => (
                <div
                  key={experience.id}
                  className={`cursor-pointer p-6 rounded-2xl border transition-all duration-300 ${
                    activeIndex === index
                      ? 'bg-white/10 border-blue-500/50 shadow-lg'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                  onClick={() => handleExperienceClick(experience.company, experience.position, index)}
                >
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">
                      {experience.position}
                    </h3>
                    <p className="text-blue-400 font-medium">
                      {experience.company}
                    </p>
                    <p className="text-zinc-500 text-sm">
                      {experience.duration}
                    </p>
                    <p className="text-zinc-400 text-sm">
                      {experience.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Experience Details */}
          <div className="lg:col-span-2">
            <div
              key={activeIndex}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 transition-opacity duration-200"
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {experiences[activeIndex].position}
                  </h3>
                  <p className="text-blue-400 text-lg font-medium mb-1">
                    {experiences[activeIndex].company}
                  </p>
                  <p className="text-zinc-500">
                    {experiences[activeIndex].duration} • {experiences[activeIndex].location}
                  </p>
                </div>

                <p className="text-zinc-400 leading-relaxed">
                  {experiences[activeIndex].description}
                </p>

                {/* Technologies */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Technologies Used</h4>
                  <div className="flex flex-wrap gap-2">
                    {experiences[activeIndex].technologies.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm border border-blue-500/30"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Achievements */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-3">Key Achievements</h4>
                  <ul className="space-y-2">
                    {experiences[activeIndex].achievements.map((achievement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="text-blue-400 mt-1">•</span>
                        <span className="text-zinc-300">{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 