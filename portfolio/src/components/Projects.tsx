import { useEffect, useRef } from 'react'

const projects = [
  {
    title: 'Make-A-Ton Website',
    desc: "Designed and built the registration and event platform for South India's largest student hackathon. Handled heavy traffic spikes during submission deadlines without catching fire.",
    tags: ['React', 'Full-Stack', 'Event Platform'],
    link: 'https://makeaton.in',
    emoji: '🎪',
  },
  {
    title: 'Hailo',
    desc: 'A real-time ride-hailing web app built for college campuses. Because walking to class in the blazing sun is terrible.',
    tags: ['React', 'Supabase', 'Maps'],
    link: '#',
    emoji: '🛵',
  },
  {
    title: 'Velocity',
    desc: 'An emergency vehicle prioritization module. Uses real-time traffic data to dynamically clear signals for ambulances before they reach the junction.',
    tags: ['OpenCV', 'Python', 'AI'],
    link: '#',
    emoji: '🚨',
  },
  {
    title: 'WealthNest',
    desc: 'A portfolio management dashboard featuring a predictive stock model. It probably won\'t make you the next Warren Buffett, but the dark mode charts look really nice.',
    tags: ['Django', 'PostgreSQL', 'Streamlit'],
    link: '#',
    emoji: '📈',
  },
]

export default function Projects() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll('.reveal').forEach((el, i) => {
              setTimeout(() => el.classList.add('visible'), i * 150)
            })
          }
        })
      },
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="projects" className="section" ref={sectionRef}>
      <div className="section-label reveal">03. PROJECTS</div>
      <h2 className="section-title reveal reveal-delay-1">
        Stuff I <span className="serif-italic">made.</span>
      </h2>

      <div className="projects-grid">
        {projects.map((p, i) => (
          <div key={p.title} className={`project-card window-card reveal reveal-delay-${(i % 2) + 1}`}>
            <div className="window-header">
              <span className="window-dot"></span>
              <span className="window-dot"></span>
              <span className="window-dot"></span>
            </div>
            <div className="project-img-wrap">
              {p.emoji}
            </div>
            <div className="project-info">
              <h3 className="project-title">{p.title}</h3>
              <p className="project-desc">{p.desc}</p>
              <div className="project-tags">
                {p.tags.map(t => <span key={t} className="project-tag">{t}</span>)}
              </div>
              {p.link !== '#' && (
                <a href={p.link} target="_blank" rel="noopener noreferrer" className="project-link">
                  Visit Site ↗
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashed-line reveal"></div>
    </section>
  )
}
