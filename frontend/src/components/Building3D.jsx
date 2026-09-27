import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CLIMATE_WALL_COLOR = {
  "cold-arid": 0xc9a876, "cold-temperate": 0xb8a98c, "hot-dry": 0xe0d4b0,
  "hot-humid": 0xb9c4c7, composite: 0xc7b89a,
};
const ROOF_MATERIAL_STYLE = {
  concrete: { color: 0x8a7a63, roughness: 0.85, metalness: 0.05 },
  metal: { color: 0x9aa5ad, roughness: 0.35, metalness: 0.7 },
  thatch: { color: 0x8a6a3a, roughness: 1.0, metalness: 0.0 },
  insulated: { color: 0xd8dde0, roughness: 0.5, metalness: 0.1 },
};
const COLD = { r: 0x3a, g: 0x7c, b: 0xd4 };
const NORMAL = { r: 0xe8, g: 0xc9, b: 0x4a };
const HOT = { r: 0xe0, g: 0x40, b: 0x2e };
const SPEEDS = [1, 2, 4];
const WRONG_ROTATION = Math.PI * 0.62;

let GLOW_TEX = null;
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function safeNum(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function metricsFromArray(arr) {
  const clean = Array.isArray(arr) && arr.length ? arr.filter((v) => Number.isFinite(v)) : [18, 22];
  const min = Math.min(...clean), max = Math.max(...clean);
  return { min, max, swingIn: max - min, retention: 50 };
}

function normalizeData(raw) {
  if (!raw || typeof raw !== "object") return null;
  const geometry = raw.geometry || {};
  const width = safeNum(geometry.width, 6);
  const length = safeNum(geometry.length, 5);
  const floors = Math.max(1, Math.round(safeNum(geometry.floors, 1)));
  const roomHeight = safeNum(geometry.roomHeight, 3);
  const totalHeight = safeNum(geometry.totalHeight, roomHeight * floors);
  const footprint = safeNum(geometry.footprint, width * length);
  const floorArea = safeNum(geometry.floorArea, footprint);
  const wallArea = safeNum(geometry.wallArea, 2 * (width + length) * totalHeight);
  const azimuth = safeNum(geometry.azimuth, 180);

  const defaultParams = (mult) => ({ uWall: 1.2 * mult, uRoof: 1.5 * mult, uWindow: 2.8, windowArea: Math.max(1, footprint * 0.12), ach: 1.2 * mult });
  const dpRaw = raw.designParams || {};
  const fillParams = (p, mult) => {
    const merged = { ...defaultParams(mult), ...(p || {}) };
    return {
      uWall: safeNum(merged.uWall, 1.2 * mult), uRoof: safeNum(merged.uRoof, 1.5 * mult),
      uWindow: safeNum(merged.uWindow, 2.8), windowArea: Math.max(0.5, safeNum(merged.windowArea, footprint * 0.12)),
      ach: safeNum(merged.ach, 1.2 * mult),
    };
  };
  const baseline = fillParams(dpRaw.baseline, 1.6);
  const optimized = fillParams(dpRaw.optimized, 1);

  const hours = Array.isArray(raw.simulation?.hours) && raw.simulation.hours.length === 24 ? raw.simulation.hours : Array.from({ length: 24 }, (_, i) => i);
  const fallbackOutdoor = hours.map((h) => 15 + 8 * Math.sin(((h - 6) / 24) * Math.PI * 2));
  const outdoor = Array.isArray(raw.simulation?.outdoor) && raw.simulation.outdoor.length === 24 ? raw.simulation.outdoor : fallbackOutdoor;
  const baselineIndoor = Array.isArray(raw.simulation?.baselineIndoor) && raw.simulation.baselineIndoor.length === 24 ? raw.simulation.baselineIndoor : outdoor.map((v) => v - 1);
  const optimizedIndoor = Array.isArray(raw.simulation?.optimizedIndoor) && raw.simulation.optimizedIndoor.length === 24 ? raw.simulation.optimizedIndoor : outdoor.map((v) => v + 2);
  const baselineMetrics = raw.simulation?.baselineMetrics || metricsFromArray(baselineIndoor);
  const optimizedMetrics = raw.simulation?.optimizedMetrics || metricsFromArray(optimizedIndoor);

  return {
    ...raw,
    geometry: { ...geometry, width, length, floors, roomHeight, totalHeight, footprint, floorArea, wallArea, azimuth },
    designParams: { baseline, optimized },
    inputs: { desiredTemp: 21, special: {}, roofType: "flat", roofMaterial: "concrete", ventilationType: "natural", wallThicknessMM: 300, ...(raw.inputs || {}) },
    classification: raw.classification || { key: "composite", label: "Composite climate" },
    comparison: { nightTemperatureGain: 0, energySavingPercent: 0, isCold: true, headlineGain: 0, ...(raw.comparison || {}) },
    comfortScore: { overall: 0, insulationScore: 0, ventilationScore: 0, solarScore: 0, suggestions: [], ...(raw.comfortScore || {}) },
    baselineScore: { overall: 0, ...(raw.baselineScore || {}) },
    simulation: { hours, outdoor, baselineIndoor, optimizedIndoor, baselineMetrics, optimizedMetrics },
  };
}

function uaShares(params, geometry) {
  const roofArea = geometry.footprint || geometry.floorArea || 1;
  const volume = (geometry.footprint || geometry.floorArea || 1) * (geometry.totalHeight || geometry.roomHeight || 3);
  const wallUA = params.uWall * geometry.wallArea;
  const roofUA = params.uRoof * roofArea;
  const winUA = params.uWindow * params.windowArea;
  const infUA = 0.33 * params.ach * volume;
  const total = wallUA + roofUA + winUA + infUA || 1;
  return { wall: wallUA / total, roof: roofUA / total, window: winUA / total, total };
}
function tempColor(t) {
  t = Math.max(0, Math.min(1, t));
  const a = t < 0.5 ? COLD : NORMAL;
  const b = t < 0.5 ? NORMAL : HOT;
  const k = t < 0.5 ? t * 2 : (t - 0.5) * 2;
  const r = Math.round(a.r + (b.r - a.r) * k), g = Math.round(a.g + (b.g - a.g) * k), bl = Math.round(a.b + (b.b - a.b) * k);
  return (r << 16) | (g << 8) | bl;
}
function heatColor(share) { return tempColor(Math.max(0, Math.min(1, share / 0.55)) * 0.5 + 0.5); }
function lerpColor(hexA, hexB, t) {
  const a = new THREE.Color(hexA), b = new THREE.Color(hexB);
  return a.lerp(b, t);
}
function timeLabel(h) {
  if (h >= 5 && h < 8) return "Early morning";
  if (h >= 8 && h < 12) return "Morning";
  if (h >= 12 && h < 15) return "Midday";
  if (h >= 15 && h < 18) return "Afternoon";
  if (h >= 18 && h < 21) return "Evening";
  return "Night";
}
function useCountUp(target, decimals = 0) {
  const [val, setVal] = useState(0);
  const raf = useRef(null);
  const from = useRef(0);
  useEffect(() => {
    const start = performance.now();
    const base = from.current;
    const dur = 650;
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = base + (target - base) * eased;
      setVal(v);
      if (t < 1) raf.current = requestAnimationFrame(step);
      else from.current = target;
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line
  }, [target]);
  return Number(val.toFixed(decimals));
}

function makeSide(wrapEl) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d1826);
  scene.fog = new THREE.Fog(0x0d1826, 26, 50);

  const camera = new THREE.PerspectiveCamera(45, wrapEl.clientWidth / Math.max(1, wrapEl.clientHeight), 0.1, 200);
  camera.position.set(13, 10, 15);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(wrapEl.clientWidth, wrapEl.clientHeight);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrapEl.appendChild(renderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xa9c0d6, 0.6);
  scene.add(ambientLight);
  const hemi = new THREE.HemisphereLight(0x9fc7e8, 0x1a2436, 0.4);
  scene.add(hemi);
  const fillLight = new THREE.DirectionalLight(0x9fc7e8, 0.28);
  fillLight.position.set(-10, 6, -8);
  scene.add(fillLight);
  const sunLight = new THREE.DirectionalLight(0xffe3b0, 1.15);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.bias = -0.0015;
  sunLight.shadow.camera.left = -20; sunLight.shadow.camera.right = 20;
  sunLight.shadow.camera.top = 20; sunLight.shadow.camera.bottom = -20;
  scene.add(sunLight, sunLight.target);

  const sunMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffdca0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sunMesh.scale.set(3, 3, 1);
  scene.add(sunMesh);

  const ground = new THREE.Mesh(new THREE.CircleGeometry(28, 40), new THREE.MeshStandardMaterial({ color: 0x16233a, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  const buildingGroup = new THREE.Group();
  scene.add(buildingGroup);

  const interiorGlow = new THREE.PointLight(0xffb35a, 0, 6, 2);
  buildingGroup.add(interiorGlow);
  const interiorSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffb35a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  interiorSprite.scale.set(2.4, 2.4, 1);
  buildingGroup.add(interiorSprite);

  const heatLossGroup = new THREE.Group();
  const airflowGroup = new THREE.Group();
  const solarRayGroup = new THREE.Group();
  const sectionGroup = new THREE.Group();
  const weatherGroup = new THREE.Group();
  sectionGroup.visible = false;
  buildingGroup.add(heatLossGroup, airflowGroup, solarRayGroup);
  scene.add(sectionGroup, weatherGroup);

  return {
    wrapEl, scene, camera, renderer, ambientLight, sunLight, sunMesh, ground,
    buildingGroup, interiorGlow, interiorSprite, heatLossGroup, airflowGroup, solarRayGroup, sectionGroup, weatherGroup,
    hoverable: [], dims: {}, ventAnchors: [], windowAnchors: [],
  };
}

function disposeGroup(group) {
  while (group.children.length) {
    const c = group.children.pop();
    if (c.children?.length) disposeGroup(c);
    c.geometry?.dispose?.();
    c.material?.dispose?.();
  }
}

export default function Building3D({ data: rawData, view }) {
  const data = useMemo(() => normalizeData(rawData), [rawData]);
  const containerRef = useRef(null);
  const wrapLRef = useRef(null);
  const wrapRRef = useRef(null);
  const overlayRef = useRef(null);
  const sidesRef = useRef({ L: null, R: null });
  const controlsRef = useRef(null);
  const frameRef = useRef(null);
  const transitionRef = useRef({ L: null, R: null });
  const clockRef = useRef({ start: performance.now() });
  const sunDirRef = useRef(new THREE.Vector3(0, 1, 0));

  const [ready, setReady] = useState(false);
  const [hour, setHour] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSection, setShowSection] = useState(false);
  const [hoverLabel, setHoverLabel] = useState({ L: null, R: null });
  const [insightIdx, setInsightIdx] = useState(0);
  const [sceneError, setSceneError] = useState(false);

  useEffect(() => {
    if (!data) return;
    try {
    const wrapL = wrapLRef.current, wrapR = wrapRRef.current, overlay = overlayRef.current;
    GLOW_TEX = GLOW_TEX || glowTexture();

    const L = makeSide(wrapL);
    const R = makeSide(wrapR);
    sidesRef.current = { L, R };

    const controls = new OrbitControls(L.camera, overlay);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6; controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI * 0.49;
    controlsRef.current = controls;

    function onResize() {
      [L, R].forEach((s) => {
        if (!s.wrapEl) return;
        s.camera.aspect = s.wrapEl.clientWidth / Math.max(1, s.wrapEl.clientHeight);
        s.camera.updateProjectionMatrix();
        s.renderer.setSize(s.wrapEl.clientWidth, s.wrapEl.clientHeight);
      });
    }
    window.addEventListener("resize", onResize);
    onResize();

    function pickSide(clientX, clientY) {
      const rect = containerRef.current.getBoundingClientRect();
      const half = rect.width / 2;
      const isLeft = clientX - rect.left < half;
      const side = isLeft ? "L" : "R";
      const s = sidesRef.current[side];
      const subLeft = isLeft ? rect.left : rect.left + half;
      const x = ((clientX - subLeft) / half) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;
      return { side, s, x, y };
    }

    const raycaster = new THREE.Raycaster();
    function onPointerMove(e) {
      const { side, s, x, y } = pickSide(e.clientX, e.clientY);
      raycaster.setFromCamera({ x, y }, s.camera);
      const hits = raycaster.intersectObjects(s.hoverable, false);
      if (hits.length && hits[0].object.userData.label) {
        setHoverLabel((prev) => ({ ...prev, [side]: hits[0].object.userData.label }));
        overlay.style.cursor = "pointer";
      } else {
        setHoverLabel((prev) => ({ ...prev, [side]: null }));
        overlay.style.cursor = "grab";
      }
    }
    overlay.addEventListener("pointermove", onPointerMove);

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      try {
        controls.update();
        R.camera.position.copy(L.camera.position);
        R.camera.quaternion.copy(L.camera.quaternion);
        R.camera.zoom = L.camera.zoom;
        R.camera.updateProjectionMatrix();

        const elapsed = (performance.now() - clockRef.current.start) / 1000;
        ["L", "R"].forEach((side) => {
          const s = sidesRef.current[side];
          if (!s) return;
          const tr = transitionRef.current[side];
          if (tr) {
            const t = Math.min(1, (performance.now() - tr.start) / 300);
            tr.entries.forEach(({ mesh, from, to }) => mesh.material?.color?.copy(lerpColor(from, to, t)));
            if (t >= 1) transitionRef.current[side] = null;
          }
          s.heatLossGroup.children.forEach((p) => {
            const ud = p.userData;
            if (!ud || !ud.from || !ud.dir) return;
            ud.t += 0.012 * (ud.speed || 1);
            if (ud.t > 1) ud.t = 0;
            p.position.copy(ud.from).addScaledVector(ud.dir, ud.t * ud.dist);
            p.material.opacity = ud.baseOpacity * (1 - ud.t);
          });
          s.airflowGroup.children.forEach((p) => {
            const ud = p.userData;
            if (!ud || !ud.from || !ud.to) return;
            ud.t = (ud.t + 0.008 * (ud.speed || 1)) % 1;
            p.position.lerpVectors(ud.from, ud.to, ud.t);
            p.position.y += Math.sin(ud.t * Math.PI) * (ud.arc || 0);
            p.material.opacity = 0.85 * Math.sin(Math.max(0.001, ud.t) * Math.PI);
          });
          s.solarRayGroup.children.forEach((p) => {
            const ud = p.userData;
            if (!ud || !ud.from || !ud.to) return;
            ud.t = (ud.t + 0.01 * (ud.speed || 1)) % 1;
            p.position.lerpVectors(ud.from, ud.to, ud.t);
            p.material.opacity = ud.baseOpacity * Math.sin(Math.max(0.001, ud.t) * Math.PI);
          });
          s.weatherGroup.children.forEach((p) => {
            const ud = p.userData;
            if (ud.kind === "snow") {
              p.position.y -= 0.012 * ud.speed;
              p.position.x += Math.sin(elapsed * 0.6 + ud.seed) * 0.004;
              if (p.position.y < -0.1) p.position.y = 9 + Math.random();
            } else if (ud.kind === "wind") {
              p.position.x += 0.04 * ud.speed;
              p.material.opacity = 0.35 * Math.sin((elapsed + ud.t) * 2 % Math.PI);
              if (p.position.x > 9) p.position.x = -9 - Math.random() * 4;
            } else if (ud.kind === "heatwave") {
              ud.t += 0.006 * ud.speed;
              if (ud.t > 1) ud.t = 0;
              p.position.y = ud.baseY + ud.t * 2.2;
              p.position.x += Math.sin(elapsed * 1.4 + ud.seed) * 0.003;
              p.material.opacity = 0.18 * (1 - ud.t);
            }
          });
        });

        L.renderer.render(L.scene, L.camera);
        R.renderer.render(R.scene, R.camera);
      } catch (err) {
        console.error("Building3D animate frame error:", err);
      }
    }
    animate();
    setReady(true);

    return () => {
      window.removeEventListener("resize", onResize);
      overlay.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      [L, R].forEach((s) => {
        disposeGroup(s.scene);
        s.renderer.dispose();
        if (s.wrapEl && s.renderer.domElement.parentNode === s.wrapEl) s.wrapEl.removeChild(s.renderer.domElement);
      });
      setReady(false);
    };
    } catch (err) {
      console.error("Building3D scene setup error:", err);
      setSceneError(true);
      return () => {};
    }
    // eslint-disable-next-line
  }, [data]);

  useEffect(() => {
    if (!ready || !data) return;
    rebuildSide("L", "baseline");
    rebuildSide("R", "optimized");
    buildWeather("L");
    buildWeather("R");
    updateSun(hour);
    recolor();
    // eslint-disable-next-line
  }, [ready, data]);

  useEffect(() => {
    if (!ready || !data) return;
    recolor();
    // eslint-disable-next-line
  }, [view]);

  useEffect(() => {
    if (!ready || !data) return;
    updateSun(hour);
    recolor();
    // eslint-disable-next-line
  }, [hour]);

  useEffect(() => {
    const s = sidesRef.current;
    if (!s.L || !s.R) return;
    s.L.sectionGroup.visible = showSection;
    s.R.sectionGroup.visible = showSection;
  }, [showSection]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setHour((h) => (h + 1) % 24), 480 / speed);
    return () => clearTimeout(t);
  }, [playing, hour, speed]);

  const uaTotals = useMemo(() => {
    if (!data) return { baseline: 1, optimized: 1 };
    return {
      baseline: uaShares(data.designParams.baseline, data.geometry).total,
      optimized: uaShares(data.designParams.optimized, data.geometry).total,
    };
  }, [data]);

  function addWallFace(side, opts) {
    const s = sidesRef.current[side];
    const { w, h, thickness, normal, pos, color, label } = opts;
    const geo = normal === "z" ? new THREE.BoxGeometry(w, h, thickness) : new THREE.BoxGeometry(thickness, h, w);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.82, emissive: 0x000000, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.label = label;
    mesh.userData.face = normal === "z" ? (pos.z > 0 ? "S" : "N") : (pos.x > 0 ? "E" : "W");
    mesh.userData.part = "wall";
    s.buildingGroup.add(mesh);
    s.hoverable.push(mesh);
    return mesh;
  }

  function rebuildSide(side, mode) {
    const s = sidesRef.current[side];
    if (!s || !data) return;
    try {
    disposeGroup(s.heatLossGroup);
    disposeGroup(s.airflowGroup);
    disposeGroup(s.solarRayGroup);
    disposeGroup(s.sectionGroup);
    while (s.buildingGroup.children.length) {
      const c = s.buildingGroup.children.pop();
      if (c === s.interiorGlow || c === s.interiorSprite) continue;
      if (c.children?.length) disposeGroup(c);
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    }
    s.buildingGroup.add(s.heatLossGroup, s.airflowGroup, s.solarRayGroup, s.interiorGlow, s.interiorSprite);
    s.hoverable = [];

    const { classification, geometry, inputs } = data;
    const designParams = data.designParams[mode];
    const width = geometry.width, length = geometry.length;
    const totalHeight = geometry.totalHeight, floors = geometry.floors, floorH = geometry.roomHeight;
    const shares = uaShares(designParams, geometry);
    const isBaseline = mode === "baseline";

    const wallColor = view === "thermal" ? heatColor(shares.wall) : CLIMATE_WALL_COLOR[classification.key];
    const roofColorBase = isBaseline ? ROOF_MATERIAL_STYLE.concrete.color : (ROOF_MATERIAL_STYLE[inputs.roofMaterial]?.color ?? 0x8a7a63);
    const roofColor = view === "thermal" ? heatColor(shares.roof) : roofColorBase;
    const windowColor = view === "thermal" ? heatColor(shares.window) : 0x9fd6ee;
    const roofStyle = isBaseline ? ROOF_MATERIAL_STYLE.concrete : (ROOF_MATERIAL_STYLE[inputs.roofMaterial] || ROOF_MATERIAL_STYLE.concrete);
    const wallT = isBaseline ? 0.12 : Math.max(0.18, Math.min(0.5, (inputs.wallThicknessMM || 300) / 1000));

    addWallFace(side, { w: width, h: totalHeight, thickness: wallT, normal: "z", pos: new THREE.Vector3(0, totalHeight / 2, length / 2 - wallT / 2), color: wallColor, label: `South wall — U ${designParams.uWall.toFixed(2)} W/m²K` });
    addWallFace(side, { w: width, h: totalHeight, thickness: wallT, normal: "z", pos: new THREE.Vector3(0, totalHeight / 2, -length / 2 + wallT / 2), color: wallColor, label: `North wall — U ${designParams.uWall.toFixed(2)} W/m²K` });
    addWallFace(side, { w: length, h: totalHeight, thickness: wallT, normal: "x", pos: new THREE.Vector3(width / 2 - wallT / 2, totalHeight / 2, 0), color: wallColor, label: `East wall — U ${designParams.uWall.toFixed(2)} W/m²K` });
    addWallFace(side, { w: length, h: totalHeight, thickness: wallT, normal: "x", pos: new THREE.Vector3(-width / 2 + wallT / 2, totalHeight / 2, 0), color: wallColor, label: `West wall — U ${designParams.uWall.toFixed(2)} W/m²K` });

    const floorSlab = new THREE.Mesh(new THREE.BoxGeometry(width * 1.02, 0.12, length * 1.02), new THREE.MeshStandardMaterial({ color: 0x2a3a4e, roughness: 0.9 }));
    floorSlab.position.y = -0.02;
    floorSlab.receiveShadow = true;
    s.buildingGroup.add(floorSlab);

    for (let f = 1; f < floors; f++) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width * 1.01, 0.06, length * 1.01), new THREE.MeshStandardMaterial({ color: 0x3a4a5e, roughness: 0.9 }));
      slab.position.y = f * floorH;
      slab.receiveShadow = true;
      s.buildingGroup.add(slab);
    }

    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: roofStyle.roughness, metalness: roofStyle.metalness });
    const overhang = isBaseline ? 1.0 : 1.14;
    let roof;
    if (!isBaseline && inputs.roofType === "pitched") {
      roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, length) * 0.62, Math.min(width, length) * 0.55, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(width / Math.max(width, length), 1, length / Math.max(width, length));
      roof.position.y = totalHeight + Math.min(width, length) * 0.275;
    } else if (!isBaseline && inputs.roofType === "vaulted") {
      roof = new THREE.Mesh(new THREE.CylinderGeometry(length * 0.52, length * 0.52, width, 20, 1, false, 0, Math.PI), roofMat);
      roof.rotation.z = Math.PI / 2;
      roof.position.y = totalHeight + length * 0.26;
    } else {
      roof = new THREE.Mesh(new THREE.BoxGeometry(width * overhang, Math.max(width, length) * 0.055, length * overhang), roofMat);
      roof.position.y = totalHeight + Math.max(width, length) * 0.03;
    }
    roof.castShadow = true; roof.receiveShadow = true;
    roof.userData.label = isBaseline ? `Flat unoptimized roof — U ${designParams.uRoof.toFixed(2)} W/m²K` : `${inputs.roofType[0].toUpperCase() + inputs.roofType.slice(1)} roof — ${inputs.roofMaterial}, U ${designParams.uRoof.toFixed(2)} W/m²K`;
    roof.userData.part = "roof";
    s.buildingGroup.add(roof);
    s.hoverable.push(roof);

    const winArea = designParams.windowArea;
    const perFloorArea = winArea / floors;
    const winW = Math.min(width * 0.75, Math.sqrt(perFloorArea * 2.2));
    const winH = Math.min(floorH * 0.55, perFloorArea / Math.max(0.5, winW));
    const winMat = new THREE.MeshPhysicalMaterial({
      color: windowColor, roughness: 0.05, transparent: true, opacity: 0.55, transmission: 0.55, thickness: 0.05,
      emissive: view === "thermal" ? windowColor : 0x2a4a5e, emissiveIntensity: view === "thermal" ? 0.3 : 0.12,
    });

    const windowAnchors = [];
    for (let f = 0; f < floors; f++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, Math.max(0.4, winH)), winMat.clone());
      win.position.set(0, f * floorH + floorH * 0.55, length / 2 + 0.02);
      win.rotation.y = Math.PI;
      win.userData.label = isBaseline ? "Small, poorly placed window — high heat loss" : "South-facing window — optimized solar gain";
      win.userData.part = "window";
      win.userData.anchor = new THREE.Vector3(0, f * floorH + floorH * 0.55, length / 2);
      s.buildingGroup.add(win);
      s.hoverable.push(win);
      windowAnchors.push(win.userData.anchor);
    }

    if (!isBaseline) {
      for (let f = 0; f < floors; f++) {
        const back = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.9, Math.max(0.4, winH * 0.9)), winMat.clone());
        back.position.set(0, f * floorH + floorH * 0.55, -length / 2 - 0.02);
        back.userData.label = "Cross-ventilation opening — draws cool air through";
        back.userData.part = "window";
        back.userData.anchor = new THREE.Vector3(0, f * floorH + floorH * 0.55, -length / 2);
        s.buildingGroup.add(back);
        s.hoverable.push(back);
        windowAnchors.push(back.userData.anchor);
      }
      [-1, 1].forEach((side2) => {
        for (let f = 0; f < floors; f++) {
          const sw = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.1, length * 0.18), 0.9), winMat.clone());
          sw.position.set(side2 * (width / 2 + 0.02), f * floorH + floorH * 0.55, length * 0.15);
          sw.rotation.y = side2 > 0 ? Math.PI / 2 : -Math.PI / 2;
          sw.userData.label = "Secondary daylight opening";
          sw.userData.part = "window";
          s.buildingGroup.add(sw);
          s.hoverable.push(sw);
        }
      });
    }

    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.95), new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.6 }));
    door.position.set(width * 0.28, 0.975, length / 2 + 0.015);
    door.rotation.y = Math.PI;
    door.userData.label = "Main entrance";
    s.buildingGroup.add(door);
    s.hoverable.push(door);

    const ventAnchors = [];
    if (!isBaseline && inputs.ventilationType !== "none") {
      const grilleColor = inputs.ventilationType === "mechanical" ? 0x3a4a5e : 0x22334a;
      [-1, 1].forEach((side2) => {
        const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ color: grilleColor, roughness: 0.5, emissive: 0x1a2a3a, emissiveIntensity: 0.2 }));
        grille.position.set(side2 * width * 0.32, totalHeight - 0.35, length / 2 + 0.02);
        grille.rotation.y = Math.PI;
        grille.userData.label = `Ventilation duct (${inputs.ventilationType}) — controlled fresh air`;
        grille.userData.part = "vent";
        s.buildingGroup.add(grille);
        s.hoverable.push(grille);
        const anchor = new THREE.Vector3(side2 * width * 0.32, totalHeight - 0.35, length / 2);
        ventAnchors.push(anchor);

        const duct = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 8), new THREE.MeshStandardMaterial({ color: 0x4a6a7e, roughness: 0.4, metalness: 0.3 }));
        duct.position.set(side2 * width * 0.32, totalHeight - 0.35, length / 2 + 0.7);
        duct.rotation.x = Math.PI / 2;
        s.buildingGroup.add(duct);
      });
    }

    if (floors > 1 && width >= 5) {
      const balconyY = floorH * (floors - 1) + 0.05;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.08, 1.1), new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.8 }));
      slab.position.set(0, balconyY, length / 2 + 0.6);
      slab.castShadow = true; slab.receiveShadow = true;
      slab.userData.label = "Balcony";
      s.buildingGroup.add(slab);
      s.hoverable.push(slab);
      const rail = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 0.5, 0.04), new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.4, metalness: 0.3 }));
      rail.position.set(0, balconyY + 0.3, length / 2 + 1.13);
      s.buildingGroup.add(rail);
    }

    buildSection(side, mode, width);

    s.dims = { width, length, totalHeight, floors };
    s.ventAnchors = ventAnchors;
    s.windowAnchors = windowAnchors;
    s.buildingGroup.rotation.y = isBaseline ? WRONG_ROTATION : ((180 - (geometry.azimuth ?? 180)) * Math.PI) / 180;

    buildHeatLoss(side, mode);
    buildAirflowVisual(side, mode);
    } catch (err) {
      console.error("Building3D rebuildSide error:", err);
    }
  }

  function buildSection(side, mode, width) {
    const s = sidesRef.current[side];
    const grp = s.sectionGroup;
    grp.position.set(0, 1.3, 0);
    grp.rotation.copy(s.buildingGroup.rotation);
    const x0 = width / 2 + 1.4;
    if (mode === "baseline") {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.9 }));
      box.position.set(x0, 0, 0);
      box.userData.label = "No insulation — single layer wall";
      grp.add(box);
      s.hoverable.push(box);
    } else {
      const outer = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.9 }));
      outer.position.set(x0, 0, 0);
      outer.userData.label = "Outer wall layer";
      const insul = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0xe8934a, roughness: 0.6, emissive: 0xe8934a, emissiveIntensity: 0.35 }));
      insul.position.set(x0 + 0.24, 0, 0);
      insul.userData.label = "Insulation layer — cuts heat transfer";
      const inner = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.3, 1.3), new THREE.MeshStandardMaterial({ color: 0xc9c2b4, roughness: 0.9 }));
      inner.position.set(x0 + 0.46, 0, 0);
      inner.userData.label = "Inner wall layer";
      grp.add(outer, insul, inner);
      s.hoverable.push(outer, insul, inner);
    }
  }

  function buildHeatLoss(side, mode) {
    const s = sidesRef.current[side];
    disposeGroup(s.heatLossGroup);
    if (!data || view === "airflow") return;
    const isBaseline = mode === "baseline";
    const { width, length, totalHeight } = s.dims;
    const ratio = isBaseline ? Math.max(1, uaTotals.baseline / Math.max(1, uaTotals.optimized)) : 1;
    const count = isBaseline ? Math.min(22, Math.round(6 * ratio)) : 4;
    const sources = [
      { pos: new THREE.Vector3(0, totalHeight * 0.85, length / 2), dir: new THREE.Vector3(0, 0.3, 1) },
      { pos: new THREE.Vector3(0, totalHeight + 0.1, 0), dir: new THREE.Vector3(0, 1, 0) },
      { pos: new THREE.Vector3(width / 2, totalHeight * 0.5, 0), dir: new THREE.Vector3(1, 0.15, 0) },
      { pos: new THREE.Vector3(-width / 2, totalHeight * 0.5, 0), dir: new THREE.Vector3(-1, 0.15, 0) },
    ];
    for (let i = 0; i < count; i++) {
      const src = sources[i % sources.length];
      const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xe0402e, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(0.3, 0.3, 1);
      const jitter = new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.8);
      const from = src.pos.clone().add(jitter);
      sp.position.copy(from);
      sp.userData = { t: Math.random(), from, dir: src.dir.clone().normalize(), dist: 2.4 + Math.random(), speed: 0.6 + Math.random() * 0.5, baseOpacity: 0.8 };
      s.heatLossGroup.add(sp);
    }
    const arrowCount = isBaseline ? 3 : 1;
    for (let i = 0; i < arrowCount; i++) {
      const src = sources[i % sources.length];
      const arrow = new THREE.ArrowHelper(src.dir.clone().normalize(), src.pos, 1.6, 0xe0402e, 0.35, 0.22);
      s.heatLossGroup.add(arrow);
    }
  }

  function buildAirflowVisual(side, mode) {
    const s = sidesRef.current[side];
    disposeGroup(s.airflowGroup);
    if (!data || view !== "airflow") return;
    const isBaseline = mode === "baseline";
    const { width, length, totalHeight } = s.dims;
    const coolMat = () => new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0x6fa8c9, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    const hotMat = () => new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xe0522e, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    const makeParticle = (grp, from, to, mat, speed, arc) => {
      const sp = new THREE.Sprite(mat);
      sp.scale.set(0.3, 0.3, 1);
      sp.position.copy(from);
      sp.userData = { t: Math.random(), from, to, speed, arc };
      grp.add(sp);
    };
    if (isBaseline) {
      for (let i = 0; i < 6; i++) {
        const gapX = (Math.random() - 0.5) * width * 0.9;
        const from = new THREE.Vector3(gapX, 0.15, length / 2 + 1.6);
        const to = new THREE.Vector3(gapX * 0.6, 0.6 + Math.random() * 0.8, 0);
        makeParticle(s.airflowGroup, from, to, coolMat(), 0.5 + Math.random() * 0.3, 0.15);
      }
      for (let i = 0; i < 3; i++) {
        const from = new THREE.Vector3((Math.random() - 0.5) * width * 0.7, totalHeight * 0.9, (Math.random() - 0.5) * length * 0.7);
        const to = new THREE.Vector3(from.x * 1.4, totalHeight + 2, from.z * 1.4);
        makeParticle(s.airflowGroup, from, to, hotMat(), 0.5, 0.05);
      }
    } else {
      s.windowAnchors.forEach((wa, i) => {
        const vent = s.ventAnchors[i % Math.max(1, s.ventAnchors.length)] || new THREE.Vector3(0, totalHeight - 0.3, -wa.z);
        for (let n = 0; n < 3; n++) makeParticle(s.airflowGroup, wa.clone(), vent.clone(), coolMat(), 0.8 + n * 0.12, 0.5);
      });
      s.ventAnchors.forEach((va) => {
        for (let n = 0; n < 2; n++) makeParticle(s.airflowGroup, new THREE.Vector3(0, totalHeight * 0.4, 0), va.clone(), hotMat(), 0.6 + n * 0.15, 0.8);
      });
    }
  }

  function buildSolarRays(side, mode, sunPos) {
    const s = sidesRef.current[side];
    disposeGroup(s.solarRayGroup);
    if (!data || view === "airflow") return;
    const daylight = hour >= 6 && hour <= 18;
    if (!daylight) return;
    const isBaseline = mode === "baseline";
    const { length, totalHeight } = s.dims;
    const target = new THREE.Vector3(0, totalHeight * 0.5, isBaseline ? length * 0.2 : length / 2);
    const count = isBaseline ? 2 : 6;
    const opacity = isBaseline ? 0.28 : 0.75;
    for (let i = 0; i < count; i++) {
      const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffd89a, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(isBaseline ? 0.22 : 0.34, isBaseline ? 0.22 : 0.34, 1);
      const jitter = new THREE.Vector3((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.6);
      const from = sunPos.clone();
      const to = target.clone().add(jitter);
      sp.position.copy(from);
      sp.userData = { t: Math.random(), from, to, baseOpacity: opacity };
      s.solarRayGroup.add(sp);
    }
  }

  function buildWeather(side) {
    const s = sidesRef.current[side];
    disposeGroup(s.weatherGroup);
    const special = data?.inputs?.special;
    if (!special) return;
    if (special.snow) {
      for (let i = 0; i < 90; i++) {
        const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xdfeeff, transparent: true, opacity: 0.75, depthWrite: false });
        const sp = new THREE.Sprite(mat);
        const scale = 0.06 + Math.random() * 0.08;
        sp.scale.set(scale, scale, 1);
        sp.position.set((Math.random() - 0.5) * 16, Math.random() * 10, (Math.random() - 0.5) * 16);
        sp.userData = { kind: "snow", speed: 0.4 + Math.random() * 0.5, drift: (Math.random() - 0.5) * 0.3, seed: Math.random() * 10 };
        s.weatherGroup.add(sp);
      }
    }
    if (special.wind) {
      for (let i = 0; i < 24; i++) {
        const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xaebfce, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
        const sp = new THREE.Sprite(mat);
        sp.scale.set(0.5, 0.08, 1);
        sp.position.set(-9 - Math.random() * 4, 0.5 + Math.random() * 4, (Math.random() - 0.5) * 12);
        sp.userData = { kind: "wind", speed: 3 + Math.random() * 2, t: Math.random() };
        s.weatherGroup.add(sp);
      }
    }
    if (special.heatwave) {
      for (let i = 0; i < 30; i++) {
        const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xff7a3d, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending });
        const sp = new THREE.Sprite(mat);
        const scale = 0.4 + Math.random() * 0.5;
        sp.scale.set(scale, scale, 1);
        sp.position.set((Math.random() - 0.5) * 10, 0.1, (Math.random() - 0.5) * 10);
        sp.userData = { kind: "heatwave", speed: 0.5 + Math.random() * 0.6, seed: Math.random() * 10, baseY: 0.1 };
        s.weatherGroup.add(sp);
      }
    }
  }

  function recolor() {
    if (!data) return;
    ["L", "R"].forEach((side) => {
      const s = sidesRef.current[side];
      if (!s) return;
      try {
      const mode = side === "L" ? "baseline" : "optimized";
      const { classification, geometry } = data;
      const designParams = data.designParams[mode];
      const shares = uaShares(designParams, geometry);
      const entries = [];
      s.hoverable.forEach((mesh) => {
        if (!mesh.material || !mesh.material.color) return;
        let target = null;
        if (mesh.userData.part === "wall") {
          if (view === "thermal") {
            const worldNormal = new THREE.Vector3(mesh.userData.face === "E" ? 1 : mesh.userData.face === "W" ? -1 : 0, 0, mesh.userData.face === "S" ? 1 : mesh.userData.face === "N" ? -1 : 0);
            worldNormal.applyEuler(new THREE.Euler(0, s.buildingGroup.rotation.y, 0));
            const exposure = Math.max(0, worldNormal.dot(sunDirRef.current));
            const baseT = Math.max(0, Math.min(1, shares.wall / 0.55)) * 0.5 + 0.5;
            target = tempColor(Math.min(1, baseT + exposure * 0.35));
          } else target = CLIMATE_WALL_COLOR[classification.key] ?? CLIMATE_WALL_COLOR.composite;
        } else if (mesh.userData.part === "roof") {
          target = view === "thermal" ? heatColor(shares.roof) : (mode === "baseline" ? ROOF_MATERIAL_STYLE.concrete.color : (ROOF_MATERIAL_STYLE[data.inputs.roofMaterial]?.color ?? 0x8a7a63));
        } else if (mesh.userData.part === "window") {
          target = view === "thermal" ? heatColor(shares.window) : 0x9fd6ee;
        }
        if (target !== null && target !== undefined) entries.push({ mesh, from: mesh.material.color.getHex(), to: target });
      });
      transitionRef.current[side] = { start: performance.now(), entries };
      buildHeatLoss(side, mode);
      buildAirflowVisual(side, mode);
      buildSolarRays(side, mode, s.sunLight.position);
      } catch (err) {
        console.error("Building3D recolor error:", err);
      }
    });
  }

  function updateSun(h) {
    if (!data) return;
    const frac = (h - 6) / 12;
    const daylight = frac >= 0 && frac <= 1;
    const elevation = daylight ? Math.sin(frac * Math.PI) : 0;
    const bearingDeg = 90 + Math.max(0, Math.min(1, frac)) * 180;
    const bearingRad = (bearingDeg * Math.PI) / 180;
    const R = 18, elevRad = elevation * 1.05;
    const dirX = Math.sin(bearingRad) * Math.cos(elevRad);
    const dirZ = Math.cos(bearingRad) * Math.cos(elevRad);
    const dirY = Math.sin(elevRad);
    sunDirRef.current.set(dirX, Math.max(0.02, dirY), dirZ).normalize();

    ["L", "R"].forEach((side) => {
      const s = sidesRef.current[side];
      if (!s) return;
      try {
      s.sunLight.position.set(dirX * R, Math.max(0.6, dirY * R), dirZ * R);
      s.sunLight.target.position.set(0, 2, 0);
      s.sunLight.intensity = daylight ? 0.6 + 1.15 * elevation : 0.12;
      s.ambientLight.intensity = daylight ? 0.45 + 0.35 * elevation : 0.55;
      const bg = daylight ? lerpColor(0x0d1826, 0x2c5a8c, elevation) : new THREE.Color(0x060b14);
      s.scene.background = bg;
      s.scene.fog.color = bg;
      s.sunMesh.position.copy(s.sunLight.position);
      s.sunMesh.material.opacity = daylight ? 0.9 : 0.1;

      const mode = side === "L" ? "baseline" : "optimized";
      const indoorArr = mode === "baseline" ? data.simulation.baselineIndoor : data.simulation.optimizedIndoor;
      const outdoorArr = data.simulation.outdoor;
      const outMin = Math.min(...outdoorArr);
      const ceil = (data.inputs?.desiredTemp || 21) + 3;
      const warmthRaw = (safeNum(indoorArr[h], outMin) - outMin) / Math.max(1, ceil - outMin);
      const warmth = Math.max(0, Math.min(1, warmthRaw));
      s.interiorGlow.intensity = warmth * 2.2;
      s.interiorSprite.material.opacity = warmth * 0.5;
      s.interiorSprite.position.set(0, s.dims.totalHeight ? s.dims.totalHeight * 0.55 : 1.6, 0);
      s.interiorGlow.position.copy(s.interiorSprite.position);
      } catch (err) {
        console.error("Building3D updateSun error:", err);
      }
    });
  }

  const insights = useMemo(() => {
    if (!data) return { L: [], R: [] };
    const { comparison, simulation } = data;
    const night = hour >= 19 || hour < 6;
    const L = [
      "Baseline construction — standard materials, no optimization",
      night ? "Temperature drops rapidly after sunset" : "Weak, misaligned solar capture",
      view === "thermal" ? "High heat loss through roof & walls" : view === "airflow" ? "Uncontrolled airflow through gaps" : "Wrong orientation — window misses the sun",
      `Retains only ${Math.round(simulation.baselineMetrics?.retention ?? 0)}% of the day-night swing`,
      "No insulation layer, no vents",
    ];
    const R = [
      "Optimized construction — climate-matched design",
      night ? `Retains ${Math.abs(comparison.nightTemperatureGain)}°C more heat at night` : "Strong, aligned solar capture",
      view === "thermal" ? "Reduced heat loss — insulated envelope" : view === "airflow" ? "Designed ventilation — controlled fresh air" : "South-facing orientation captures solar heat",
      `${comparison.energySavingPercent}% less heating/cooling energy required`,
      "Insulated walls, visible ventilation ducts",
    ];
    return { L, R };
  }, [data, hour, view]);

  useEffect(() => {
    const len = Math.max(insights.L.length, 1);
    const t = setInterval(() => setInsightIdx((i) => (i + 1) % len), 4200);
    return () => clearInterval(t);
  }, [insights]);

  const baseRetention = useCountUp(data?.simulation?.baselineMetrics?.retention ? Math.round(data.simulation.baselineMetrics.retention) : 0);
  const optRetention = useCountUp(data?.simulation?.optimizedMetrics?.retention ? Math.round(data.simulation.optimizedMetrics.retention) : 0);
  const energySaving = useCountUp(data?.comparison?.energySavingPercent ?? 0);
  const comfortDelta = useCountUp((data?.comfortScore?.overall ?? 0) - (data?.baselineScore?.overall ?? 0));

  const night = hour >= 18 || hour < 6;
  const simpleCaptionL = night ? "Heat is escaping here" : "Sunlight enters, but not efficiently";
  const simpleCaptionR = night ? "Heat is being retained here" : "Sunlight is being captured well";
  const captionL = playing ? simpleCaptionL : insights.L[insightIdx % insights.L.length];
  const captionR = playing ? simpleCaptionR : insights.R[insightIdx % insights.R.length];

  if (!data) {
    return (
      <div className="bg-panel border border-line rounded-xl overflow-hidden flex flex-col items-center justify-center h-full min-h-[420px] gap-2 text-center px-6">
        <span className="text-3xl">🏗️</span>
        <p className="text-muted text-[13.5px] leading-relaxed max-w-xs">
          The 3D comparison will appear here once a design has been generated.
        </p>
      </div>
    );
  }

  if (sceneError) {
    return (
      <div className="bg-panel border border-line rounded-xl overflow-hidden flex flex-col items-center justify-center h-full min-h-[420px] gap-2 text-center px-6">
        <span className="text-3xl">⚠️</span>
        <p className="text-muted text-[13.5px] leading-relaxed max-w-xs">
          The 3D view couldn't load in this browser. Your numbers and charts below are still accurate.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-line rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 border-b border-line flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted text-[11px] uppercase tracking-wide font-medium">Baseline vs Optimized — synchronized view</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSection((v) => !v)}
            className={`px-3 py-1 rounded-md text-[11.5px] font-medium border ${showSection ? "border-amber text-amber" : "border-line text-muted"}`}>
            Wall section {showSection ? "on" : "off"}
          </button>
          <span className="bg-panel2 border border-line text-[11px] text-muted px-2 py-1 rounded-md font-mono">
            {String(hour).padStart(2, "0")}:00 · {timeLabel(hour)}
          </span>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative min-h-[420px] flex">
        <div ref={wrapLRef} className="w-1/2 h-full relative border-r border-line">
          <div className="absolute top-2 left-2 z-30 pointer-events-none bg-[#0B1420]/85 border border-ember/50 text-ember text-[12px] font-semibold px-2.5 py-1 rounded-md">
            Baseline Design ❌
          </div>
          {hoverLabel.L && (
            <div className="absolute bottom-12 left-2 right-2 z-30 pointer-events-none bg-[#0B1420] border border-ember text-ember text-[11.5px] px-2.5 py-1.5 rounded-md leading-snug">
              {hoverLabel.L}
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 z-30 pointer-events-none flex justify-center">
            <div className="bg-[#0B1420]/90 border border-ember/40 text-ember text-[11.5px] px-3 py-1.5 rounded-full text-center leading-snug">
              {captionL}
            </div>
          </div>
          {showSection && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none bg-[#0B1420]/85 border border-line text-muted text-[10.5px] px-2 py-1 rounded-md">
              No insulation
            </div>
          )}
        </div>
        <div ref={wrapRRef} className="w-1/2 h-full relative">
          <div className="absolute top-2 left-2 z-30 pointer-events-none bg-[#0B1420]/85 border border-sage/50 text-sage text-[12px] font-semibold px-2.5 py-1 rounded-md">
            Optimized Design ✅
          </div>
          {hoverLabel.R && (
            <div className="absolute bottom-12 left-2 right-2 z-30 pointer-events-none bg-[#0B1420] border border-sage text-sage text-[11.5px] px-2.5 py-1.5 rounded-md leading-snug">
              {hoverLabel.R}
            </div>
          )}
          <div className="absolute bottom-2 left-2 right-2 z-30 pointer-events-none flex justify-center">
            <div className="bg-[#0B1420]/90 border border-sage/40 text-sage text-[11.5px] px-3 py-1.5 rounded-full text-center leading-snug">
              {captionR}
            </div>
          </div>
          {showSection && (
            <div className="absolute top-2 right-2 z-30 pointer-events-none bg-[#0B1420]/85 border border-line text-muted text-[10.5px] px-2 py-1 rounded-md">
              3-layer insulated wall
            </div>
          )}
        </div>
        <div ref={overlayRef} className="absolute inset-0 z-20" style={{ cursor: "grab", touchAction: "none" }} />
      </div>

      <div className="px-4 py-2 border-t border-line flex flex-wrap items-center gap-x-6 gap-y-1 text-[11.5px] font-mono">
        <span className="text-muted">Heat retention: <span className="text-ember">{baseRetention}%</span> <span className="text-line">|</span> <span className="text-sage">{optRetention}%</span></span>
        <span className="text-muted">Energy saving: <span className="text-sage">+{energySaving}%</span></span>
        <span className="text-muted">Comfort score: <span className="text-sage">+{comfortDelta}</span></span>
      </div>

      <div className="px-4 py-2.5 border-t border-line flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[12.5px] text-muted whitespace-nowrap">{String(hour).padStart(2, "0")}:00</span>
        <input type="range" min={0} max={23} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="flex-1 accent-amber min-w-[120px]" />
        <button onClick={() => setPlaying((p) => !p)} className="font-mono text-[12.5px] text-muted whitespace-nowrap cursor-pointer hover:text-amber">
          {playing ? "⏸ pause" : "▶ play simulation"}
        </button>
        <div className="flex gap-1">
          {SPEEDS.map((sp) => (
            <button key={sp} onClick={() => setSpeed(sp)} className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${speed === sp ? "border-amber text-amber" : "border-line text-muted"}`}>
              {sp}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
