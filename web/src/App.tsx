import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import SceneErrorBoundary from './three/SceneErrorBoundary'
import SceneFallback from './three/SceneFallback'
import usePointerPosition from './three/usePointerPosition'
import useScrollProgress from './three/useScrollProgress'
import SpacesSection from './SpacesSection'
import {
  getDeviceQuality,
  prefersReducedMotion,
} from './three/lib/quality'
import type { DeviceQuality } from './three/lib/quality'

const LazyScene = lazy(() => import('./three/Scene'))

export default function App() {
  const scrollProgress = useScrollProgress()
  const [quality, setQuality] = useState<DeviceQuality>(() => getDeviceQuality())
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion)
  const [sceneVisible, setSceneVisible] = useState(true)
  const [tabVisible, setTabVisible] = useState(true)
  const pointer = usePointerPosition(quality.mouseEffects && !reducedMotion)
  const frameLoop: 'always' | 'never' | 'demand' = tabVisible
    ? sceneVisible
      ? 'always'
      : 'never'
    : 'demand'

  useEffect(() => {
    const updateQuality = () => setQuality(getDeviceQuality())
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches)
    const smallScreenQuery = window.matchMedia('(max-width: 700px)')
    const pointerQuery = window.matchMedia('(pointer: fine)')

    window.addEventListener('resize', updateQuality)
    motionQuery.addEventListener('change', updateMotionPreference)
    smallScreenQuery.addEventListener('change', updateQuality)
    pointerQuery.addEventListener('change', updateQuality)

    return () => {
      window.removeEventListener('resize', updateQuality)
      motionQuery.removeEventListener('change', updateMotionPreference)
      smallScreenQuery.removeEventListener('change', updateQuality)
      pointerQuery.removeEventListener('change', updateQuality)
    }
  }, [])

  useEffect(() => {
    const updateVisibility = () =>
      setTabVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', updateVisibility)
    updateVisibility()

    return () =>
      document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return

    const revealSections = document.querySelectorAll(
      '.hero-section, .spaces-section, .cta-section',
    )
    const visibleSections = new Set<Element>()
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target)
          else visibleSections.delete(entry.target)
        })
        setSceneVisible(visibleSections.size > 0)
      },
      { threshold: 0.01 },
    )

    revealSections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {reducedMotion ? (
        <SceneFallback />
      ) : (
        <SceneErrorBoundary fallback={<SceneFallback />}>
          <Suspense fallback={<SceneFallback />}>
            <LazyScene
              scrollProgress={scrollProgress}
              pointer={pointer}
              nodeCount={quality.nodeCount}
              maxDpr={quality.maxDpr}
              frameLoop={frameLoop}
            />
          </Suspense>
        </SceneErrorBoundary>
      )}
      <main className="ntic-page">
        <section
          id="hero"
          className="story-section hero-section"
          aria-labelledby="hero-title"
        >
          <div className="section-sticky hero-content">
            <p className="section-eyebrow">OFPPT · Une communauté connectée</p>
            <h1 id="hero-title">NTIC Connect</h1>
            <p className="hero-description">
              Un espace commun pour rapprocher les étudiants, les formateurs,
              l’administration et les clubs.
            </p>
            <a className="text-link" href="#constat">
              Découvrir la plateforme <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section
          id="constat"
          className="story-section finding-section"
          aria-labelledby="finding-title"
        >
          <div className="section-sticky text-section-content">
            <p className="section-eyebrow">01 · Le constat</p>
            <h2 id="finding-title">
              Les échanges gagnent à être réunis.
            </h2>
            <p>
              Quand les informations, les ressources et les initiatives sont
              dispersées, il devient plus difficile de faire vivre la
              communauté du campus.
            </p>
          </div>
        </section>

        <SpacesSection reducedMotion={reducedMotion} />

        <section
          id="produit"
          className="story-section product-section"
          aria-labelledby="product-title"
        >
          <div className="section-sticky text-section-content">
            <p className="section-eyebrow">03 · Le produit</p>
            <h2 id="product-title">
              Un point de rencontre pour la vie du campus.
            </h2>
            <p>
              NTIC Connect rassemble les personnes, les informations et les
              espaces de la communauté dans une expérience commune.
            </p>
            <ul className="product-benefits">
              <li>Une communauté réunie au même endroit</li>
              <li>Des espaces pensés pour les différents acteurs</li>
              <li>Des échanges et initiatives plus faciles à suivre</li>
            </ul>
          </div>
        </section>

        <section
          id="cta"
          className="story-section cta-section"
          aria-labelledby="cta-title"
        >
          <div className="section-sticky cta-content">
            <p className="section-eyebrow">04 · Ensemble</p>
            <h2 id="cta-title">La communauté avance mieux connectée.</h2>
            <a className="text-link" href="#espaces">
              Explorer les sept espaces <span aria-hidden="true">↑</span>
            </a>
          </div>
        </section>
      </main>
    </>
  )
}
