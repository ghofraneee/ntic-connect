import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { ExtrudeGeometry, MathUtils, Path, Shape } from 'three'
import type { Mesh } from 'three'
import type { MutableRefObject } from 'react'
import type { PointerPosition } from './usePointerPosition'

type DiamondTrioProps = {
  progress: MutableRefObject<number>
  pointer: MutableRefObject<PointerPosition>
}

const frames = [
  { color: '#2E9B4F', position: [-1.82, 0, 0.08] as const },
  { color: '#8A8D91', position: [0, 0, 0] as const },
  { color: '#1F4E9C', position: [1.82, 0, 0.08] as const },
]

function createFrameGeometry() {
  const outerRadius = 1.65
  const innerRadius = 1.02
  const shape = new Shape()

  shape.moveTo(0, outerRadius)
  shape.lineTo(outerRadius, 0)
  shape.lineTo(0, -outerRadius)
  shape.lineTo(-outerRadius, 0)
  shape.closePath()

  const hole = new Path()
  hole.moveTo(0, innerRadius)
  hole.lineTo(-innerRadius, 0)
  hole.lineTo(0, -innerRadius)
  hole.lineTo(innerRadius, 0)
  hole.closePath()
  shape.holes.push(hole)

  return new ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.04,
    bevelThickness: 0.05,
  })
}

function range(progress: number, start: number, end: number) {
  const value = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return value * value * (3 - 2 * value)
}

export default function DiamondTrio({ progress, pointer }: DiamondTrioProps) {
  const geometry = useMemo(() => createFrameGeometry(), [])
  const framesRef = useRef<Array<Mesh | null>>([])

  useFrame(() => {
    const separated =
      range(progress.current, 0.15, 0.35) *
      (1 - range(progress.current, 0.65, 0.9))
    const pointerX = pointer.current.active ? pointer.current.x : 0
    const pointerY = pointer.current.active ? pointer.current.y : 0

    frames.forEach((frame, index) => {
      const mesh = framesRef.current[index]
      if (!mesh) return

      const outwardScale = 1 + separated * 0.75
      mesh.position.set(
        frame.position[0] * outwardScale + pointerX * 0.05,
        frame.position[1] + (index - 1) * separated * 0.36 - pointerY * 0.04,
        frame.position[2] + (index === 1 ? -0.3 : 0.3) * separated,
      )
      mesh.rotation.set(
        (index - 1) * separated * 0.07 - pointerY * 0.035,
        (1 - index) * separated * 0.08 + pointerX * 0.035,
        (index - 1) * separated * 0.09,
      )
    })
  })

  return (
    <group>
      {frames.map(({ color, position }, index) => (
        <mesh
          key={color}
          ref={(mesh) => {
            framesRef.current[index] = mesh
          }}
          geometry={geometry}
          position={position}
          rotation={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={color}
            metalness={0.24}
            roughness={index === 2 ? 0.3 : index === 1 ? 0.58 : 0.42}
          />
        </mesh>
      ))}
    </group>
  )
}
