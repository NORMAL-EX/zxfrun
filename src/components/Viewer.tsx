import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { makeIceCream, makeSpriteCan } from '../three/collectibles'

type Kind = 'ice' | 'sprite'

// A standalone studio viewer for the collectible models. Drag to orbit,
// scroll to zoom. Open at <site>/?viewer to inspect from any angle.
export function Viewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [kind, setKind] = useState<Kind>('ice')
  const [autoRotate, setAutoRotate] = useState(true)
  const apiRef = useRef<{
    setKind: (k: Kind) => void
    setYaw: (rad: number) => void
    setAuto: (b: boolean) => void
  } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x33363d)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(1.8, 1.3, 2.8)

    // studio lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404044, 0.95))
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(3, 5, 4)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 20
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xafc6ff, 0.5)
    fill.position.set(-4, 2, -2)
    scene.add(fill)
    const rim = new THREE.DirectionalLight(0xffffff, 0.6)
    rim.position.set(-1, 3, -4)
    scene.add(rim)

    // ground for a contact shadow
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(6, 48),
      new THREE.MeshStandardMaterial({ color: 0x2a2c31, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1.5
    ground.receiveShadow = true
    scene.add(ground)

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.2
    controls.maxDistance = 8

    let model: THREE.Object3D | null = null
    const holder = new THREE.Group()
    scene.add(holder)

    const setModel = (k: Kind) => {
      if (model) holder.remove(model)
      model = k === 'ice' ? makeIceCream() : makeSpriteCan()
      model.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) o.castShadow = true
      })
      // center the model and frame the camera/controls on it
      const box = new THREE.Box3().setFromObject(model)
      const center = box.getCenter(new THREE.Vector3())
      model.position.sub(center) // recentre to origin
      holder.add(model)
      // drop it onto the ground
      const size = box.getSize(new THREE.Vector3())
      ground.position.y = -size.y / 2 - 0.05
      controls.target.set(0, 0, 0)
      controls.update()
    }
    setModel(kind)

    let raf = 0
    const loop = () => {
      if (autoRotateRef.current) holder.rotation.y += 0.012
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    const autoRotateRef = { current: autoRotate }

    const resize = () => {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    resize()
    raf = requestAnimationFrame(loop)

    apiRef.current = {
      setKind: (k) => setModel(k),
      setYaw: (rad) => {
        holder.rotation.y = rad
      },
      setAuto: (b) => {
        autoRotateRef.current = b
      },
    }
    ;(window as unknown as { __viewer?: typeof apiRef.current }).__viewer = apiRef.current

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // react to UI toggles
  useEffect(() => {
    apiRef.current?.setKind(kind)
  }, [kind])
  useEffect(() => {
    apiRef.current?.setAuto(autoRotate)
  }, [autoRotate])

  return (
    <div className="viewer">
      <canvas ref={canvasRef} className="viewer-canvas" />
      <div className="viewer-ui">
        <button className={`pill ${kind === 'ice' ? 'on' : ''}`} onClick={() => setKind('ice')}>
          巧乐兹
        </button>
        <button className={`pill ${kind === 'sprite' ? 'on' : ''}`} onClick={() => setKind('sprite')}>
          雪碧
        </button>
        <button className="pill" onClick={() => setAutoRotate((a) => !a)}>
          {autoRotate ? '停止旋转' : '自动旋转'}
        </button>
      </div>
      <div className="viewer-hint">拖动旋转 · 滚轮缩放</div>
    </div>
  )
}
