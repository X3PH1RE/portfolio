import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'

const links = [
  { label: 'About', href: '#about' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
]

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
    <>
      <nav className={`nav${scrolled ? ' scrolled' : ''}`}>
        <a
          className="nav-logo"
          href="#home"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          ashwin.
        </a>

        <ul className="nav-links">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} className={active === l.href ? 'active' : ''}>
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a href="mailto:ashwinmenon502@gmail.com" className="nav-cta">
              Say Hi 👋
            </a>
          </li>
        </ul>

        <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
          <ThemeToggle />
        </div>

        <button
          className={`nav-hamburger${menuOpen ? ' open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      <div className={`nav-mobile${menuOpen ? ' open' : ''}`}>
        {links.map(l => (
          <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href="mailto:ashwinmenon502@gmail.com" style={{ color: 'var(--accent)' }}>
          Say Hi 👋
        </a>
      </div>
    </>
  )
}
