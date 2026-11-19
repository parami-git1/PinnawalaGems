import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Decal, Environment, MeshTransmissionMaterial, OrbitControls, useEnvironment, useGLTF, useTexture } from '@react-three/drei';
import { Color, ShaderChunk } from 'three';
import { GEM_STUDIO_ENVIRONMENT, GEM_STUDIO_MODEL } from './gemStudioAssets';

const STUDIO_BACKGROUND = new Color('#faf8f3');
const SPIN_RADIANS_PER_SECOND = 0.15;
const maskedBrandMaterials = new WeakMap();

function hideBrandFromTransmission(renderer, _scene, _camera, _geometry, material) {
  if (!renderer.getRenderTarget()) return;
  maskedBrandMaterials.set(material, { colorWrite: material.colorWrite, depthWrite: material.depthWrite });
  material.colorWrite = false;
  material.depthWrite = false;
}

function restoreBrandMaterial(_renderer, _scene, _camera, _geometry, material) {
  const saved = maskedBrandMaterials.get(material);
  if (!saved) return;
  material.colorWrite = saved.colorWrite;
  material.depthWrite = saved.depthWrite;
  maskedBrandMaterials.delete(material);
}

function SceneReady({ onReady }) {
  const frames = useRef(0);
  const callback = useRef(0);
  useEffect(() => () => cancelAnimationFrame(callback.current), []);
  useFrame(({ invalidate }) => {
    if (frames.current >= 3) return;
    frames.current += 1;
    if (frames.current === 3) callback.current = requestAnimationFrame(() => onReady?.());
    else invalidate();
  });
  return null;
}

