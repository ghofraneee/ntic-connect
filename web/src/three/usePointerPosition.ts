import { useEffect, useRef } from 'react'

export type PointerPosition = {
  x: number
  y: number
  active: boolean
}

export default function usePointerPosition(enabled: boolean) {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0, active: false })

  useEffect(() => {
    if (!enabled) {
      pointer.current.active = false
      return
    }

    const mediaQuery = window.matchMedia('(pointer: fine)')
    const handleMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1
      pointer.current.active = true
    }
    const handleLeave = () => {
      pointer.current.active = false
    }
    const handlePointerCapability = (event: MediaQueryListEvent) => {
      if (!event.matches) handleLeave()
    }

    if (mediaQuery.matches) {
      window.addEventListener('pointermove', handleMove, { passive: true })
      window.addEventListener('pointerleave', handleLeave)
    }
    mediaQuery.addEventListener('change', handlePointerCapability)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerleave', handleLeave)
      mediaQuery.removeEventListener('change', handlePointerCapability)
    }
  }, [enabled])

  return pointer
}
