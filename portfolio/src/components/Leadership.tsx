import { useEffect, useRef } from 'react'

const roles = [
  {
    role: 'Organizer',
    org: 'Make-A-Ton 8.0',
    desc: "Core organizer for South India's largest student-run hackathon. Managed the technical infrastructure and coordinated with sponsors to keep the event running smoothly.",
  },
  {
    role: 'Tech Manager',
    org: 'SEDS CUSAT',
    desc: "Technical manager for the campus space club. Built and maintained the platforms used for our technical events and workshops.",
  },
  {
    role: 'Student Lead',
    org: 'IEDC CUSAT',
    desc: 'Organized workshops and events focused on getting students to build and ship their own projects.',
  },
]

export default function Leadership() {
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
      { threshold: 0.2 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="leadership" className="section" ref={sectionRef}>
      <div className="section-label reveal">05. COMMUNITY</div>
      <h2 className="section-title reveal reveal-delay-1">
        When I'm not <span className="serif-italic">coding.</span>
      </h2>

      <div className="projects-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {roles.map((r, i) => (
          <div key={r.org} className={`window-card reveal reveal-delay-${i + 1}`}>
            <div className="window-header">
              <span className="window-dot"></span>
              <span className="window-dot"></span>
              <span className="window-dot"></span>
            </div>
            <div className="window-body">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{r.role}</h3>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', marginBottom: '16px', color: 'var(--text-muted)' }}>
                @ {r.org}
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{r.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="dashed-line reveal"></div>
    </section>
  )
}
