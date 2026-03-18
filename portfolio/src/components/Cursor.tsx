import { useEffect, useRef } from 'react'

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = dotRef.current
    if (!dot) return

    let mouseX = -100, mouseY = -100
    let dotX = -100, dotY = -100
    let rafId: number

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const animate = () => {
      // Smooth lerp for the dot
      dotX += (mouseX - dotX) * 0.2
      dotY += (mouseY - dotY) * 0.2
      dot.style.left = dotX + 'px'
      dot.style.top = dotY + 'px'

      rafId = requestAnimationFrame(animate)
    }

    const onEnter = () => dot.classList.add('hovering')
    const onLeave = () => dot.classList.remove('hovering')

    document.addEventListener('mousemove', onMove)
    animate()

    const hoverEls = document.querySelectorAll('a, button, input, textarea')
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', onEnter)
      el.addEventListener('mouseleave', onLeave)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return <div className="cursor-dot" ref={dotRef} />
}
