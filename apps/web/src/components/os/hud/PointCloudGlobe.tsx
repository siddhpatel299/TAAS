import { useRef, useEffect, useState, useMemo, useLayoutEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const WORLD_MAP_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Blue_Marble_2002.png/1024px-Blue_Marble_2002.png';

/** Sample world map texture to get land positions on a sphere */
function generateLandPositions(
  imageUrl: string,
  sampleDensity: number = 512
): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = Math.min(img.width, img.height, sampleDensity);
      canvas.width = size;
      canvas.height = Math.floor(size / 2);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const positions: number[] = [];
      const radius = 1;
      const cols = canvas.width;
      const rows = canvas.height;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = (row * cols + col) * 4;
          const r = id.data[i];
          const g = id.data[i + 1];
          const b = id.data[i + 2];
          // Land: not predominantly blue (oceans are blue)
          const isLand = r + g > b * 1.35;
          if (isLand) {
            const u = col / cols;
            const v = 1 - row / rows;
            const lon = (u - 0.5) * 2 * Math.PI;
            const lat = (v - 0.5) * Math.PI;
            const x = radius * Math.cos(lat) * Math.cos(lon);
            const y = radius * Math.sin(lat);
            const z = radius * Math.cos(lat) * Math.sin(lon);
            positions.push(x, y, z);
          }
        }
      }
      resolve(new Float32Array(positions));
    };
    img.onerror = () => reject(new Error('Failed to load world map'));
    img.src = imageUrl;
  });
}

