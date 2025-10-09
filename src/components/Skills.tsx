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
    <section id="skills" className="py-20 bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Skills & Technologies
          </h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Here are the technologies and tools I work with to bring ideas to life.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {skillCategories.map((category) => (
            <div key={category.category} className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                {category.category}
              </h3>
              <div className="space-y-4">
                {category.skills.map((skill) => (
                  <div key={skill.name} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        {skill.name}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {skill.level}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Skills Grid */}
        <div className="mt-16">
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white text-center mb-8">
            Additional Skills
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {useMemo(() => [
              'CI/CD', 'DevOps', 'Kotlin', 'C++', 'Arduino', 'AI Integration',
              'Responsive Design', 'Testing', 'Agile', 'Scrum', 'Problem Solving',
              'Team Leadership', 'Performance Optimization', 'Security Testing', 'Cypress', 'GitLab'
            ], []).map((skill) => (
              <div
                key={skill}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                  {skill}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Skills 