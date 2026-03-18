import { useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    
    // Default to light mode unless the user explicitly saved 'dark' previously
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    const willBeDark = !isDark
    
    // Fallback for browsers that don't support View Transitions API (Firefox, Safari)
    if (!document.startViewTransition) {
      document.documentElement.classList.add('theme-transition')
      applyTheme(willBeDark)
      setTimeout(() => {
        document.documentElement.classList.remove('theme-transition')
      }, 500)
      return
    }

    // Get click coordinates for the origin of the circle
    const x = e.clientX
    const y = e.clientY
    
    // Calculate the radius needed to cover the entire screen
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      flushSync(() => {
        applyTheme(willBeDark)
      })
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ]
        },
        {
          duration: 700,
          easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    })
  }

  const applyTheme = (dark: boolean) => {
    setIsDark(dark)
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggleTheme}
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: 'var(--bg)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'transform 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)'
        e.currentTarget.style.background = 'var(--accent-yellow)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.background = 'var(--bg)'
      }}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  )
}
