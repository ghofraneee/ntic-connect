import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Object3D,
} from 'three'
import type { InstancedMesh, LineBasicMaterial, LineSegments } from 'three'
import type { MutableRefObject } from 'react'
import type { PointerPosition } from './usePointerPosition'
import { DEFAULT_NODE_COUNT } from './lib/quality'

const NODE_COLORS = ['#9FCBFF', '#2E9B4F', '#AEB5C0', '#5D8FE5']
const HIGHLIGHT_NODE_FRACTIONS = [0.05, 0.2, 0.35, 0.5, 0.65, 0.8, 0.95]
const HIGHLIGHT_COLOR = new Color('#EAF4FF')

type NodeNetworkProps = {
  progress: MutableRefObject<number>
  pointer: MutableRefObject<PointerPosition>
  nodeCount?: number
}

type NetworkNode = {
  position: [number, number, number]
  phase: number
  speed: number
  drift: number
  radius: number
  color: Color
}

function createRandom(seed: number) {
  let value = seed

  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 0x100000000
  }
}

function createNodes(nodeCount: number) {
  const random = createRandom(2026)
  const nodes: NetworkNode[] = []

  for (let index = 0; index < nodeCount; index += 1) {
    const theta = random() * Math.PI * 2
    const vertical = random() * 2 - 1
    const radius = 3.1 + random() * 3.1
    const horizontal = Math.sqrt(1 - vertical * vertical)

    nodes.push({
      position: [
        Math.cos(theta) * horizontal * radius,
        vertical * radius * 0.66,
        Math.sin(theta) * horizontal * radius * 0.72,
      ],
      phase: random() * Math.PI * 2,
      speed: 0.12 + random() * 0.16,
      drift: 0.08 + random() * 0.14,
      radius: 0.025 + random() * 0.025,
      color: new Color(NODE_COLORS[Math.floor(random() * NODE_COLORS.length)]),
    })
  }

  return nodes
}

function createEdges(nodes: NetworkNode[]) {
  const edges = new Set<number>()
  const nodeCount = nodes.length

  nodes.forEach((node, index) => {
    const neighbors = nodes
      .map((candidate, candidateIndex) => {
        if (index === candidateIndex) return null

        const dx = node.position[0] - candidate.position[0]
        const dy = node.position[1] - candidate.position[1]
        const dz = node.position[2] - candidate.position[2]
        return { index: candidateIndex, distance: dx * dx + dy * dy + dz * dz }
      })
      .filter((neighbor) => neighbor !== null)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2)

    neighbors.forEach(({ index: neighborIndex }) => {
      edges.add(
        Math.min(index, neighborIndex) * nodeCount +
          Math.max(index, neighborIndex),
      )
    })
  })

  return Array.from(
    edges,
    (edge): [number, number] => [
      Math.floor(edge / nodeCount),
      edge % nodeCount,
    ],
  )
}

function range(progress: number, start: number, end: number) {
  const value = MathUtils.clamp((progress - start) / (end - start), 0, 1)
  return value * value * (3 - 2 * value)
}

