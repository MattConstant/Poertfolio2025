import { useMemo } from 'react'

const Skills = () => {
  const skillCategories = useMemo(() => [
    {
      category: 'Frontend',
      skills: [
        { name: 'React.js', level: 90 },
        { name: 'TypeScript', level: 85 },
        { name: 'JavaScript', level: 90 },
        { name: 'Tailwind CSS', level: 80 },
        { name: 'HTML/CSS', level: 85 },
      ],
    },
    {
      category: 'Backend',
      skills: [
        { name: 'Spring Boot', level: 85 },
        { name: 'Java', level: 80 },
        { name: 'Python', level: 75 },
        { name: 'Django', level: 70 },
        { name: 'REST APIs', level: 85 },
      ],
    },
    {
      category: 'Databases & DevOps',
      skills: [
        { name: 'MongoDB', level: 85 },
        { name: 'PostgreSQL', level: 75 },
        { name: 'SQL', level: 80 },
        { name: 'Git', level: 85 },
        { name: 'Docker', level: 75 },
      ],
    },
  ], [])

  return (
    <section id="skills" className="py-24 bg-zinc-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-4">
            Skills & Technologies
          </h2>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Here are the technologies and tools I work with to bring ideas to life.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category) => (
            <div
              key={category.category}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors duration-300 space-y-6"
            >
              <h3 className="text-xl font-semibold text-white text-center">
                {category.category}
              </h3>
              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-medium">
                        {skill.name}
                      </span>
                      <span className="text-sm text-zinc-500">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
