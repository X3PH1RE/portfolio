import { useEffect, useState } from 'react'

const ROLES = [
  'build software.',
  'train robots.',
  'design systems.',
  'write code.',
  'break things.',
  'fix them later.',
]

export default function Hero() {
  const [typedText, setTypedText] = useState('')
  const [roleIdx, setRoleIdx] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    const current = ROLES[roleIdx]
    const speed = isDeleting ? 40 : 100
    const pauseDelay = 2000

    if (!isDeleting && charIdx === current.length) {
      const t = setTimeout(() => setIsDeleting(true), pauseDelay)
      return () => clearTimeout(t)
    }
    if (isDeleting && charIdx === 0) {
      setIsDeleting(false)
      setRoleIdx(r => (r + 1) % ROLES.length)
      return
    }

    const t = setTimeout(() => {
      const next = isDeleting ? charIdx - 1 : charIdx + 1
      setCharIdx(next)
      setTypedText(current.substring(0, next))
    }, speed)

    return () => clearTimeout(t)
  }, [charIdx, isDeleting, roleIdx])

  return (
    <section id="home" className="section hero">
      <div className="hero-content">  

        <h1 className="hero-title reveal visible reveal-delay-1">
          Heyyy I'm Ashwin.<br />
          I <span className="serif-italic" style={{ color: 'var(--accent)' }}>{typedText}</span>
          <span style={{ fontWeight: 300, animation: 'blink 1s step-end infinite' }}>|</span>
        </h1>

        <p className="hero-desc reveal visible reveal-delay-2">
          I'm a software engineer based in Kochi. I spend my time building systems that solve actual problems—from untangling city traffic with AI to teaching drones how to land without crashing.
        </p>

        <div className="hero-actions reveal visible reveal-delay-3">
          <a href="#projects" className="btn btn-primary">
            View Projects
          </a>
          <a href="#contact" className="btn">
            Get in touch
          </a>
        </div>
      </div>
    </section>
  )
}
