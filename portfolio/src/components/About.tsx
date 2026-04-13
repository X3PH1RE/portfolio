import { useEffect, useRef } from 'react'

export default function About() {
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
    <section id="about" className="section" ref={sectionRef}>
      <div className="about-grid">
        <div className="about-text">
          <h2 className="section-title reveal reveal-delay-1" style={{ marginBottom: '24px' }}>
            About <span className="serif-italic">me.</span>
          </h2>
          <p className="reveal reveal-delay-2">
            I'm an IT undergrad at CUSAT, Kochi, but most of my work happens outside the classroom. I've somehow managed to co-found a startup, write code for hospitals in Japan, and play with robots at a nuclear research center—all while trying to keep my GPA intact.
          </p>
          <p className="reveal reveal-delay-3">
            I like the entire process of shipping software—from sketching out the initial architecture on a napkin to writing the code and seeing it run in production. I enjoy taking ownership of a project and making sure it actually solves the problem it was meant to.
          </p>
          <p className="reveal reveal-delay-3">
            Right now, I'm working with the local police to pilot an intelligent traffic management system. When I'm not doing that, I'm usually organizing hackathons or trying to convince my code to compile on the first try.
          </p>
        </div>

        <div className="photo-stack reveal reveal-delay-2">
          <div className="photo-card photo-current">
            <img 
              src="/photo.jpeg" 
              alt="Ashwin" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
                objectPosition: 'center'
              }} 
            />
          </div>
        </div>
      </div>
    </section>
  )
}