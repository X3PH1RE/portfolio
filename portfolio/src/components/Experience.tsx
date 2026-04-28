import { useEffect, useRef } from 'react'

const experiences = [
  {
    role: 'Co-Founder',
    company: 'UrbanVerve',
    period: 'Sep 2023 – Mar 2026',
    points: [
      'Trying to fix Kochi\'s infamous traffic using cameras and AI.',
      'Built computer vision pipelines using OpenCV and CNNs to analyze real-time CCTV feeds.',
      'Went on to pilot the system with the local police (yes, they actually let us test it on real roads).',
    ],
  },
  {
    role: 'Software Engineering Intern',
    company: 'Techo Project Japan Co.',
    period: 'Jan 2026 – Feb 2026',
    points: [
      'Built a full-stack inventory management system for Matsue City Hospital.',
      'Handled the system architecture, database design, and frontend implementation.',
      'Basically made sure they could track their medical supplies in real-time without pulling their hair out.',
    ],
  },
  {
    role: 'Project Trainee',
    company: 'Bhabha Atomic Research Centre',
    period: 'May 2025 – Jul 2025',
    points: [
      'Developed an automated algorithm for detecting and aligning drum caps in heavy water storage.',
      'Sounds intimidating, but it was mostly just a lot of math and simulation testing in CoppeliaSim.',
      'Processed line-scanner depth data to ensure precise alignment in simulation.',
    ],
  },
  {
    role: 'Software Developer Intern',
    company: 'KIREAP',
    period: 'Aug 2024 – Feb 2025',
    points: [
      'Built an autonomous drone landing system relying entirely on computer vision.',
      'Spent a lot of time optimizing AprilTag detection so the drones wouldn\'t get confused and land in a tree.',
      'Wrote and tested the control logic using ROS 2 and ArduPilot.',
    ],
  },
]

export default function Experience() {
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
      { threshold: 0.1 }
    )
    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section id="experience" className="section" ref={sectionRef}>
      <div className="section-label reveal">02. EXPERIENCE</div>
      <h2 className="section-title reveal reveal-delay-1">
        My <span className="serif-italic">paper trail.</span>
      </h2>

      <div className="timeline">
        {experiences.map((exp, i) => (
          <div key={i} className={`timeline-item reveal reveal-delay-${Math.min(i + 1, 3)}`}>
            <div className="timeline-dot" />
            <div className="timeline-card window-card">
              <div className="window-header">
                <span className="window-dot"></span>
                <span className="window-dot"></span>
                <span className="window-dot"></span>
              </div>
              <div className="window-body">
                <div className="timeline-header">
                  <div>
                    <div className="timeline-role">{exp.role}</div>
                    <div className="timeline-company">@ {exp.company}</div>
                  </div>
                  <div className="timeline-period">{exp.period}</div>
                </div>
                <ul className="timeline-points">
                  {exp.points.map((pt, j) => (
                    <li key={j}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashed-line reveal"></div>
    </section>
  )
}
