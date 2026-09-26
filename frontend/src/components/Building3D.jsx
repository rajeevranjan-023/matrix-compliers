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
let GLOW_TEX = null;

function uaShares(params, geometry) {
  const wallUA = params.uWall * geometry.wallArea;
  const roofUA = params.uRoof * geometry.roofArea;
  const winUA = params.uWindow * params.windowArea;
  const infUA = 0.33 * params.ach * geometry.volume;
  const total = wallUA + roofUA + winUA + infUA || 1;
  return { wall: wallUA / total, roof: roofUA / total, window: winUA / total };
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

export default function Building3D({ data, view }) {
  const wrapRef = useRef(null);
  const tooltipRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const buildingGroupRef = useRef(null);
  const sunLightRef = useRef(null);
  const ambientLightRef = useRef(null);
  const sunMeshRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const hoverableRef = useRef([]);
  const frameRef = useRef(null);
  const transitionRef = useRef(null);
  const airflowGroupRef = useRef(null);
  const heatGroupRef = useRef(null);
  const particlesRef = useRef([]);
  const sunDirRef = useRef(new THREE.Vector3(0, 1, 0));
  const selectedRef = useRef(null);
  const clockRef = useRef({ start: performance.now() });

  const [hour, setHour] = useState(12);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [hoverLabel, setHoverLabel] = useState(null);
  const [pinnedLabel, setPinnedLabel] = useState(null);
  const [designMode, setDesignMode] = useState("optimized");
  const [insightIdx, setInsightIdx] = useState(0);
  const playTimer = useRef(null);

  const activeParams = data?.designParams?.[designMode];
  const otherMode = designMode === "optimized" ? "baseline" : "optimized";

  const insights = useMemo(() => {
    if (!data) return [];
    const { classification, comparison, comfortScore, inputs, simulation } = data;
    const list = [];
    const indoorNow = (designMode === "optimized" ? simulation?.optimizedIndoor : simulation?.baselineIndoor)?.[hour];
    const outdoorNow = simulation?.outdoor?.[hour];
    if (hour >= 10 && hour <= 15) {
      list.push(`Solar gain concentrated on the ${classification?.key?.startsWith("cold") ? "south" : "sun-facing"} wall right now.`);
    } else {
      list.push(`Heat is escaping through the roof and walls — the biggest loss path at night.`);
    }
    if (comparison) {
      list.push(`Optimized design stays ${Math.abs(comparison.nightTemperatureGain)}°C ${comparison.nightTemperatureGain >= 0 ? "warmer" : "cooler"} at night than the baseline.`);
      list.push(`Roughly ${comparison.energySavingPercent}% less heating/cooling load than an unoptimized baseline build.`);
    }
    if (comfortScore?.insulationScore < 65) list.push("Insulation score is low — consider thicker walls or a better U-value.");
    if (comfortScore?.ventilationScore != null) list.push(`Ventilation match is ${comfortScore.ventilationScore}/100 for this climate.`);
    if (inputs?.ventilationType !== "none") list.push(`${inputs?.ventilationType === "mechanical" ? "Mechanical" : "Natural"} ventilation reduces indoor overheating risk.`);
    if (indoorNow != null && outdoorNow != null) {
      const diff = (indoorNow - outdoorNow).toFixed(1);
      list.push(`Indoor is ${diff > 0 ? diff + "°C warmer" : Math.abs(diff) + "°C cooler"} than outdoor air right now.`);
    }
    return list;
  }, [data, hour, designMode]);

  useEffect(() => {
    if (insights.length < 2) return;
    const t = setInterval(() => setInsightIdx((i) => (i + 1) % insights.length), 4200);
    return () => clearInterval(t);
  }, [insights.length]);

  useEffect(() => {
    GLOW_TEX = GLOW_TEX || glowTexture();
    const wrap = wrapRef.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d1826);
    scene.fog = new THREE.Fog(0x0d1826, 28, 55);

    const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / Math.max(1, wrap.clientHeight), 0.1, 200);
    camera.position.set(13, 10, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    wrap.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6; controls.maxDistance = 45;
    controls.maxPolarAngle = Math.PI * 0.49;

    const ambientLight = new THREE.AmbientLight(0xa9c0d6, 0.65);
    scene.add(ambientLight);
    const hemi = new THREE.HemisphereLight(0x9fc7e8, 0x1a2436, 0.4);
    scene.add(hemi);
    const sunLight = new THREE.DirectionalLight(0xffe3b0, 1.15);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -20; sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20; sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight, sunLight.target);

    const sunMesh = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffdca0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sunMesh.scale.set(3, 3, 1);
    scene.add(sunMesh);
    sunMeshRef.current = sunMesh;

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(30, 48),
      new THREE.MeshStandardMaterial({ color: 0x16233a, roughness: 1 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);

    const ringGeo = new THREE.RingGeometry(6.6, 7, 48);
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xe8934a, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.0;
    scene.add(ring);

    [[0, 0, 1, 0x6fa8c9, "N"], [1, 0, 0, 0x8fa0b5, "E"], [0, 0, -1, 0xd46a3e, "S"], [-1, 0, 0, 0x8fa0b5, "W"]].forEach(([x, , z, color]) => {
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 12), new THREE.MeshBasicMaterial({ color }));
      dot.position.set(x * 13, 0.1, z * 13);
      scene.add(dot);
    });

    const buildingGroup = new THREE.Group();
    scene.add(buildingGroup);

    sceneRef.current = scene; cameraRef.current = camera; rendererRef.current = renderer;
    controlsRef.current = controls; buildingGroupRef.current = buildingGroup;
    sunLightRef.current = sunLight; ambientLightRef.current = ambientLight;

    function onResize() {
      if (!wrap || !renderer) return;
      camera.aspect = wrap.clientWidth / Math.max(1, wrap.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    }
    window.addEventListener("resize", onResize);

    function onPointerMove(e) {
      const rect = wrap.getBoundingClientRect();
      pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const tip = tooltipRef.current;
      if (tip) { tip.style.left = `${e.clientX - rect.left + 14}px`; tip.style.top = `${e.clientY - rect.top + 10}px`; }
    }
    wrap.addEventListener("pointermove", onPointerMove);

    function onClick() {
      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(hoverableRef.current, false);
      if (hits.length && hits[0].object.userData.label) {
        if (selectedRef.current) selectedRef.current.material.emissiveIntensity = selectedRef.current.userData.baseEmissive ?? 0;
        selectedRef.current = hits[0].object;
        setPinnedLabel(hits[0].object.userData.label);
      } else {
        if (selectedRef.current) selectedRef.current.material.emissiveIntensity = selectedRef.current.userData.baseEmissive ?? 0;
        selectedRef.current = null;
        setPinnedLabel(null);
      }
    }
    wrap.addEventListener("click", onClick);

    function animate() {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      const elapsed = (performance.now() - clockRef.current.start) / 1000;

      const tr = transitionRef.current;
      if (tr) {
        const t = Math.min(1, (performance.now() - tr.start) / 300);
        tr.entries.forEach(({ mesh, from, to }) => { mesh.material.color.copy(lerpColor(from, to, t)); });
        if (t >= 1) transitionRef.current = null;
      }

      raycasterRef.current.setFromCamera(pointerRef.current, camera);
      const hits = raycasterRef.current.intersectObjects(hoverableRef.current, false);
      if (hits.length && hits[0].object.userData.label) {
        setHoverLabel(hits[0].object.userData.label);
        wrap.style.cursor = "pointer";
      } else {
        setHoverLabel(null);
        wrap.style.cursor = "grab";
      }

      if (selectedRef.current) {
        selectedRef.current.material.emissiveIntensity = 0.55 + Math.sin(elapsed * 4) * 0.25;
      }

      if (airflowGroupRef.current) {
        airflowGroupRef.current.children.forEach((p) => {
          const ud = p.userData;
          ud.t = (ud.t + 0.006 * (ud.speed || 1)) % 1;
          p.position.lerpVectors(ud.from, ud.to, ud.t);
          p.position.y += Math.sin(ud.t * Math.PI) * (ud.arc || 0);
          p.material.opacity = 0.85 * Math.sin(Math.max(0.001, ud.t) * Math.PI);
        });
      }

      if (heatGroupRef.current) {
        heatGroupRef.current.children.forEach((p) => {
          const ud = p.userData;
          ud.t += 0.01 * (ud.speed || 1);
          if (ud.t > 1) ud.t = 0;
          if (ud.mode === "rise") {
            p.position.y = ud.baseY + ud.t * ud.height;
            p.position.x = ud.baseX + Math.sin(ud.t * 6 + ud.seed) * 0.12;
            p.material.opacity = 0.7 * (1 - ud.t);
          } else {
            p.position.lerpVectors(ud.from, ud.to, ud.t);
            p.material.opacity = 0.9 * Math.sin(Math.max(0.001, ud.t) * Math.PI);
          }
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("click", onClick);
      cancelAnimationFrame(frameRef.current);
      controls.dispose();
      renderer.dispose();
      if (wrap && renderer.domElement.parentNode === wrap) wrap.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (!data || !buildingGroupRef.current) return;
    rebuildBuilding();
    updateSun(hour);
    recolorForView();
    // eslint-disable-next-line
  }, [data, designMode]);

  useEffect(() => {
    if (!data || !buildingGroupRef.current) return;
    recolorForView();
    // eslint-disable-next-line
  }, [view]);

  useEffect(() => { if (data) { updateSun(hour); recolorForView(); } /* eslint-disable-next-line */ }, [hour]);

  useEffect(() => {
    if (!playing) { clearTimeout(playTimer.current); return; }
    playTimer.current = setTimeout(() => setHour((h) => (h + 1) % 24), 480 / speed);
    return () => clearTimeout(playTimer.current);
  }, [playing, hour, speed]);

  function clearBuilding() {
    const group = buildingGroupRef.current;
    while (group.children.length) {
      const c = group.children.pop();
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    }
    hoverableRef.current = [];
    airflowGroupRef.current = null;
    heatGroupRef.current = null;
    selectedRef.current = null;
  }

  function facadeColorFor(part, view, classification, shares) {
    if (view === "thermal") {
      if (part === "wall") return heatColor(shares.wall);
      if (part === "roof") return heatColor(shares.roof);
      if (part === "window") return heatColor(shares.window);
    }
    if (part === "wall") return CLIMATE_WALL_COLOR[classification.key];
    if (part === "roof") return ROOF_MATERIAL_STYLE[data.inputs.roofMaterial]?.color ?? 0x8a7a63;
    if (part === "window") return 0x9fd6ee;
    return 0xffffff;
  }

  function addWallFace(group, opts) {
    const { w, h, thickness, normal, pos, color, label } = opts;
    const geo = normal === "z"
      ? new THREE.BoxGeometry(w, h, thickness)
      : new THREE.BoxGeometry(thickness, h, w);
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.82, emissive: 0x000000, emissiveIntensity: 0 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.userData.label = label;
    mesh.userData.face = normal === "z" ? (pos.z > 0 ? "S" : "N") : (pos.x > 0 ? "E" : "W");
    mesh.userData.part = "wall";
    group.add(mesh);
    hoverableRef.current.push(mesh);
    return mesh;
  }

  function rebuildBuilding() {
    clearBuilding();
    const group = buildingGroupRef.current;
    const { classification, geometry, inputs } = data;
    const designParams = data.designParams[designMode];
    const width = geometry.width, length = geometry.length;
    const totalHeight = geometry.totalHeight, floors = geometry.floors, floorH = geometry.roomHeight;
    const shares = uaShares(designParams, geometry);

    const wallColor = facadeColorFor("wall", view, classification, shares);
    const roofColor = facadeColorFor("roof", view, classification, shares);
    const windowColor = facadeColorFor("window", view, classification, shares);
    const roofStyle = ROOF_MATERIAL_STYLE[inputs.roofMaterial] || ROOF_MATERIAL_STYLE.concrete;
    const wallT = designMode === "baseline" ? 0.22 : Math.max(0.18, Math.min(0.5, (inputs.wallThicknessMM || 300) / 1000));

    addWallFace(group, { w: width, h: totalHeight, thickness: wallT, normal: "z", pos: new THREE.Vector3(0, totalHeight / 2, length / 2 - wallT / 2), color: wallColor, label: `South wall — U ${designParams.uWall.toFixed(2)} W/m²K (${designMode})` });
    addWallFace(group, { w: width, h: totalHeight, thickness: wallT, normal: "z", pos: new THREE.Vector3(0, totalHeight / 2, -length / 2 + wallT / 2), color: wallColor, label: `North wall — U ${designParams.uWall.toFixed(2)} W/m²K (${designMode})` });
    addWallFace(group, { w: length, h: totalHeight, thickness: wallT, normal: "x", pos: new THREE.Vector3(width / 2 - wallT / 2, totalHeight / 2, 0), color: wallColor, label: `East wall — U ${designParams.uWall.toFixed(2)} W/m²K (${designMode})` });
    addWallFace(group, { w: length, h: totalHeight, thickness: wallT, normal: "x", pos: new THREE.Vector3(-width / 2 + wallT / 2, totalHeight / 2, 0), color: wallColor, label: `West wall — U ${designParams.uWall.toFixed(2)} W/m²K (${designMode})` });

    const floorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(width * 1.02, 0.12, length * 1.02),
      new THREE.MeshStandardMaterial({ color: 0x2a3a4e, roughness: 0.9 })
    );
    floorSlab.position.y = -0.02;
    floorSlab.receiveShadow = true;
    group.add(floorSlab);

    for (let f = 1; f < floors; f++) {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(width * 1.01, 0.06, length * 1.01),
        new THREE.MeshStandardMaterial({ color: 0x3a4a5e, roughness: 0.9 })
      );
      slab.position.y = f * floorH;
      slab.receiveShadow = true;
      group.add(slab);
    }

    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: roofStyle.roughness, metalness: roofStyle.metalness });
    let roof;
    if (inputs.roofType === "pitched") {
      roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(width, length) * 0.62, Math.min(width, length) * 0.55, 4), roofMat);
      roof.rotation.y = Math.PI / 4;
      roof.scale.set(width / Math.max(width, length), 1, length / Math.max(width, length));
      roof.position.y = totalHeight + Math.min(width, length) * 0.275;
    } else if (inputs.roofType === "vaulted") {
      roof = new THREE.Mesh(new THREE.CylinderGeometry(length * 0.52, length * 0.52, width, 20, 1, false, 0, Math.PI), roofMat);
      roof.rotation.z = Math.PI / 2;
      roof.position.y = totalHeight + length * 0.26;
    } else {
      roof = new THREE.Mesh(new THREE.BoxGeometry(width * 1.06, Math.max(width, length) * 0.06, length * 1.06), roofMat);
      roof.position.y = totalHeight + Math.max(width, length) * 0.03;
    }
    roof.castShadow = true; roof.receiveShadow = true;
    roof.userData.label = `${inputs.roofType[0].toUpperCase() + inputs.roofType.slice(1)} roof — ${inputs.roofMaterial}, U ${designParams.uRoof.toFixed(2)} W/m²K`;
    roof.userData.part = "roof";
    group.add(roof);
    hoverableRef.current.push(roof);

    const winArea = designParams.windowArea;
    const perFloorArea = winArea / floors;
    const winW = Math.min(width * 0.75, Math.sqrt(perFloorArea * 2.2));
    const winH = Math.min(floorH * 0.55, perFloorArea / Math.max(0.5, winW));
    const winMat = new THREE.MeshPhysicalMaterial({
      color: windowColor, roughness: 0.05, metalness: 0.0, transparent: true, opacity: 0.55,
      transmission: 0.55, thickness: 0.05,
      emissive: view === "thermal" ? windowColor : 0x2a4a5e, emissiveIntensity: view === "thermal" ? 0.3 : 0.12,
    });
    const gainLabel = classification.key.startsWith("cold")
      ? `High solar-gain window (south-facing) — increases winter heat gain [${designMode}]`
      : classification.key === "hot-humid" ? `Cross-ventilation opening — cools interior [${designMode}]` : `Shaded, minimal-gain opening [${designMode}]`;
    for (let f = 0; f < floors; f++) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(winW, Math.max(0.4, winH)), winMat.clone());
      win.position.set(0, f * floorH + floorH * 0.55, length / 2 + 0.02);
      win.rotation.y = Math.PI;
      win.userData.label = gainLabel;
      win.userData.part = "window";
      win.userData.anchor = new THREE.Vector3(0, f * floorH + floorH * 0.55, length / 2);
      group.add(win);
      hoverableRef.current.push(win);
    }

    if (classification.key === "hot-humid" || designMode === "optimized") {
      for (let f = 0; f < floors; f++) {
        const back = new THREE.Mesh(new THREE.PlaneGeometry(winW * 0.9, Math.max(0.4, winH * 0.9)), winMat.clone());
        back.position.set(0, f * floorH + floorH * 0.55, -length / 2 - 0.02);
        back.userData.label = "Cross-ventilation opening (leeward) — draws cool air through";
        back.userData.part = "window";
        back.userData.anchor = new THREE.Vector3(0, f * floorH + floorH * 0.55, -length / 2);
        group.add(back);
        hoverableRef.current.push(back);
      }
    }

    const sideWinMat = winMat.clone();
    [-1, 1].forEach((side) => {
      for (let f = 0; f < floors; f++) {
        const sw = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.1, length * 0.18), 0.9), sideWinMat.clone());
        sw.position.set(side * (width / 2 + 0.02), f * floorH + floorH * 0.55, length * 0.15);
        sw.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
        sw.userData.label = "Secondary daylight opening";
        sw.userData.part = "window";
        group.add(sw);
        hoverableRef.current.push(sw);
      }
    });

    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.95), new THREE.MeshStandardMaterial({ color: 0x2a2118, roughness: 0.6 }));
    door.position.set(width * 0.28, 0.975, length / 2 + 0.015);
    door.rotation.y = Math.PI;
    door.userData.label = "Main entrance (ground floor)";
    group.add(door);
    hoverableRef.current.push(door);

    const ventAnchors = [];
    if (designMode === "optimized" && inputs.ventilationType !== "none") {
      const grilleColor = inputs.ventilationType === "mechanical" ? 0x3a4a5e : 0x22334a;
      [-1, 1].forEach((side) => {
        const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.35), new THREE.MeshStandardMaterial({ color: grilleColor, roughness: 0.5, emissive: 0x1a2a3a, emissiveIntensity: 0.2 }));
        grille.position.set(side * width * 0.32, totalHeight - 0.35, length / 2 + 0.02);
        grille.rotation.y = Math.PI;
        grille.userData.label = `Ventilation zone (${inputs.ventilationType}) — reduces overheating`;
        grille.userData.part = "vent";
        group.add(grille);
        hoverableRef.current.push(grille);
        ventAnchors.push(new THREE.Vector3(side * width * 0.32, totalHeight - 0.35, length / 2));
      });
    }

    if (floors > 1 && width >= 5) {
      const balconyY = floorH * (floors - 1) + 0.05;
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.5, 0.08, 1.1),
        new THREE.MeshStandardMaterial({ color: 0x8a8a86, roughness: 0.8 })
      );
      slab.position.set(0, balconyY, length / 2 + 0.6);
      slab.castShadow = true; slab.receiveShadow = true;
      slab.userData.label = "Balcony";
      group.add(slab);
      hoverableRef.current.push(slab);
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(width * 0.5, 0.5, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xcfd6dc, roughness: 0.4, metalness: 0.3 })
      );
      rail.position.set(0, balconyY + 0.3, length / 2 + 1.13);
      group.add(rail);
    }

    group.userData.ventAnchors = ventAnchors;
    group.userData.dims = { width, length, totalHeight };
    const azimuth = geometry.azimuth ?? 180;
    group.rotation.y = ((180 - azimuth) * Math.PI) / 180;

    buildAirflow();
    buildHeatFlow();
  }

  function buildAirflow() {
    const group = buildingGroupRef.current;
    if (airflowGroupRef.current) { group.remove(airflowGroupRef.current); airflowGroupRef.current = null; }
    if (view !== "airflow" || !data) return;
    const { classification } = data;
    const { width, length, totalHeight } = group.userData.dims || {};
    const ventAnchors = group.userData.ventAnchors || [];
    const ag = new THREE.Group();
    const hasCrossVent = classification.key === "hot-humid";
    const coolMat = () => new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0x6fa8c9, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });
    const hotMat = () => new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xe0522e, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending });

    const windowAnchors = [];
    (buildingGroupRef.current.children || []).forEach((c) => {
      if (c.userData.part === "window" && c.userData.anchor) windowAnchors.push(c.userData.anchor);
    });

    const makeParticle = (from, to, mat, speed, arc) => {
      const s = new THREE.Sprite(mat);
      s.scale.set(0.35, 0.35, 1);
      s.position.copy(from);
      s.userData = { t: Math.random(), from, to, speed, arc };
      ag.add(s);
    };

    windowAnchors.forEach((wa, i) => {
      if (wa.z > 0) {
        const to = ventAnchors[i % Math.max(1, ventAnchors.length)] || new THREE.Vector3(0, totalHeight - 0.3, wa.z * -1);
        for (let n = 0; n < 3; n++) makeParticle(wa.clone(), to.clone(), coolMat(), 0.8 + n * 0.15, 0.6);
      } else {
        const exitPt = new THREE.Vector3(0, totalHeight * 0.55, wa.z);
        for (let n = 0; n < 2; n++) makeParticle(new THREE.Vector3(0, totalHeight * 0.55, wa.z > 0 ? -length / 2 : length / 2), wa.clone(), hasCrossVent ? coolMat() : hotMat(), 0.7 + n * 0.1, 0.3);
      }
    });

    ventAnchors.forEach((va) => {
      for (let n = 0; n < 2; n++) makeParticle(new THREE.Vector3(0, totalHeight * 0.4, 0), va.clone(), hotMat(), 0.6 + n * 0.2, 0.9);
    });

    if (!windowAnchors.length && !ventAnchors.length) {
      const dir = new THREE.Vector3(0, 0, 1);
      const len = length + 3;
      const origin = new THREE.Vector3(0, totalHeight * 0.5, -length / 2 - len);
      ag.add(new THREE.ArrowHelper(dir, origin, len, hasCrossVent ? 0x6fa8c9 : 0x55606e, 0.9, 0.5));
    }

    airflowGroupRef.current = ag;
    group.add(ag);
  }

  function buildHeatFlow() {
    const group = buildingGroupRef.current;
    if (heatGroupRef.current) { group.remove(heatGroupRef.current); heatGroupRef.current = null; }
    if (!data || view === "airflow") return;
    const { width, length, totalHeight } = group.userData.dims || {};
    const hg = new THREE.Group();
    const daylight = hour >= 6 && hour <= 18;

    if (daylight) {
      const sunPos = sunDirRef.current.clone().multiplyScalar(16);
      const wallCenter = new THREE.Vector3(0, totalHeight * 0.55, length / 2);
      for (let n = 0; n < 5; n++) {
        const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xffb35a, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending });
        const s = new THREE.Sprite(mat);
        s.scale.set(0.3, 0.3, 1);
        const jitter = new THREE.Vector3((Math.random() - 0.5) * width * 0.6, (Math.random() - 0.5) * totalHeight * 0.5, 0);
        s.userData = { t: Math.random(), from: sunPos.clone(), to: wallCenter.clone().add(jitter), mode: "beam", speed: 0.5 + Math.random() * 0.4 };
        hg.add(s);
      }
    } else {
      for (let n = 0; n < 6; n++) {
        const mat = new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xd46a3e, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending });
        const s = new THREE.Sprite(mat);
        s.scale.set(0.28, 0.28, 1);
        const baseX = (Math.random() - 0.5) * width * 0.8;
        const baseZ = (Math.random() - 0.5) * length * 0.8;
        s.position.set(baseX, totalHeight + 0.2, baseZ);
        s.userData = { t: Math.random(), mode: "rise", baseY: totalHeight + 0.2, baseX, height: 2.5 + Math.random(), seed: Math.random() * 10, speed: 0.5 + Math.random() * 0.5 };
        hg.add(s);
      }
    }
    heatGroupRef.current = hg;
    group.add(hg);
  }

  function recolorForView() {
    if (!data) return;
    const { classification, geometry } = data;
    const designParams = data.designParams[designMode];
    const shares = uaShares(designParams, geometry);
    const entries = [];
    hoverableRef.current.forEach((mesh) => {
      if (!mesh.material || !mesh.material.color) return;
      let target = null;
      if (mesh.userData.part === "wall") {
        const base = facadeColorFor("wall", view, classification, shares);
        if (view === "thermal") {
          const worldNormal = new THREE.Vector3(mesh.userData.face === "S" ? 0 : mesh.userData.face === "N" ? 0 : mesh.userData.face === "E" ? 1 : -1,
            0, mesh.userData.face === "S" ? 1 : mesh.userData.face === "N" ? -1 : 0);
          worldNormal.applyEuler(new THREE.Euler(0, buildingGroupRef.current.rotation.y, 0));
          const exposure = Math.max(0, worldNormal.dot(sunDirRef.current));
          const baseT = Math.max(0, Math.min(1, shares.wall / 0.55)) * 0.5 + 0.5;
          target = tempColor(Math.min(1, baseT + exposure * 0.35));
        } else target = base;
      } else if (mesh.userData.part === "roof") target = facadeColorFor("roof", view, classification, shares);
      else if (mesh.userData.part === "window") target = facadeColorFor("window", view, classification, shares);
      if (target !== null) entries.push({ mesh, from: mesh.material.color.getHex(), to: target });
    });
    transitionRef.current = { start: performance.now(), entries };
    buildAirflow();
    buildHeatFlow();
  }

  function updateSun(h) {
    const sunLight = sunLightRef.current, ambientLight = ambientLightRef.current, scene = sceneRef.current;
    if (!sunLight || !data) return;
    const frac = (h - 6) / 12;
    const daylight = frac >= 0 && frac <= 1;
    const elevation = daylight ? Math.sin(frac * Math.PI) : 0;
    const bearingDeg = 90 + Math.max(0, Math.min(1, frac)) * 180;
    const bearingRad = (bearingDeg * Math.PI) / 180;
    const R = 18, elevRad = elevation * 1.05;
    const dirX = Math.sin(bearingRad) * Math.cos(elevRad);
    const dirZ = Math.cos(bearingRad) * Math.cos(elevRad);
    const dirY = Math.sin(elevRad);
    sunLight.position.set(dirX * R, Math.max(0.6, dirY * R), dirZ * R);
    sunLight.target.position.set(0, 2, 0);
    sunLight.intensity = daylight ? 0.6 + 1.15 * elevation : 0.12;
    ambientLight.intensity = daylight ? 0.45 + 0.35 * elevation : 0.55;
    scene.background = new THREE.Color(daylight ? lerpColor(0x0d1826, 0x2c5a8c, elevation) : 0x060b14);
    scene.fog.color = scene.background;
    sunDirRef.current.set(dirX, Math.max(0.02, dirY), dirZ).normalize();
    if (sunMeshRef.current) {
      sunMeshRef.current.position.copy(sunLight.position);
      sunMeshRef.current.material.opacity = daylight ? 0.9 : 0.1;
    }
  }

  if (!data) return null;

  const { comparison, classification } = data;
  const modeLabel = designMode === "optimized" ? "Optimized" : "Baseline";
  const activeLabel = pinnedLabel || hoverLabel;

  return (
    <div className="bg-panel border border-line rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-3 py-2 border-b border-line flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-panel2 border border-line rounded-lg p-[3px] gap-[3px]">
          {["baseline", "optimized"].map((m) => (
            <button key={m} onClick={() => setDesignMode(m)}
              className={`px-3 py-1 rounded-md text-[11.5px] font-medium ${designMode === m ? "bg-amber text-ink" : "text-muted"}`}>
              {m === "baseline" ? "Baseline Design" : "Optimized Design"}
            </button>
          ))}
        </div>
        {comparison && (
          <div className="flex gap-3 text-[11.5px] font-mono">
            <span className="text-glacier">{comparison.nightTemperatureGain >= 0 ? "+" : ""}{comparison.nightTemperatureGain}°C at night</span>
            <span className="text-sage">-{comparison.energySavingPercent}% heat loss</span>
          </div>
        )}
      </div>

      <div ref={wrapRef} className="flex-1 relative min-h-[420px]">
        {activeLabel && (
          <div ref={tooltipRef} className="absolute pointer-events-none bg-[#0B1420] border border-amber text-amber text-[12px] px-2.5 py-1.5 rounded-md z-10 max-w-[240px] leading-snug shadow-lg">
            {activeLabel}
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          <span className="bg-[#0B1420]/85 border border-line text-[11px] text-muted px-2 py-1 rounded-md font-mono">
            {String(hour).padStart(2, "0")}:00 · {timeLabel(hour)}
          </span>
          <span className="bg-[#0B1420]/85 border border-line text-[11px] text-amber px-2 py-1 rounded-md font-mono">
            {modeLabel} · {classification?.label || classification?.key}
          </span>
        </div>

        {insights.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 pointer-events-none flex justify-center">
            <div className="bg-[#0B1420]/90 border border-glacier/40 text-glacier text-[12px] px-3 py-1.5 rounded-full max-w-[92%] text-center leading-snug">
              💡 {insights[insightIdx % insights.length]}
            </div>
          </div>
        )}

        <div className="absolute top-2 right-2 flex gap-1.5 text-[10.5px] font-mono pointer-events-none">
          <span className="bg-[#0B1420]/85 border border-line px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#3a7cd4" }} /> cool
          </span>
          <span className="bg-[#0B1420]/85 border border-line px-2 py-1 rounded-md flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#e0402e" }} /> hot
          </span>
        </div>
      </div>

      <div className="px-4 py-2.5 border-t border-line flex items-center gap-3 flex-wrap">
        <span className="font-mono text-[12.5px] text-muted whitespace-nowrap">
          {String(hour).padStart(2, "0")}:00 · indoor {(designMode === "optimized" ? data.simulation.optimizedIndoor : data.simulation.baselineIndoor)[hour]?.toFixed(1)}°C
        </span>
        <input type="range" min={0} max={23} step={1} value={hour} onChange={(e) => setHour(Number(e.target.value))} className="flex-1 accent-amber min-w-[120px]" />
        <button onClick={() => setPlaying((p) => !p)} className="font-mono text-[12.5px] text-muted whitespace-nowrap cursor-pointer hover:text-amber">
          {playing ? "⏸ pause" : "▶ animate"}
        </button>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)}
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${speed === s ? "border-amber text-amber" : "border-line text-muted"}`}>
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
