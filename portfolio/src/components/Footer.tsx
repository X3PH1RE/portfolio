import { useState } from 'react'

export default function Footer() {
  const [clicks, setClicks] = useState(0)

  return (
    <footer className="footer">
      <div 
        className="footer-doodle" 
        onClick={() => setClicks(c => c + 1)}
        style={{ cursor: 'pointer', userSelect: 'none', transition: 'transform 0.2s' }}
        title="Don't click me too many times"
      >
        {clicks >= 5 ? '🚀' : '✌️'}
      </div>
      
      {clicks >= 5 && (
        <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginTop: '-4px' }}>
          Okay, you found the secret button. Now go build something cool.
        </div>
      )}

      <div>Designed & Built by Ashwin Menon</div>
      <div>© {new Date().getFullYear()} — All rights reserved. <span style={{ opacity: 0.5 }}>(probably)</span></div>
    </footer>
  )
}
