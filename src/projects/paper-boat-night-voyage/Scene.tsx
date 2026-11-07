import {Bloom, EffectComposer} from '@react-three/postprocessing';
import {useThree} from '@react-three/fiber';
import {useLayoutEffect, useMemo, type FC} from 'react';
import {BufferGeometry, DoubleSide, Float32BufferAttribute} from 'three';
import {Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 91.713) * 43758.5453;
  return value - Math.floor(value);
};

const starPositions = new Float32Array(
  Array.from({length: 240}, (_, index) => {
    const angle = seeded(index + 1) * Math.PI * 2;
    const radius = 28 + seeded(index + 101) * 32;
    return [Math.cos(angle) * radius, 7 + seeded(index + 201) * 30, -18 + Math.sin(angle) * radius];
  }).flat(),
);

const makeGeometry = (positions: number[]) => {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
};

// Separate folded paper facets catch the moonlight differently, so this reads as
// origami instead of a plastic boat model.
const hullGeometry = makeGeometry([
  -1.65, 0, 1.05, 1.65, 0, 1.05, 0, -0.62, 1.35,
  1.65, 0, 1.05, 0, 0.08, -1.95, 0, -0.62, 1.35,
  0, 0.08, -1.95, -1.65, 0, 1.05, 0, -0.62, 1.35,
  -1.65, 0, 1.05, 0, 0.72, 0.35, 0, 0.08, -1.95,
  1.65, 0, 1.05, 0, 0.08, -1.95, 0, 0.72, 0.35,
]);

const foldGeometry = makeGeometry([
  -1.48, 0.03, 0.96, 1.48, 0.03, 0.96, 0, 0.78, 0.32,
  -1.48, 0.03, 0.96, 0, 0.78, 0.32, 0, 0.09, -1.72,
  1.48, 0.03, 0.96, 0, 0.09, -1.72, 0, 0.78, 0.32,
]);

const oceanVertexShader = `
  uniform float uTime;
  varying float vWave;
  varying vec2 vSurface;
  void main() {
    vec3 p = position;
    float broad = sin(p.x * 0.34 + uTime * 0.7) * 0.22;
    float crossing = sin(p.y * 0.42 - uTime * 0.92) * 0.16;
    float detail = sin((p.x + p.y) * 0.72 + uTime * 1.35) * 0.055;
    p.z += broad + crossing + detail;
    vWave = p.z;
    vSurface = p.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform float uTime;
  uniform float uDawn;
  varying float vWave;
  varying vec2 vSurface;
  void main() {
    vec3 night = vec3(0.008, 0.045, 0.09);
    vec3 blue = vec3(0.025, 0.16, 0.23);
    vec3 dawn = vec3(0.12, 0.20, 0.28);
    float crest = smoothstep(0.10, 0.42, vWave);
    float stripe = sin(vSurface.y * 2.1 + uTime * 1.6);
    float moonPath = exp(-abs(vSurface.x + 5.0) * 0.46) * (0.35 + 0.65 * stripe * stripe);
    vec3 water = mix(night, blue, crest);
    water = mix(water, dawn, uDawn * 0.7);
    water += vec3(0.18, 0.32, 0.40) * moonPath * 0.42;
    gl_FragColor = vec4(water, 0.98);
  }
`;

const CameraRig: FC<{position: [number, number, number]; target: [number, number, number]}> = ({position, target}) => {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    if ('fov' in camera) {
      camera.fov = 42;
      camera.updateProjectionMatrix();
    }
  });
  return null;
};

