import { useFrame, useThree } from '@react-three/fiber'
import { MathUtils } from 'three'
import type { MutableRefObject } from 'react'
import type { PointerPosition } from './usePointerPosition'

type CameraRigProps = {
  progress: MutableRefObject<number>
  pointer: MutableRefObject<PointerPosition>
}

function range(progress: number, start: number, end: number) {
  const value = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return value * value * (3 - 2 * value)
}

export default function CameraRig({ progress, pointer }: CameraRigProps) {
  const size = useThree((state) => state.size)

  useFrame(({ camera }, delta) => {
    const current = progress.current
    const scatter = range(current, 0.15, 0.35)
    const explore = range(current, 0.35, 0.65)
    const solution = range(current, 0.65, 0.9)
    const finalPullback = range(current, 0.9, 1)

    let targetZ = MathUtils.lerp(9, 10, scatter)
    targetZ = MathUtils.lerp(targetZ, 6.2, explore)
    targetZ = MathUtils.lerp(targetZ, 8.6, solution)
    targetZ = MathUtils.lerp(targetZ, 11, finalPullback)

    const targetX =
      Math.sin(explore * Math.PI) * 0.55 +
      (pointer.current.active ? pointer.current.x * 0.16 : 0)
    const targetY =
      Math.sin(explore * Math.PI * 2) * 0.25 +
      (pointer.current.active ? -pointer.current.y * 0.12 : 0)
    const aspectRatio = size.width / size.height
    const mobileFraming = Math.max(1, 0.95 / aspectRatio)

    camera.position.x = MathUtils.damp(camera.position.x, targetX, 2.8, delta)
    camera.position.y = MathUtils.damp(camera.position.y, targetY, 2.8, delta)
    camera.position.z = MathUtils.damp(
      camera.position.z,
      targetZ * mobileFraming,
      2.8,
      delta,
    )
    camera.lookAt(0, 0, 0)
  })

  return null
}
