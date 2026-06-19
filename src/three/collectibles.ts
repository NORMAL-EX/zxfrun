import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { makeChocoTexture, makeSpriteLabel, mulberry32 } from './textures'

const rbox = (w: number, h: number, d: number, r: number) =>
  new RoundedBoxGeometry(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2))

// 巧乐兹 — a chocolate-coated bar with a chunk bitten out of the top-front.
// Construction: a cream/vanilla core block is clad in chocolate on the back,
// sides, bottom and lower-front; the upper-front is left OPEN (the bite), so
// you look into a recessed cross-section — cream with a chocolate centre and
// almond bits, rimmed by the chocolate coating with a gnawed, scalloped edge.
// No protruding studs: the crunch lives in the coating texture, keeping the
// silhouette clean from every angle.
export function makeIceCream(): THREE.Group {
  const g = new THREE.Group()
  const W = 0.82
  const H = 1.7
  const D = 0.5
  const t = 0.09 // coating thickness
  const fz = D / 2 // front face z
  const biteY = 0.06 // bite cuts the front above this height

  const chocMat = () =>
    new THREE.MeshStandardMaterial({ map: makeChocoTexture(), roughness: 0.34, metalness: 0.05 })
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xfdf1d8,
    roughness: 0.62,
    emissive: 0x4a3a1e,
    emissiveIntensity: 0.18,
  })
  const coreMat = new THREE.MeshStandardMaterial({ color: 0x6f4321, roughness: 0.45 })
  const almondMat = new THREE.MeshStandardMaterial({ color: 0xcea468, roughness: 0.6 })

  // cream / vanilla interior — fills the bar, visible through the bite
  const cream = new THREE.Mesh(rbox(W - t, H - t, D - t, 0.16), creamMat)
  cream.castShadow = true
  g.add(cream)

  // chocolate coating, built from slabs that leave the upper-front exposed
  const addChoc = (gw: number, gh: number, gd: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(rbox(gw, gh, gd, 0.06), chocMat())
    m.position.set(x, y, z)
    m.castShadow = true
    g.add(m)
    return m
  }
  addChoc(W, H, t, 0, 0, -(D - t) / 2) // back
  addChoc(t, H, D, -(W - t) / 2, 0, 0) // left
  addChoc(t, H, D, (W - t) / 2, 0, 0) // right
  addChoc(W, t, D, 0, -(H - t) / 2, 0) // bottom
  addChoc(W, t, D * 0.55, 0, (H - t) / 2, -(D * 0.45) / 2) // top-back (front-top stays open = bitten)
  // lower-front coating: covers the front up to the bite line y:[-H/2 .. biteY]
  const fbH = biteY + (H - t) / 2
  addChoc(W, fbH, t, 0, biteY - fbH / 2, (D - t) / 2)

  // gnawed bite edge: a few rounded chocolate lobes along the bite line
  const rb = mulberry32(7)
  for (let i = 0; i < 5; i++) {
    const lobe = new THREE.Mesh(new THREE.SphereGeometry(0.06 + rb() * 0.04, 10, 8), chocMat())
    lobe.scale.set(1, 0.7, 0.6)
    lobe.position.set((i - 2) * 0.15 + (rb() - 0.5) * 0.05, biteY + (rb() - 0.4) * 0.08, fz - 0.04)
    lobe.castShadow = true
    g.add(lobe)
  }

  // chocolate centre revealed in the cross-section (a brown stripe in the cream)
  const core = new THREE.Mesh(rbox(0.24, H - t - 0.1, 0.22, 0.08), coreMat)
  core.position.set(0, 0.04, (D - t) / 2 - 0.11)
  g.add(core)

  // almond / crispy bits embedded in the cream cut-face
  const nutGeo = new THREE.SphereGeometry(0.035, 8, 6)
  const rn = mulberry32(21)
  for (let i = 0; i < 14; i++) {
    const n = new THREE.Mesh(nutGeo, almondMat)
    n.scale.set(1, 1, 0.5)
    // distribute across the cream cut-face, biased to the cream (off the core)
    const side = rn() < 0.5 ? -1 : 1
    const x = side * (0.16 + rn() * 0.16)
    n.position.set(x, biteY + 0.14 + ((i + rn()) / 14) * (H / 2 - t - 0.26), (D - t) / 2 - 0.01)
    g.add(n)
  }

  // wooden stick
  const stick = new THREE.Mesh(
    rbox(0.16, 0.72, 0.14, 0.06),
    new THREE.MeshStandardMaterial({ color: 0xe6c489, roughness: 0.85 }),
  )
  stick.position.y = -(H / 2) - 0.28
  g.add(stick)
  return g
}

// 雪碧 — tall aluminium green can with silver top + pull-tab; wrapped label
export function makeSpriteCan(): THREE.Group {
  const g = new THREE.Group()
  const green = new THREE.MeshStandardMaterial({ map: makeSpriteLabel(), roughness: 0.26, metalness: 0.55 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.5, 40), green)
  body.castShadow = true
  g.add(body)
  const silver = new THREE.MeshStandardMaterial({ color: 0xccd2d6, roughness: 0.26, metalness: 0.9 })
  const topRim = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.305, 0.12, 36), silver)
  topRim.position.y = 0.78
  g.add(topRim)
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.255, 0.03, 32), silver)
  lid.position.y = 0.85
  g.add(lid)
  const botRim = new THREE.Mesh(new THREE.CylinderGeometry(0.305, 0.27, 0.1, 36), silver)
  botRim.position.y = -0.78
  g.add(botRim)
  const tab = new THREE.Mesh(rbox(0.16, 0.02, 0.1, 0.01), silver)
  tab.position.set(0, 0.87, 0.04)
  g.add(tab)
  return g
}
