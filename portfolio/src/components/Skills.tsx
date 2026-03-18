import { useEffect, useRef } from 'react'

const skillGroups = [
  {
    title: 'Languages',
    skills: ['Python', 'C++', 'C', 'TypeScript', 'SQL'],
  },
  {
    title: 'Web',
    skills: ['React', 'Django', 'PostgreSQL', 'MongoDB', 'Supabase'],
  },
  {
    title: 'AI & Vision',
    skills: ['OpenCV', 'CNNs', 'NumPy', 'Machine Learning'],
  },
  {
    title: 'Robotics',
    skills: ['ROS 2', 'ArduPilot', 'CoppeliaSim'],
  },
  {
    title: 'Infrastructure',
    skills: ['Git', 'Docker', 'Linux', 'Ubuntu'],
  },
]

export default function Skills() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 100)
            })
          }
        })
      },
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="skills" className="section" ref={sectionRef}>
      <div className="section-label reveal">04. SKILLS</div>
      <h2 className="section-title reveal reveal-delay-1">
        Tools of the <span className="serif-italic">trade.</span>
      </h2>

      <div className="skills-grid">
        {skillGroups.map((group, i) => (
          <div key={group.title} className={`skill-group window-card reveal reveal-delay-${i + 1}`}>
            <div className="skill-group-title">{group.title}</div>
            <div className="skill-list">
              {group.skills.map(skill => (
                <span key={skill} className="skill-item">{skill}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="dashed-line reveal"></div>
    </section>
  )
}
