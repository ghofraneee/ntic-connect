import { useEffect, useRef } from 'react'

const spaces = [
  {
    name: 'Étudiants',
    description: 'Les informations utiles au parcours et à la vie étudiante.',
  },
  {
    name: 'Formateurs',
    description: 'Un espace pour partager ressources et accompagnement.',
  },
  {
    name: 'Administration',
    description: 'Les actualités et repères essentiels de l’établissement.',
  },
  {
    name: 'Clubs',
    description: 'Les initiatives, activités et communautés du campus.',
  },
  {
    name: 'Cours & ressources',
    description: 'Des supports et ressources réunis dans un même espace.',
  },
  {
    name: 'Événements',
    description: 'Les rendez-vous qui rythment la vie de l’établissement.',
  },
  {
    name: 'Stages & insertion',
    description: 'Les pistes et ressources pour préparer la suite du parcours.',
  },
]

type SpacesSectionProps = {
  reducedMotion: boolean
}

export default function SpacesSection({ reducedMotion }: SpacesSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const track = trackRef.current
    if (!section || !track) return
    if (reducedMotion) {
      track.style.removeProperty('transform')
      return
    }

    let frame = 0
    const updateTrack = () => {
      const scrollDistance = section.offsetHeight - window.innerHeight
      const progress =
        scrollDistance > 0
          ? Math.min(
              1,
              Math.max(0, -section.getBoundingClientRect().top / scrollDistance),
            )
          : 0
      const travelDistance = Math.max(track.scrollWidth - section.clientWidth, 0)

      track.style.transform = `translate3d(${-travelDistance * progress}px, 0, 0)`
    }
    const scheduleUpdate = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(updateTrack)
    }

    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)
    const observer = new ResizeObserver(scheduleUpdate)
    observer.observe(track)
    updateTrack()

    return () => {
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  return (
    <section
      ref={sectionRef}
      id="espaces"
      className={`story-section spaces-section${reducedMotion ? ' spaces-section--reduced' : ''}`}
      aria-labelledby="spaces-title"
    >
      <div className="section-sticky spaces-content">
        <header className="spaces-heading">
          <p className="section-eyebrow">02 · Les 7 espaces</p>
          <h2 id="spaces-title">Un espace pour chaque facette du campus.</h2>
          <p>Faites défiler pour découvrir les espaces de la communauté.</p>
        </header>
        <div
          className="spaces-window"
          role="region"
          aria-label="Les sept espaces, défilement horizontal"
          tabIndex={0}
        >
          <div className="spaces-track" ref={trackRef}>
            {spaces.map(({ name, description }, index) => (
              <article className="space-card" key={name}>
                <span className="space-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3>{name}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
        <p className="spaces-hint" aria-hidden="true">
          Continuez à défiler <span>→</span>
        </p>
      </div>
    </section>
  )
}