/** Create a soft circular glow texture for points */
function createPointTexture(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.2, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(0.7, 'rgba(255,255,255,0.15)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// Neon cyan/blue for HUD
const POINT_COLOR = new THREE.Color(0x00ffff);

function PointCloud() {
  const meshRef = useRef<THREE.Points>(null);
  const [positions, setPositions] = useState<Float32Array | null>(null);

  useEffect(() => {
    generateLandPositions(WORLD_MAP_URL, 720).then(setPositions);
  }, []);

  const geometry = useMemo(() => {
    if (!positions) return null;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.computeBoundingSphere();
    return geo;
  }, [positions]);

  const pointTexture = useMemo(() => createPointTexture(), []);

  const material = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.008,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      color: POINT_COLOR,
      map: pointTexture,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, [pointTexture]);

  if (!geometry) return null;

  return (
    <points ref={meshRef} geometry={geometry} material={material} />
  );
}

/** Fresnel atmosphere glow - brighter at edges for spherical depth */
const fresnelVertex = `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
const fresnelFragment = `
  uniform vec3 color;
  uniform float power;
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  void main() {
    float fresnel = pow(1.0 - abs(dot(normalize(vViewPosition), vNormal)), power);
    gl_FragColor = vec4(color, fresnel * 0.12);
  }
`;

function AtmosphereGlow() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0x00ffff) },
          power: { value: 2.5 },
        },
        vertexShader: fresnelVertex,
        fragmentShader: fresnelFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  return (
    <mesh material={material}>
      <sphereGeometry args={[1.03, 48, 48]} />
    </mesh>
  );
}

function GlobeControls() {
  const { camera, gl } = useThree();
  const controlsRef = useRef<{ update: () => void; dispose: () => void } | null>(null);

  useLayoutEffect(() => {
    import('three/examples/jsm/controls/OrbitControls.js').then(({ OrbitControls }) => {
      const controls = new OrbitControls(camera, gl.domElement);
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.5;
      controls.minPolarAngle = Math.PI * 0.4;
      controls.maxPolarAngle = Math.PI * 0.6;
      controlsRef.current = controls;
    });
    return () => {
      controlsRef.current?.dispose();
      controlsRef.current = null;
    };
  }, [camera, gl]);

  useFrame(() => {
    controlsRef.current?.update();
  });

  return null;
}

/** Rough region from lat/lon (degrees) */
function getRegionFromCoords(lat: number, lon: number): string {
  const latD = (lat * 180) / Math.PI;
  const lonD = (lon * 180) / Math.PI;
  if (latD > 60) return 'Arctic';
  if (latD < -60) return 'Antarctic';
  if (latD > 20 && lonD > 60 && lonD < 150) return 'Asia-Pacific';
  if (latD > 20 && lonD > -20 && lonD < 60) return 'Asia / Middle East';
  if (latD > 35 && lonD > -10 && lonD < 40) return 'Europe';
  if (latD > 15 && latD < 35 && lonD > -100 && lonD < -60) return 'North America';
  if (latD > -55 && latD < 15 && lonD > -85 && lonD < -35) return 'South America';
  if (latD > -35 && latD < 35 && lonD > -20 && lonD < 55) return 'Africa';
  if (latD > -10 && latD < 50 && lonD > 100 && lonD < 150) return 'East Asia';
  if (latD > -40 && latD < 0 && lonD > 110 && lonD < 155) return 'Australia';
  return 'Ocean';
}

function GlobeScene({ onSelectRegion }: { onSelectRegion?: (region: string, lat: number, lon: number) => void }) {
  const handleClick = useCallback(
    (e: { point: { x: number; y: number; z: number }; stopPropagation?: () => void }) => {
      if (!onSelectRegion) return;
      e.stopPropagation?.();
      const { x, y, z } = e.point;
      const lat = Math.asin(Math.max(-1, Math.min(1, y)));
      const lon = Math.atan2(z, x);
      const region = getRegionFromCoords(lat, lon);
      const latD = ((lat * 180) / Math.PI).toFixed(1);
      const lonD = ((lon * 180) / Math.PI).toFixed(1);
      onSelectRegion(region, parseFloat(latD), parseFloat(lonD));
    },
    [onSelectRegion]
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color={0x00ffff} />
      <group>
        <PointCloud />
        <AtmosphereGlow />
        {onSelectRegion && (
          <mesh onClick={handleClick}>
            <sphereGeometry args={[1.02, 32, 32]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        )}
      </group>
      <GlobeControls />
    </>
  );
}

/** Live timezone / coordinates label */
function GlobeLabel() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const offset = -time.getTimezoneOffset() / 60;
  const tzStr = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div
      className="mt-2 px-2 py-1 font-mono text-[9px] tracking-wider pointer-events-none shrink-0"
      style={{
        color: 'rgba(0,255,255,0.8)',
        textShadow: '0 0 8px rgba(0,255,255,0.3)',
        background: 'rgba(3,8,14,0.6)',
        border: '1px solid rgba(0,255,255,0.2)',
      }}
    >
      {tzStr} | {timeStr}
    </div>
  );
}

export function PointCloudGlobe() {
  const [selectedRegion, setSelectedRegion] = useState<{ region: string; lat: number; lon: number } | null>(null);

  const handleSelectRegion = useCallback((region: string, lat: number, lon: number) => {
    setSelectedRegion({ region, lat, lon });
  }, []);

  useEffect(() => {
    if (!selectedRegion) return;
    const t = setTimeout(() => setSelectedRegion(null), 3000);
    return () => clearTimeout(t);
  }, [selectedRegion]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center z-[1] pointer-events-none"
    >
      <div
        className="relative w-[min(55vmin,420px)] h-[min(55vmin,420px)] rounded-full overflow-hidden shrink-0 pointer-events-auto"
        style={{
          border: '2px solid rgba(0,255,255,0.25)',
          boxShadow: `
            0 0 60px rgba(0,255,255,0.15),
            0 0 120px rgba(0,200,255,0.08),
            inset 0 0 40px rgba(0,255,255,0.03)
          `,
        }}
      >
        <Canvas
          gl={{ antialias: true, alpha: true }}
          camera={{ position: [0, 0, 2.2], fov: 45 }}
          style={{ background: 'transparent' }}
        >
          <GlobeScene onSelectRegion={handleSelectRegion} />
        </Canvas>
        {selectedRegion && (
          <div
            className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-1 font-mono text-[8px] tracking-wider pointer-events-none z-10"
            style={{
              color: 'rgba(0,255,255,0.95)',
              background: 'rgba(3,8,14,0.9)',
              border: '1px solid rgba(0,255,255,0.3)',
            }}
          >
            {selectedRegion.region} | LAT {selectedRegion.lat.toFixed(1)}° | LON {selectedRegion.lon.toFixed(1)}°
          </div>
        )}
        {/* Coordinate crosshair / reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <div className="w-px h-full bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
          <div className="absolute w-full h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
        </div>
      </div>
      <GlobeLabel />
    </div>
  );
}


