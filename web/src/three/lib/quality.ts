export const DEFAULT_NODE_COUNT = 150

export type DeviceQuality = {
  nodeCount: number
  maxDpr: number
  mouseEffects: boolean
}

export function getDeviceQuality(): DeviceQuality {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { nodeCount: DEFAULT_NODE_COUNT, maxDpr: 1.5, mouseEffects: false }
  }

  const smallScreen = window.matchMedia('(max-width: 700px)').matches
  const hardwareConcurrency = navigator.hardwareConcurrency || 0
  const lowEnd = smallScreen || (hardwareConcurrency > 0 && hardwareConcurrency <= 4)

  return {
    nodeCount: lowEnd ? Math.round(DEFAULT_NODE_COUNT * 0.3) : DEFAULT_NODE_COUNT,
    maxDpr: lowEnd ? 1 : 1.5,
    mouseEffects: !lowEnd && window.matchMedia('(pointer: fine)').matches,
  }
}

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
