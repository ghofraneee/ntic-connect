import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Color, Fog, MathUtils } from 'three'
import type { DirectionalLight, PointLight } from 'three'
import type { MutableRefObject } from 'react'
import CameraRig from './CameraRig'
import DiamondTrio from './DiamondTrio'
import NodeNetwork from './NodeNetwork'
import type { PointerPosition } from './usePointerPosition'

type SceneProps = {
  scrollProgress: MutableRefObject<number>
  pointer: MutableRefObject<PointerPosition>
  nodeCount: number
  maxDpr: number
  frameLoop: 'always' | 'never' | 'demand'
}

type SceneContentsProps = Pick<
  SceneProps,
  'scrollProgress' | 'pointer' | 'nodeCount'
>

const WARM_KEY = new Color('#FFFFFF')
const COLD_KEY = new Color('#B9D7FF')
const WARM_RIM = new Color('#9FBFFF')
const COLD_RIM = new Color('#D4E5FF')

function range(progress: number, start: number, end: number) {
  const value = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return value * value * (3 - 2 * value)
}

function SceneContents({
  scrollProgress,
  pointer,
  nodeCount,
}: SceneContentsProps) {
  const progress = useRef(0)
  const keyLightRef = useRef<DirectionalLight>(null)
  const rimLightRef = useRef<PointLight>(null)

  useFrame(({ scene, size }, delta) => {
    progress.current = MathUtils.damp(
      progress.current,
      scrollProgress.current,
      3.5,
      delta,
    )

    const aspectRatio = size.width / size.height
    const mobileFraming = Math.max(1, 0.95 / aspectRatio)
    if (scene.fog instanceof Fog) {
      scene.fog.near = 10 * mobileFraming
      scene.fog.far = 23 * mobileFraming
    }

    const coldness = range(progress.current, 0.15, 0.35)
    if (keyLightRef.current) {
      keyLightRef.current.color.copy(WARM_KEY).lerp(COLD_KEY, coldness)
      keyLightRef.current.intensity = 2.2 - coldness * 0.35
    }
    if (rimLightRef.current) {
      rimLightRef.current.color.copy(WARM_RIM).lerp(COLD_RIM, coldness)
    }
  })

  return (
    <>
      <CameraRig progress={progress} pointer={pointer} />
      <ambientLight intensity={0.8} />
      <directionalLight
        ref={keyLightRef}
        color="#FFFFFF"
        intensity={2.2}
        position={[-4, 6, 8]}
      />
      <pointLight
        ref={rimLightRef}
        color="#9FBFFF"
        intensity={18}
        position={[5, 2, -3]}
      />
      <NodeNetwork
        progress={progress}
        pointer={pointer}
        nodeCount={nodeCount}
      />
      <DiamondTrio progress={progress} pointer={pointer} />
    </>
  )
}

export default function Scene({
  scrollProgress,
  pointer,
  nodeCount,
  maxDpr,
  frameLoop,
}: SceneProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(180deg, #0B1B3A 0%, #060F24 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45 }}
        dpr={[1, maxDpr]}
        frameloop={frameLoop}
        onCreated={({ scene }) => {
          scene.fog = new Fog('#060F24', 10, 23)
        }}
      >
        <SceneContents
          scrollProgress={scrollProgress}
          pointer={pointer}
          nodeCount={nodeCount}
        />
      </Canvas>
    </div>
  )
}
