import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export type SceneController = {
  setLight: (progress: number) => void;
  setOrbit: (enabled: boolean) => void;
  setNeighbors: (visible: boolean) => void;
  focus: (view: "district" | "house") => void;
  zoom: (factor: number) => void;
  rotate: (angle: number) => void;
  dispose: () => void;
};

// A deliberately illustrative diorama, not cadastral or surveyed geometry.
export function createWorld(host: HTMLElement, onContextLost: () => void): SceneController {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, 0.5, 700);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 24;
  controls.maxDistance = 230;
  controls.minPolarAngle = 0.18;
  controls.maxPolarAngle = Math.PI / 2 - 0.07;
  controls.autoRotateSpeed = 0.35;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  controls.enableDamping = !reducedMotion.matches;

  const materials = new Set<THREE.Material>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  function material(color: string, roughness = 0.9) {
    const value = new THREE.MeshStandardMaterial({ color, roughness });
    materials.add(value);
    return value;
  }
  const cream = material("#e6d9be"), stone = material("#b9ad96"), roof = material("#966d57");
  const heroRoof = material("#76534b"), trim = material("#eee5cf"), wood = material("#836f56");
  const grass = material("#8c9b70"), hedge = material("#526e4e"), road = material("#8d8c83");
  const pavement = material("#cdc6b4"), dark = material("#414d43"), soil = material("#c0ad90");
  const leaves = [material("#68865c"), material("#7d915f"), material("#9b9c64"), material("#ad9362")];
  const glass = material("#54747c", 0.3);
  glass.emissive.set("#ffba68");
  const lampMat = material("#fff1cf");
  lampMat.emissive.set("#ffc66e");
  const cube = new THREE.BoxGeometry(1, 1, 1);
  const foliage = new THREE.IcosahedronGeometry(1, 1);
  geometries.add(cube); geometries.add(foliage);
  function box(parent: THREE.Object3D, x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material) {
    const mesh = new THREE.Mesh(cube, mat);
    mesh.position.set(x, y, z); mesh.scale.set(w, h, d);
    mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
    return mesh;
  }
  const neighborhood = new THREE.Group();
  scene.add(neighborhood);
  box(scene, 0, -2, 0, 132, 4, 100, soil);
  box(scene, 0, 0.05, 0, 132, 0.3, 100, grass);
  box(scene, 0, 0.26, 25, 132, 0.12, 13, pavement);
  box(scene, 0, 0.35, 25, 132, 0.08, 9, road);
  box(scene, -43, 0.27, 0, 11, 0.12, 100, pavement);
  box(scene, -43, 0.36, 0, 7, 0.08, 100, road);
  for (let x = -63; x < 66; x += 8) if (Math.abs(x + 43) > 7) box(scene, x, 0.41, 25, 3, 0.025, 0.15, trim);
  for (let z = -47; z < 50; z += 9) if (Math.abs(z - 25) > 8) box(scene, -43, 0.42, z, 0.15, 0.025, 3, trim);

  function tree(parent: THREE.Object3D, x: number, z: number, height: number, seed: number) {
    box(parent, x, height / 2, z, 0.65, height, 0.65, wood);
    const crown = new THREE.Mesh(foliage, leaves[seed % leaves.length]);
    crown.position.set(x, height, z); crown.scale.set(height * 0.48, height * 0.65, height * 0.46);
    crown.rotation.y = seed; crown.castShadow = true; crown.receiveShadow = true; parent.add(crown);
  }
  function house(parent: THREE.Object3D, x: number, z: number, w: number, d: number, h: number, hero = false, rotation = 0) {
    const group = new THREE.Group(); group.position.set(x, 0.25, z); group.rotation.y = rotation; parent.add(group);
    box(group, 0, 0.2, 0, w + 0.7, 0.4, d + 0.7, stone);
    box(group, 0, h / 2 + 0.4, 0, w, h, d, hero ? cream : stone);
    box(group, 0, 1, 0, w + 0.08, 1.2, d + 0.08, hero ? stone : cream);
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - 0.7, 0); shape.lineTo(0, 3.6); shape.lineTo(w / 2 + 0.7, 0); shape.closePath();
    const roofGeometry = new THREE.ExtrudeGeometry(shape, { depth: d + 1.4, bevelEnabled: false });
    geometries.add(roofGeometry);
    const top = new THREE.Mesh(roofGeometry, hero ? heroRoof : roof);
    top.position.set(0, h + 0.4, -d / 2 - 0.7); top.castShadow = true; top.receiveShadow = true; group.add(top);
    box(group, w / 4, h + 2.8, -d / 4, 1.1, 3, 1.1, stone);
    box(group, w / 4, h + 4.3, -d / 4, 1.35, 0.25, 1.35, dark);
    for (const side of [-1, 1]) {
      for (const wx of [-w * 0.29, w * 0.29]) {
        for (const wy of [2.4, h - 1.4]) {
          box(group, wx, wy, side * (d / 2 + 0.06), 2.1, 1.85, 0.15, trim);
          box(group, wx, wy, side * (d / 2 + 0.15), 1.7, 1.5, 0.05, glass);
          box(group, wx, wy, side * (d / 2 + 0.2), 0.09, 1.5, 0.05, trim);
          if (hero) for (const shift of [-1.25, 1.25]) box(group, wx + shift, wy, side * (d / 2 + 0.15), 0.5, 1.8, 0.13, dark);
        }
      }
      box(group, side * (w / 2 + 0.05), h - 1.4, 0, 0.12, 1.8, 2, trim);
      box(group, side * (w / 2 + 0.13), h - 1.4, 0, 0.05, 1.5, 1.65, glass);
    }
    box(group, 0, 1.8, d / 2 + 0.12, 1.5, 2.8, 0.2, dark);
    box(group, 0, 0.15, d / 2 + 1.1, 3, 0.3, 2, pavement);
    if (hero) {
      box(group, -w / 2 - 2.5, 1.8, 0.8, 5, 3.6, d - 1, cream);
      box(group, -w / 2 - 2.5, 3.75, 0.8, 5.5, 0.35, d - 0.5, heroRoof);
      box(group, -w / 2 - 2.5, 1.55, d / 2 + 0.35, 3.8, 2.6, 0.1, dark);
      for (let i = 0; i < 7; i++) box(group, -w / 2 - 2.5, 0.5 + i * 0.35, d / 2 + 0.42, 3.65, 0.04, 0.04, stone);
    }
    return group;
  }

  // The featured house has a pale facade, two levels, a pitched roof and a garage.
  house(scene, 4, 3, 13, 11, 7, true);
  box(scene, 4, 0.29, 15, 2.5, 0.08, 10, pavement);
  box(scene, -5, 0.3, 13, 5, 0.08, 14, pavement);
  box(scene, 9, 0.3, -7, 12, 0.12, 6, wood);
  box(scene, 9, 1.5, -7, 3, 0.2, 1.8, trim);
  for (const x of [7, 11]) box(scene, x, 0.8, -7, 0.8, 1.4, 1, wood);
  for (const x of [-12, 20]) box(scene, x, 1, 0, 0.8, 1.6, 39, hedge);
  box(scene, 4, 1, -19, 33, 1.6, 0.8, hedge);
  for (const x of [-10, 16]) box(scene, x, 0.9, 19, 8, 1.4, 0.6, stone);
  tree(scene, 15, -12, 7, 1); tree(scene, -7, -13, 6, 0); tree(scene, 17, 13, 4.8, 2);
  for (let i = 0; i < 7; i++) {
    const flower = new THREE.Mesh(foliage, i % 2 ? roof : trim);
    flower.position.set(10 + i * 0.8, 0.8, 15); flower.scale.setScalar(0.45); scene.add(flower);
  }

  const plots = [[-26, 3], [35, 2], [55, 3], [-25, -29], [3, -34], [30, -31], [55, -31], [-58, -30], [-58, 1], [-58, 40], [-23, 40], [3, 40], [31, 40], [55, 40]];
  plots.forEach(([x, z], i) => {
    const back = z > 30;
    house(neighborhood, x, z, 9 + i % 3, 8 + i % 2, i % 4 === 0 ? 4.5 : 6.2, false, back ? Math.PI : 0);
    box(neighborhood, x + 9, 0.9, z, 0.8, 1.4, 20, hedge);
    tree(neighborhood, x - 7, z - 7, 4.5 + i % 3, i);
    if (i % 2 === 0) tree(neighborhood, x + 5, z - 9, 4, i + 1);
  });
  for (let i = 0; i < 13; i++) tree(neighborhood, -62 + i * 10, -46, 5 + (i % 4), i);

  function car(x: number, z: number, color: string) {
    const paint = material(color, 0.4);
    box(neighborhood, x, 0.9, z, 4.3, 1, 2, paint);
    box(neighborhood, x - 0.3, 1.7, z, 2.3, 0.9, 1.8, paint);
    box(neighborhood, x - 0.3, 1.8, z + 0.92, 1.9, 0.55, 0.03, glass);
    for (const dx of [-1.3, 1.3]) for (const dz of [-1, 1]) box(neighborhood, x + dx, 0.65, z + dz, 0.7, 0.7, 0.2, dark);
  }
  car(28, 23, "#c5b99e"); car(-23, 27, "#6f8286"); car(55, 28, "#b97a5f");
  const lamps: THREE.PointLight[] = [];
  for (const x of [-31, 19, 50]) {
    box(scene, x, 3, 18, 0.15, 6, 0.15, dark);
    box(scene, x + 0.6, 6, 18, 1.4, 0.15, 0.2, dark);
    box(scene, x + 1.1, 5.9, 18, 0.7, 0.1, 0.5, lampMat);
    const lamp = new THREE.PointLight("#ffcb83", 0, 16, 2);
    lamp.position.set(x + 1, 5.7, 18); scene.add(lamp); lamps.push(lamp);
  }

  function label(text: string, x: number, y: number, z: number, width: number) {
    const canvas = document.createElement("canvas"); canvas.width = 768; canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#faf4e8"; ctx.beginPath(); ctx.roundRect(4, 4, 760, 120, 60); ctx.fill();
    ctx.font = "500 42px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#514638"; ctx.fillText(text, 384, 67);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; textures.add(texture);
    const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false, toneMapped: false, sizeAttenuation: false }); materials.add(mat);
    const sprite = new THREE.Sprite(mat); sprite.position.set(x, y, z); sprite.scale.set(width / 150, width / 900, 1); sprite.renderOrder = 5; scene.add(sprite);
  }
  label("04   ·   MAISON 1973", 4, 15, 3, 21);
  const pinGeometry = new THREE.CylinderGeometry(0.06, 0.06, 2.5, 6); geometries.add(pinGeometry);
  const pin = new THREE.Mesh(pinGeometry, trim); pin.position.set(4, 12, 3); scene.add(pin);

  const ambient = new THREE.HemisphereLight("#ffe9cf", "#777d63", 2);
  const sun = new THREE.DirectionalLight("#ffdfb2", 3);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -100, right: 100, top: 100, bottom: -100, near: 1, far: 250 });
  sun.shadow.normalBias = 0.12; sun.shadow.bias = -0.0002;
  const moon = new THREE.DirectionalLight("#829fee", 0); moon.position.set(30, 60, 20);
  scene.add(ambient, sun, moon);
  const starPositions = new Float32Array(180 * 3);
  for (let i = 0; i < 180; i++) {
    const angle = i * 2.39996;
    starPositions[i * 3] = Math.cos(angle) * (150 + i % 70);
    starPositions[i * 3 + 1] = 50 + ((i * 37) % 130);
    starPositions[i * 3 + 2] = Math.sin(angle) * (150 + i % 70);
  }
  const starGeometry = new THREE.BufferGeometry(); starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3)); geometries.add(starGeometry);
  const starMaterial = new THREE.PointsMaterial({ color: "#ffefdc", size: 0.65, transparent: true, opacity: 0, depthWrite: false }); materials.add(starMaterial);
  scene.add(new THREE.Points(starGeometry, starMaterial));
  const white = new THREE.Color("#fff1d5"), orange = new THREE.Color("#ff8c45");
  const dayAmbient = new THREE.Color("#ffdfc2"), nightAmbient = new THREE.Color("#a5b6ec");
  const dayGlass = new THREE.Color("#54747c"), nightGlass = new THREE.Color("#e3b16b");

  function setLight(t: number) {
    const night = THREE.MathUtils.smoothstep(t, 0.62, 0.95);
    const elevation = THREE.MathUtils.lerp(1.05, -0.18, t);
    sun.position.set(-80 * Math.cos(elevation), 100 * Math.sin(elevation), -30 + 50 * t);
    sun.color.copy(white).lerp(orange, Math.min(1, t * 1.6));
    sun.intensity = 3.2 * (1 - night);
    ambient.intensity = THREE.MathUtils.lerp(1.9, 0.32, night);
    ambient.color.copy(dayAmbient).lerp(nightAmbient, night);
    moon.intensity = night * 1.4;
    glass.emissiveIntensity = night * 2.8;
    glass.color.copy(dayGlass).lerp(nightGlass, night);
    lampMat.emissiveIntensity = night * 3;
    lamps.forEach((lamp) => { lamp.intensity = night * 65; });
    starMaterial.opacity = night * 0.8;
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.2, 0.9, night);
  }

  let currentView: "district" | "house" = "district";
  function focus(view: "district" | "house") {
    currentView = view;
    const narrow = host.clientWidth < 700;
    controls.target.set(view === "house" ? 4 : 0, 0, view === "house" ? 3 : 0);
    camera.position.set(...(view === "house" ? (narrow ? [70, 52, 85] : [40, 30, 50]) : narrow ? [210, 170, 240] : [120, 100, 140]) as [number, number, number]);
    controls.maxDistance = narrow ? 420 : 230;
    controls.update();
  }
  let previousNarrow = host.clientWidth < 700;
  const resize = () => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
    const narrow = width < 700;
    if (narrow !== previousNarrow) { previousNarrow = narrow; focus(currentView); }
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize(); focus("district"); setLight(0.38);
  let frame = 0, lastTime = 0, lost = false;
  function render(time: number) {
    frame = requestAnimationFrame(render);
    if (document.hidden || lost || time - lastTime < 32) return;
    const delta = Math.min((time - lastTime) / 1000, 0.1); lastTime = time;
    controls.update(delta); renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; onContextLost(); };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  return {
    setLight,
    setOrbit: (enabled) => { controls.autoRotate = enabled; },
    setNeighbors: (visible) => { neighborhood.visible = visible; },
    focus,
    zoom: (factor) => {
      const offset = camera.position.clone().sub(controls.target);
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset); controls.update();
    },
    rotate: (angle) => {
      const offset = camera.position.clone().sub(controls.target); offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      camera.position.copy(controls.target).add(offset); controls.update();
    },
    dispose: () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((mat) => mat.dispose()); textures.forEach((texture) => texture.dispose());
      sun.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
