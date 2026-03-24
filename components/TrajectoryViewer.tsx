"use client"
import { useRef, useMemo, useEffect, useCallback } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { OrbitControls, Grid, Line } from "@react-three/drei"
import * as THREE from "three"
import { TelemetryFrame } from "@/lib/types"
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib"

interface TrajectoryViewerProps {
  frames: TelemetryFrame[]
  currentIndex: number
  onResetCamera?: () => void
}

const SCALE = 0.008  // 1 unit = 125m — keeps typical trajectories in a nice viewport

function fitCameraToTrajectory(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControlsImpl,
  points: THREE.Vector3[]
) {
  if (points.length === 0) return
  const box = new THREE.Box3().setFromPoints(points)
  const center = new THREE.Vector3()
  box.getCenter(center)
  const size = new THREE.Vector3()
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z, 2)
  const dist = maxDim * 1.8
  camera.position.set(center.x + dist * 0.6, center.y + dist * 0.5, center.z + dist * 0.6)
  controls.target.copy(center)
  controls.update()
}

function Scene({ frames, currentIndex, fitSignal }: {
  frames: TelemetryFrame[]
  currentIndex: number
  fitSignal: number
}) {
  const { camera, gl } = useThree()
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches

  const allPoints = useMemo(() =>
    frames.map(f => new THREE.Vector3(f.x * SCALE, f.z * SCALE, -f.y * SCALE)),
    [frames]
  )

  const trailPoints = useMemo(() => allPoints.slice(0, currentIndex + 1), [allPoints, currentIndex])
  const futurePoints = useMemo(() => allPoints.slice(currentIndex), [allPoints, currentIndex])
  const currentFrame = frames[currentIndex]

  // Auto-fit when all frames first arrive (allPoints changes from 0 to full)
  useEffect(() => {
    if (allPoints.length > 1 && controlsRef.current) {
      fitCameraToTrajectory(camera as THREE.PerspectiveCamera, controlsRef.current, allPoints)
    }
  }, [allPoints.length > 0 ? allPoints.length : 0])

  // Manual fit trigger
  useEffect(() => {
    if (fitSignal > 0 && allPoints.length > 1 && controlsRef.current) {
      fitCameraToTrajectory(camera as THREE.PerspectiveCamera, controlsRef.current, allPoints)
    }
  }, [fitSignal])

  const gridColor = isDark ? "#1e293b" : "#e2e8f0"
  const sectionColor = isDark ? "#334155" : "#cbd5e1"
  const trailColor = isDark ? "#6366f1" : "#4f46e5"
  const futureColor = isDark ? "#334155" : "#cbd5e1"

  return (
    <>
      <ambientLight intensity={isDark ? 0.4 : 0.6} />
      <directionalLight position={[10, 20, 10]} intensity={isDark ? 0.6 : 0.9} />

      <Grid
        args={[200, 200]}
        cellSize={5} cellThickness={0.3} cellColor={gridColor}
        sectionSize={25} sectionThickness={0.5} sectionColor={sectionColor}
        fadeDistance={300} fadeStrength={1} infiniteGrid
      />

      {futurePoints.length > 1 && (
        <Line points={futurePoints} color={futureColor} lineWidth={1} />
      )}
      {trailPoints.length > 1 && (
        <Line points={trailPoints} color={trailColor} lineWidth={2.5} />
      )}

      {/* Missile marker */}
      {currentFrame && (
        <mesh position={[currentFrame.x * SCALE, currentFrame.z * SCALE, -currentFrame.y * SCALE]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={isDark ? "#818cf8" : "#4f46e5"} />
        </mesh>
      )}

      {/* Launch point */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#16a34a" />
      </mesh>

      {/* Impact point */}
      {frames.length > 1 && (() => {
        const last = frames[frames.length - 1]
        return (
          <mesh position={[last.x * SCALE, 0, -last.y * SCALE]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        )
      })()}

      <OrbitControls
        ref={controlsRef}
        enablePan enableZoom enableRotate
        minDistance={1} maxDistance={500}
        makeDefault
      />
    </>
  )
}

export default function TrajectoryViewer({ frames, currentIndex }: TrajectoryViewerProps) {
  const fitSignalRef = useRef(0)
  const canvasKey = useRef(0)

  // Determine bg based on color scheme
  const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  const bg = isDark ? "#09090b" : "#f8fafc"

  return (
    <div className="relative w-full h-full rounded-md overflow-hidden border border-border bg-secondary">
      <Canvas
        camera={{ position: [20, 15, 20], fov: 50 }}
        gl={{ antialias: true }}
        style={{ background: bg }}
      >
        <Scene frames={frames} currentIndex={currentIndex} fitSignal={fitSignalRef.current} />
      </Canvas>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1.5 border border-border">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-600 flex-shrink-0" />
          Launch
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-600 flex-shrink-0" />
          Impact
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />
          Current
        </span>
      </div>

      {/* Instructions */}
      {frames.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Configure parameters and click Launch</p>
        </div>
      )}

      {/* Drag hint */}
      {frames.length > 0 && (
        <div className="absolute top-3 right-3 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded px-2 py-1 border border-border">
          Drag to rotate · Scroll to zoom · Right-drag to pan
        </div>
      )}
    </div>
  )
}