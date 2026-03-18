import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const links = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Work', href: '#projects' },
]

export default function Nav() {
  const [active, setActive] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Hide if scrolling down and past 100px, show if scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsHidden(true)
      } else if (currentScrollY < lastScrollY) {
        setIsHidden(false)
      }
      
      setLastScrollY(currentScrollY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Show navbar if mouse is within 100px of the top of the screen
      if (e.clientY < 100) {
        setIsHidden(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [lastScrollY])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive('#' + entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    links.forEach(l => {
      const el = document.querySelector(l.href)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`nav-wrapper ${isHidden ? 'hidden' : ''}`}>
      <nav className="nav">
        <a
          className="nav-logo"
          href="#home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img src="/current.jpg" alt="Ashwin" onError={(e) => { e.currentTarget.src = 'https://placehold.co/100x100/2d2c2a/f9f8f6?text=A'; }} />
          <div className="nav-logo-text">
            <span>Ashwin Menon</span>
            <span className="nav-logo-sub">Kochi, IN</span>
          </div>
        </a>

        <ul className="nav-links">
          <li>
            <a href="#home" className={active === '#home' || !active ? 'active' : ''}>
              Home
            </a>
          </li>
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} className={active === l.href ? 'active' : ''}>
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <a href="#contact" className="nav-cta">
            Contact Me ↗
          </a>
          <ThemeToggle />
        </div>
      </nav>
    </div>
  )
}
