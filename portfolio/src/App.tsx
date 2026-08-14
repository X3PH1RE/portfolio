import { useEffect, useState } from 'react'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Experience from './components/Experience'
import Projects from './components/Projects'
import Skills from './components/Skills'
import Leadership from './components/Leadership'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Pokemon from './components/Pokemon'
import DataDashboard from './components/DataDashboard'
import { initAnalytics } from './utils/analytics'
import { Analytics } from "@vercel/analytics/react"
import './index.css'

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
]

export default function App() {
  const [konamiIndex, setKonamiIndex] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const isDataRoute = window.location.pathname.startsWith('/data')

  useEffect(() => {
    if (!isDataRoute) {
      initAnalytics()
    }
  }, [isDataRoute])

  useEffect(() => {
    if (isDataRoute) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[konamiIndex]) {
        if (konamiIndex === KONAMI_CODE.length - 1) {
          setShowEasterEgg(true)
          setKonamiIndex(0)
        } else {
          setKonamiIndex(konamiIndex + 1)
        }
      } else {
        setKonamiIndex(0)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [konamiIndex, isDataRoute])

  if (isDataRoute) {
    return <DataDashboard />
  }

  return (
    <>
      <Cursor />
      <Nav />
      
      {/* 5 Subtle Background Animations - Organic & Calming */}
      <svg className="bg-doodle doodle-float-1" style={{ top: '15%', left: '8%', width: '120px' }} viewBox="0 0 200 200" fill="none">
        <path d="M40 100 C 40 40, 160 40, 160 100 C 160 160, 40 160, 40 100" stroke="var(--accent-blue)" strokeWidth="1.5" strokeDasharray="8 8" opacity="0.4" />
      </svg>
      
      <svg className="bg-doodle doodle-spin-slow" style={{ top: '25%', right: '10%', width: '180px' }} viewBox="0 0 200 200" fill="none">
        <path d="M100 20 C 120 60, 180 80, 140 120 C 160 180, 100 150, 60 180 C 40 140, 20 80, 80 60 C 60 20, 100 20, 100 20 Z" stroke="var(--accent-yellow)" strokeWidth="1" opacity="0.3" strokeLinejoin="round" />
      </svg>
      
      <svg className="bg-doodle doodle-float-2" style={{ bottom: '15%', left: '12%', width: '150px' }} viewBox="0 0 200 200" fill="none">
        <path d="M20 100 Q 60 20, 100 100 T 180 100" stroke="var(--accent-green)" strokeWidth="2" fill="none" opacity="0.3" strokeLinecap="round" />
        <circle cx="100" cy="100" r="4" fill="var(--accent-green)" opacity="0.4" />
      </svg>
      
      <svg className="bg-doodle doodle-drift" style={{ top: '65%', right: '15%', width: '140px' }} viewBox="0 0 200 200" fill="none">
        <path d="M30 150 C 60 100, 140 100, 170 50" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.3" strokeLinecap="round" />
        <path d="M50 170 C 80 120, 160 120, 190 70" stroke="var(--accent)" strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      </svg>
      
      <svg className="bg-doodle doodle-pulse-soft" style={{ bottom: '30%', right: '35%', width: '90px' }} viewBox="0 0 200 200" fill="none">
        <circle cx="100" cy="100" r="60" stroke="var(--border)" strokeWidth="0.5" opacity="0.2" />
        <circle cx="100" cy="100" r="40" stroke="var(--border)" strokeWidth="1" opacity="0.15" strokeDasharray="2 4" />
        <circle cx="100" cy="100" r="20" stroke="var(--border)" strokeWidth="1.5" opacity="0.1" />
      </svg>

      <main>
        <Hero />
        <About />
        <Experience />
        <Projects />
        <Skills />
        <Leadership />
        <Contact />
      </main>
      <Footer />
      <Pokemon />
      <Analytics />

      {showEasterEgg && (
        <div className="konami-overlay" onClick={() => setShowEasterEgg(false)}>
          <div className="konami-content" onClick={e => e.stopPropagation()}>
            <h2>Cheat Code Activated!</h2>
            <p>
              You just unlocked infinite coffee and zero merge conflicts for the rest of the week. ☕✨
            </p>
            <button className="btn btn-primary" onClick={() => setShowEasterEgg(false)}>
              Back to reality
            </button>
          </div>
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i} 
              className="confetti-piece"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 2}s`,
                background: ['var(--accent)', 'var(--accent-yellow)', 'var(--accent-blue)', 'var(--accent-green)'][Math.floor(Math.random() * 4)],
                borderRadius: Math.random() > 0.5 ? '50%' : '0'
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