export default function NodeNetwork({
  progress,
  pointer,
  nodeCount = DEFAULT_NODE_COUNT,
}: NodeNetworkProps) {
  const instancesRef = useRef<InstancedMesh>(null)
  const linesRef = useRef<LineSegments>(null)
  const lineMaterialRef = useRef<LineBasicMaterial>(null)
  const elapsedRef = useRef(0)
  const colorsInitializedRef = useRef(false)
  const activeHighlightRef = useRef(-1)
  const nodes = useMemo(() => createNodes(nodeCount), [nodeCount])
  const highlightNodeIndices = useMemo(
    () =>
      HIGHLIGHT_NODE_FRACTIONS.map((fraction) =>
        Math.round(fraction * (nodes.length - 1)),
      ),
    [nodes.length],
  )
  // Keep the graph topology stable while the node positions drift.
  const edges = useMemo(() => createEdges(nodes), [nodes])
  const linePositions = useMemo(() => new Float32Array(edges.length * 6), [edges])
  const lineGeometry = useMemo(() => {
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(linePositions, 3))
    return geometry
  }, [linePositions])
  const object = useMemo(() => new Object3D(), [])
  const positions = useMemo(() => new Float32Array(nodes.length * 3), [nodes])

  useFrame((_, delta) => {
    const mesh = instancesRef.current
    if (!mesh) return

    elapsedRef.current += delta
    const elapsed = elapsedRef.current
    const currentProgress = progress.current
    const scattered =
      range(currentProgress, 0.15, 0.35) *
      (1 - range(currentProgress, 0.65, 0.9))
    const organized = range(currentProgress, 0.65, 0.9)
    const panelProgress = MathUtils.clamp(
      (currentProgress - 0.35) / 0.3,
      0,
      1,
    )
    const activePanel =
      currentProgress >= 0.35 && currentProgress <= 0.65
        ? Math.min(6, Math.floor(panelProgress * 7))
        : -1
    const activeNodeIndex =
      activePanel === -1 ? -1 : highlightNodeIndices[activePanel] ?? -1
    const pointerActive = pointer.current.active
    const cursorX = pointerActive ? pointer.current.x * 4.8 : 0
    const cursorY = pointerActive ? -pointer.current.y * 3 : 0

    nodes.forEach((node, index) => {
      const { position, phase, speed, drift, radius } = node
      const time = elapsed * speed + phase
      const spread = 1 + scattered * 0.2 - organized * 0.12
      const driftAmount = drift * (1 + scattered * 1.25 - organized * 0.45)
      let x = position[0] * spread + Math.sin(time) * driftAmount
      let y = position[1] * spread + Math.cos(time * 0.83) * driftAmount
      const z = position[2] * spread + Math.sin(time * 0.67) * driftAmount
      let pointerGlow = 0

      if (pointerActive) {
        const dx = x - cursorX
        const dy = y - cursorY
        const distance = Math.sqrt(dx * dx + dy * dy)
        const influence = MathUtils.clamp(1 - distance / 1.15, 0, 1)

        if (influence > 0) {
          const direction = distance > 0 ? 1 / distance : 0
          const push = influence * 0.2
          x += dx * direction * push
          y += dy * direction * push
          pointerGlow = influence * 1.2
        }
      }

      positions[index * 3] = x
      positions[index * 3 + 1] = y
      positions[index * 3 + 2] = z

      object.position.set(x, y, z)
      const highlightScale = index === activeNodeIndex ? 2.8 : 1
      object.scale.setScalar(radius * (highlightScale + pointerGlow))
      object.updateMatrix()
      mesh.setMatrixAt(index, object.matrix)

      if (!colorsInitializedRef.current) {
        mesh.setColorAt(index, node.color)
      }
    })

    mesh.instanceMatrix.needsUpdate = true
    if (!colorsInitializedRef.current && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
      colorsInitializedRef.current = true
    }

    if (activeHighlightRef.current !== activeNodeIndex && mesh.instanceColor) {
      if (activeHighlightRef.current !== -1) {
        mesh.setColorAt(
          activeHighlightRef.current,
          nodes[activeHighlightRef.current].color,
        )
      }
      if (activeNodeIndex !== -1) {
        mesh.setColorAt(activeNodeIndex, HIGHLIGHT_COLOR)
      }
      mesh.instanceColor.needsUpdate = true
      activeHighlightRef.current = activeNodeIndex
    }

    edges.forEach(([start, end], index) => {
      const offset = index * 6
      const startOffset = start * 3
      const endOffset = end * 3

      linePositions[offset] = positions[startOffset]
      linePositions[offset + 1] = positions[startOffset + 1]
      linePositions[offset + 2] = positions[startOffset + 2]
      linePositions[offset + 3] = positions[endOffset]
      linePositions[offset + 4] = positions[endOffset + 1]
      linePositions[offset + 5] = positions[endOffset + 2]
    })

    const lines = linesRef.current
    if (lines) lines.geometry.attributes.position.needsUpdate = true
    if (lineMaterialRef.current) {
      lineMaterialRef.current.opacity = 0.16 + organized * 0.12
    }
  })

  return (
    <>
      <instancedMesh
        ref={instancesRef}
        args={[undefined, undefined, nodes.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial
          color="#FFFFFF"
          emissive="#5D8FE5"
          emissiveIntensity={0.35}
          roughness={0.38}
        />
      </instancedMesh>
      <lineSegments ref={linesRef} geometry={lineGeometry} frustumCulled={false}>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color="#A8C6F0"
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </lineSegments>
    </>
  )
}
