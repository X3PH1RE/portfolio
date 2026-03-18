export default function Footer() {
  return (
    <footer className="footer">
      <div>Designed & Built by Me and your friendly neighborhood Claude</div>
      <div>© {new Date().getFullYear()} — All rights reserved. <span style={{ opacity: 0.5 }}>(probably)</span></div>
    </footer>
  )
}