const PaperBoat: FC<{x: number; z: number; seconds: number}> = ({x, z, seconds}) => {
  const bob = Math.sin(seconds * 2.35) * 0.12;
  const roll = Math.sin(seconds * 1.7) * 0.055;
  const pitch = Math.sin(seconds * 2.1 + 0.7) * 0.035;

  return (
    <group position={[x, 0.32 + bob, z]} rotation={[pitch, 0.06, roll]} scale={0.82}>
      <mesh geometry={hullGeometry} castShadow>
        <meshStandardMaterial color="#e7ded0" roughness={0.76} metalness={0.02} side={DoubleSide} />
      </mesh>
      <mesh geometry={foldGeometry} castShadow position={[0, 0.03, 0]}>
        <meshStandardMaterial color="#fff8e9" roughness={0.68} metalness={0.01} side={DoubleSide} />
      </mesh>
      <pointLight position={[0, 0.52, 0.15]} intensity={1.8} distance={3.5} color="#ffd6a0" />
      <mesh position={[0, 0.54, 0.2]}>
        <sphereGeometry args={[0.055, 12, 12]} />
        <meshBasicMaterial color="#ffd6a0" />
      </mesh>
      {Array.from({length: 18}, (_, index) => {
        const side = index % 2 === 0 ? -1 : 1;
        const distance = 1.15 + Math.floor(index / 2) * 0.52;
        return (
          <mesh
            key={index}
            position={[side * (0.18 + distance * 0.055 + Math.sin(index * 2.1) * 0.05), -0.33 + Math.sin(seconds * 2 + index) * 0.025, distance]}
            scale={[0.07 + (index % 3) * 0.018, 0.016, 0.19]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial color="#a7e9f0" transparent opacity={Math.max(0.08, 0.48 - distance * 0.045)} />
          </mesh>
        );
      })}
    </group>
  );
};

const Lighthouse: FC<{seconds: number; dawn: number}> = ({seconds, dawn}) => {
  const beamAngle = -0.85 + Math.sin(seconds * 0.46) * 1.05;
  return (
    <group position={[7, -0.08, -24]}>
      <mesh position={[0, -0.6, 0]} scale={[4.3, 1.15, 3.45]} receiveShadow castShadow>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial color="#17252a" roughness={0.96} flatShading />
      </mesh>
      {[[-2.4, 0.2, 0.7, 1.4], [2.1, 0.05, 0.35, 1.1], [0.6, 0.18, -2.3, 0.85]].map(([x, y, z, scale], index) => (
        <mesh key={index} position={[x, y, z]} scale={[scale, scale * 1.8, scale]}>
          <coneGeometry args={[0.72, 1.65, 7]} />
          <meshStandardMaterial color="#233a35" roughness={0.9} flatShading />
        </mesh>
      ))}
      <mesh position={[0, 3.05, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.82, 6.2, 18]} />
        <meshStandardMaterial color="#d8c6ad" roughness={0.82} />
      </mesh>
      {[0.7, 2.45, 4.2].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <cylinderGeometry args={[0.825, 0.825, 0.42, 18]} />
          <meshStandardMaterial color="#8f3d35" roughness={0.75} />
        </mesh>
      ))}
      <mesh position={[0, 6.35, 0]}>
        <cylinderGeometry args={[0.74, 0.74, 0.72, 16]} />
        <meshStandardMaterial color="#18212a" roughness={0.35} metalness={0.45} />
      </mesh>
      <mesh position={[0, 6.72, 0]}>
        <coneGeometry args={[1.05, 0.8, 16]} />
        <meshStandardMaterial color="#732f2c" roughness={0.75} />
      </mesh>
      <mesh position={[0, 6.37, 0]}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshBasicMaterial color="#fff2bd" />
      </mesh>
      <pointLight position={[0, 6.37, 0]} intensity={24 - dawn * 7} distance={18} color="#ffdca0" />
      <group position={[0, 6.36, 0]} rotation={[0, beamAngle, Math.PI / 2]}>
        <mesh position={[0, -6, 0]}>
          <coneGeometry args={[2.6, 12, 32, 1, true]} />
          <meshBasicMaterial color="#fff0b0" transparent opacity={0.032} depthWrite={false} side={DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

export const NightVoyageScene: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const boatZ = interpolate(frame, [0, 30 * fps], [5.5, -20.8], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const boatX = -1.8 + Math.sin(seconds * 0.38) * 1.05 + interpolate(frame, [18 * fps, 30 * fps], [0, 2.4], clamp);
  const dawn = interpolate(frame, [21 * fps, 30 * fps], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const cameraPosition: [number, number, number] = [
    interpolate(frame, [0, 8 * fps, 21 * fps, 30 * fps], [7.8, 5.1, boatX + 4.2, 1.4], clamp),
    interpolate(frame, [0, 8 * fps, 21 * fps, 30 * fps], [5.8, 3.45, 2.15, 4.6], clamp),
    interpolate(frame, [0, 8 * fps, 21 * fps, 30 * fps], [13.5, 9.2, boatZ + 7.4, -8.2], clamp),
  ];
  const cameraTarget: [number, number, number] = [
    interpolate(frame, [0, 17 * fps, 30 * fps], [-1.1, boatX, 5.2], clamp),
    interpolate(frame, [0, 18 * fps, 24 * fps, 30 * fps], [0.25, 0.25, 2.65, 3.15], clamp),
    interpolate(frame, [0, 20 * fps, 30 * fps], [1.4, boatZ - 1.5, -23], clamp),
  ];
  const oceanUniforms = useMemo(() => ({uTime: {value: seconds}, uDawn: {value: dawn}}), [seconds, dawn]);

  return (
    <>
      <CameraRig position={cameraPosition} target={cameraTarget} />
      <fog attach="fog" args={[dawn > 0.5 ? '#294354' : '#06101f', 16, 58]} />
      <ambientLight intensity={0.25 + dawn * 0.4} color={dawn > 0.5 ? '#ffd1ad' : '#7ca5c7'} />
      <hemisphereLight args={[dawn > 0.5 ? '#ffd1a8' : '#b9ddff', '#06111a', 0.58 + dawn * 0.38]} />
      <directionalLight position={[-9, 12, 4]} intensity={1.35 + dawn} color={dawn > 0.5 ? '#ffb783' : '#b7d8ff'} castShadow />
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#e6f2ff" size={0.085} sizeAttenuation transparent opacity={1 - dawn * 0.8} />
      </points>
      <mesh position={[-7, 7.2, -22]}>
        <sphereGeometry args={[2.1, 48, 48]} />
        <meshStandardMaterial color="#e9eef4" emissive="#c8d9e9" emissiveIntensity={1.7 - dawn * 0.8} roughness={0.92} />
      </mesh>
      <pointLight position={[-7, 7.2, -17]} intensity={14 - dawn * 8} distance={40} color="#b8dbff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, -13]} receiveShadow>
        <planeGeometry args={[80, 82, 150, 150]} />
        <shaderMaterial vertexShader={oceanVertexShader} fragmentShader={oceanFragmentShader} uniforms={oceanUniforms} />
      </mesh>
      <PaperBoat x={boatX} z={boatZ} seconds={seconds} />
      <Lighthouse seconds={seconds} dawn={dawn} />
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.72} luminanceSmoothing={0.2} intensity={0.65} mipmapBlur />
      </EffectComposer>
    </>
  );
};
