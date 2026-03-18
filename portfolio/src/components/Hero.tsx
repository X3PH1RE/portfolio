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
          Welcome to<br />
          <span className="serif-italic">ashwin's</span> corner<br />
          of the internet.
        </h1>

        <p className="hero-desc reveal visible reveal-delay-2">
          ashwin likes to <span>{typedText}</span>
        </p>
      </div>
    </section>
  )
}
