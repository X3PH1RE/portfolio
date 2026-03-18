import { useEffect, useRef } from 'react'

export default function Contact() {
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
    <section id="contact" className="section" ref={sectionRef}>
      <div className="contact-wrapper">
        <h2 className="reveal">
          Let's <span className="serif-italic" style={{ color: 'var(--accent)' }}>talk.</span>
        </h2>
        <p className="reveal reveal-delay-1">
          I'm always open to discussing new projects, opportunities, or just talking about tech. Feel free to reach out.
        </p>

        <div className="social-links reveal reveal-delay-2">
          <a href="mailto:ashwinmenon502@gmail.com" className="social-link">
            <span>✉️</span> Email
          </a>
          <a href="https://linkedin.com/in/ashwinmenon502" target="_blank" rel="noopener noreferrer" className="social-link">
            <span>💼</span> LinkedIn
          </a>
          <a href="https://github.com/X3PH1RE" target="_blank" rel="noopener noreferrer" className="social-link">
            <span>🐙</span> GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
