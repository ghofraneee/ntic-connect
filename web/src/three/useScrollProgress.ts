import { useEffect, useRef } from 'react'

const SCENE_RANGES = [
  { id: 'hero', start: 0, end: 0.15 },
  { id: 'constat', start: 0.15, end: 0.35 },
  { id: 'espaces', start: 0.35, end: 0.65 },
  { id: 'produit', start: 0.65, end: 0.9 },
  { id: 'cta', start: 0.9, end: 1 },
]

export default function useScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    const updateProgress = () => {
      const sections = SCENE_RANGES.map(({ id }) =>
        document.getElementById(id),
      )

      if (sections.some((section) => section === null)) {
        const scrollableHeight =
          document.documentElement.scrollHeight - window.innerHeight
        progress.current =
          scrollableHeight > 0
            ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight))
            : 0
        return
      }

      let completedProgress = 0
      for (let index = 0; index < SCENE_RANGES.length; index += 1) {
        const section = sections[index]
        const range = SCENE_RANGES[index]
        if (!section || !range) continue

        const start = section.getBoundingClientRect().top + window.scrollY
        const activeDistance = Math.max(
          0,
          section.offsetHeight - window.innerHeight,
        )
        const activeEnd = start + activeDistance

        if (window.scrollY < start) break
        if (window.scrollY <= activeEnd || index === SCENE_RANGES.length - 1) {
          const localProgress =
            activeDistance > 0
              ? Math.min(
                  1,
                  Math.max(0, (window.scrollY - start) / activeDistance),
                )
              : 1
          progress.current =
            range.start + (range.end - range.start) * localProgress
          return
        }

        completedProgress = range.end
      }

      progress.current = completedProgress
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    const observer = new ResizeObserver(updateProgress)
    observer.observe(document.documentElement)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
      observer.disconnect()
    }
  }, [])

  return progress
}