function applyLogoSilhouette(shader) {
  // Preserve the supplied PNG's alpha artwork, with gold instead of dark ink.
  shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
    #ifdef USE_MAP
      diffuseColor.a *= texture2D(map, vMapUv).a;
    #endif
  `);
  // Reuse the artwork's alpha as a shallow bevel for the gold inlay.
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <bumpmap_pars_fragment>',
    ShaderChunk.bumpmap_pars_fragment.replaceAll(').x', ').a'),
  );
}

function Sapphire({ floating, mobile }) {
  const group = useRef(null);
  const { nodes } = useGLTF(GEM_STUDIO_MODEL);
  const logo = useTexture('/logo.png');
  const source = nodes.Object_2?.geometry || Object.values(nodes).find((node) => node?.geometry)?.geometry;
  const geometry = useMemo(() => {
    if (!source) throw new Error('The sapphire model is unavailable.');
    const clone = source.clone();
    const result = clone.index ? clone.toNonIndexed() : clone;
    if (result !== clone) clone.dispose();
    result.computeVertexNormals();
    result.computeBoundingBox();
    return result;
  }, [source]);

  useEffect(() => () => geometry.dispose(), [geometry]);
  const tableHeight = geometry.boundingBox.max.y;
  const tableRadius = Math.min(...Array.from({ length: geometry.attributes.position.count }, (_, index) => {
    const position = geometry.attributes.position;
    return Math.abs(position.getY(index) - tableHeight) < 0.0001 ? Math.hypot(position.getX(index), position.getZ(index)) || Infinity : Infinity;
  }));

  useFrame(({ clock }, delta) => {
    if (!group.current) return;
    group.current.position.y = floating ? Math.sin(clock.elapsedTime * 0.85) * 0.025 : 0;
    // Elapsed time keeps the spin equally smooth on fast and slower devices.
    if (floating) group.current.rotation.y += Math.min(delta, 0.25) * SPIN_RADIANS_PER_SECOND;
  }, -1);

  return <group ref={group} scale={1.02}>
    <mesh geometry={geometry} scale={1.3}>
      <MeshTransmissionMaterial backside backsideThickness={1.2} transmission={0.96} thickness={1.1} ior={1.77} color="#afc7ee" attenuationColor="#2459b9" attenuationDistance={2.15} roughness={0.045} metalness={0} clearcoat={0.5} clearcoatRoughness={0.07} envMapIntensity={1.2} chromaticAberration={0.001} anisotropicBlur={0} distortion={0} temporalDistortion={0} samples={mobile ? 4 : 6} resolution={mobile ? 256 : 512} backsideResolution={mobile ? 256 : 512} background={STUDIO_BACKGROUND} flatShading />
      <Decal onBeforeRender={hideBrandFromTransmission} onAfterRender={restoreBrandMaterial} depthTest renderOrder={3} polygonOffsetFactor={-2} position={[0, tableHeight + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.92, 0.54, 0.018]}>
        <meshPhysicalMaterial map={logo} bumpMap={logo} bumpScale={0.012} onBeforeCompile={applyLogoSilhouette} transparent alphaTest={0.12} depthWrite={false} polygonOffset polygonOffsetFactor={-2} color="#ffdd7d" emissive="#ffd05c" emissiveIntensity={0.22} metalness={0.78} roughness={0.19} envMapIntensity={2.35} clearcoat={0.55} clearcoatRoughness={0.1} />
      </Decal>
      {/* The signature gold ring sits inside the table facet, around the logo. */}
      <mesh onBeforeRender={hideBrandFromTransmission} onAfterRender={restoreBrandMaterial} position={[0, tableHeight + 0.009, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[tableRadius - 0.027, 0.012, 10, 96]} />
        <meshPhysicalMaterial color="#f5d16e" metalness={0.88} roughness={0.18} envMapIntensity={1.5} />
      </mesh>
    </mesh>
  </group>;
}

function Studio({ active, autoRotate, command, mobile, onReady }) {
  const controls = useRef(null);
  const { invalidate } = useThree();
  const environment = useEnvironment({ files: GEM_STUDIO_ENVIRONMENT });
  useEffect(() => { if (active) invalidate(); }, [active, autoRotate, invalidate]);
  useEffect(() => {
    if (!command || !controls.current) return;
    const control = controls.current;
    control.setAzimuthalAngle(control.getAzimuthalAngle() + command.azimuth);
    control.setPolarAngle(Math.min(1.25, Math.max(0.22, control.getPolarAngle() + command.polar)));
    control.update(); invalidate();
  }, [command, invalidate]);

  return <>
    <ambientLight intensity={0.19} />
    <directionalLight position={[3, 5, 4]} intensity={1.2} color="#fffaf2" />
    <directionalLight position={[-4, 3, 2]} intensity={1.1} color="#f0f5ff" />
    <directionalLight position={[2, 4, -4]} intensity={1.12} color="#fff6e7" />
    <Environment map={environment} />
    <Sapphire floating={active && autoRotate} mobile={mobile} />
    <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={false} autoRotate={false} enableDamping dampingFactor={0.075} minPolarAngle={0.22} maxPolarAngle={1.25} rotateSpeed={0.6} onChange={invalidate} />
    <SceneReady onReady={onReady} />
  </>;
}

export default function GemScene({ active, autoRotate, command, onReady }) {
  const coarse = useMemo(() => window.matchMedia('(pointer: coarse)').matches, []);
  return <Canvas className="pg-gem-studio__canvas" aria-hidden="true" camera={{ position: [0, 5.25, 2.1], fov: 33, near: 0.1, far: 50 }} dpr={coarse ? 1 : [1, 1.5]} frameloop={active ? autoRotate ? 'always' : 'demand' : 'never'} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }} fallback={null} onCreated={({ gl }) => { gl.setClearColor('#ffffff', 0); gl.toneMappingExposure = 1.12; }}>
    <Suspense fallback={null}><Studio active={active} autoRotate={autoRotate} command={command} mobile={coarse} onReady={onReady} /></Suspense>
  </Canvas>;
}

useGLTF.preload(GEM_STUDIO_MODEL);
useTexture.preload('/logo.png');
useEnvironment.preload({ files: GEM_STUDIO_ENVIRONMENT });
