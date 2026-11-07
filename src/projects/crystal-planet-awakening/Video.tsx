import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {useLayoutEffect, type FC} from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const seeded = (seed: number) => {
  const value = Math.sin(seed * 127.1) * 43758.5453;
  return value - Math.floor(value);
};

const dustPositions = new Float32Array(
  Array.from({length: 170}, (_, index) => {
    const radius = 5 + seeded(index + 1) * 14;
    const angle = seeded(index + 101) * Math.PI * 2;
    const elevation = (seeded(index + 211) - 0.5) * 12;
    return [Math.cos(angle) * radius, elevation, Math.sin(angle) * radius];
  }).flat(),
);

const shardLayout: ReadonlyArray<readonly [number, number, number, number]> = Array.from(
  {length: 14},
  (_, index) => {
    const angle = (index / 14) * Math.PI * 2 + seeded(index + 301) * 0.45;
    const y = (seeded(index + 401) - 0.5) * 4.8;
    const radius = Math.sqrt(Math.max(0.2, 2.5 * 2.5 - y * y * 0.55));
    return [Math.cos(angle) * radius, y, Math.sin(angle) * radius, seeded(index + 501)] as const;
  },
);

const CameraRig: FC<{position: [number, number, number]}> = ({position}) => {
  const camera = useThree((state) => state.camera);

  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(0, 0.15, 0);
    if ('fov' in camera) {
      camera.fov = 34;
      camera.updateProjectionMatrix();
    }
  });

  return null;
};

const CrystalWorld: FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const seconds = frame / fps;
  const awaken = interpolate(frame, [1.5 * fps, 5.5 * fps], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const pulse = Math.sin(seconds * Math.PI * 1.6) * 0.5 + 0.5;
  const orbit = seconds * 0.23;
  const cameraDistance = interpolate(
    frame,
    [0, 5.5 * fps, 12 * fps],
    [10.5, 6.7, 8.2],
    {...clamp, easing: Easing.inOut(Easing.cubic)},
  );
  const cameraAngle = interpolate(frame, [0, 12 * fps], [-0.48, 0.5], clamp);

  return (
    <>
      <CameraRig
        position={[
          Math.sin(cameraAngle) * cameraDistance,
          interpolate(frame, [0, 12 * fps], [1.2, 2.25], clamp),
          Math.cos(cameraAngle) * cameraDistance,
        ]}
      />
      <fog attach="fog" args={['#030713', 11, 30]} />
      <ambientLight intensity={0.18} color="#7386b8" />
      <hemisphereLight args={['#bedcff', '#050713', 0.55]} />
      <directionalLight position={[-5, 7, 6]} intensity={2.5} color="#a9dfff" />
      <pointLight
        position={[0, 0, 0]}
        intensity={18 + awaken * 55 + pulse * awaken * 18}
        distance={15}
        color="#38dff2"
      />
      <pointLight position={[3, -2, 4]} intensity={16} distance={14} color="#7255ff" />

      <points rotation={[0, -orbit * 0.35, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#bfeeff" size={0.055} sizeAttenuation transparent opacity={0.7} />
      </points>

      <group rotation={[0.12 + Math.sin(seconds * 0.4) * 0.04, orbit, -0.18]}>
        <mesh scale={1.96 + awaken * 0.08} castShadow>
          <icosahedronGeometry args={[1, 3]} />
          <meshPhysicalMaterial
            color="#6fe7ff"
            roughness={0.08}
            metalness={0.08}
            transmission={0.72}
            thickness={1.25}
            ior={1.7}
            iridescence={0.8}
            iridescenceIOR={1.35}
            transparent
            opacity={0.86}
            flatShading
          />
        </mesh>
        <mesh scale={1.43 + awaken * 0.12 + pulse * awaken * 0.05}>
          <icosahedronGeometry args={[1, 2]} />
          <meshStandardMaterial
            color="#102f5a"
            emissive="#27d8ef"
            emissiveIntensity={0.45 + awaken * 2.8 + pulse * awaken}
            roughness={0.28}
            metalness={0.38}
            flatShading
          />
        </mesh>

        {[0, 1, 2].map((index) => (
          <mesh
            key={index}
            rotation={[
              Math.PI / 2 + index * 0.7,
              index * 1.15 + orbit * (index % 2 ? -0.7 : 0.5),
              index * 0.55,
            ]}
          >
            <torusGeometry args={[2.07 + index * 0.05, 0.018 + awaken * 0.018, 10, 128]} />
            <meshStandardMaterial
              color={index === 1 ? '#b873ff' : '#74f4ff'}
              emissive={index === 1 ? '#8a36ff' : '#27e5ff'}
              emissiveIntensity={1.8 + awaken * 5}
            />
          </mesh>
        ))}

        {shardLayout.map(([x, y, z, offset], index) => {
          const release = interpolate(
            frame,
            [(2.1 + offset * 1.7) * fps, (4.7 + offset * 1.4) * fps],
            [0, 1],
            {...clamp, easing: Easing.out(Easing.cubic)},
          );
          const outward = 1 + release * (0.65 + offset * 1.1);
          return (
            <mesh
              key={index}
              position={[x * outward, y * outward, z * outward]}
              rotation={[
                offset * 4 + seconds * (0.35 + offset),
                index + seconds * 0.4,
                offset * 2.4,
              ]}
              scale={0.15 + offset * 0.16}
              castShadow
            >
              <tetrahedronGeometry args={[1, 0]} />
              <meshPhysicalMaterial
                color={index % 3 === 0 ? '#bd77ff' : '#80efff'}
                roughness={0.12}
                metalness={0.25}
                transmission={0.45}
                emissive={index % 3 === 0 ? '#5723a5' : '#0c7f96'}
                emissiveIntensity={0.8 + awaken * 1.8}
              />
            </mesh>
          );
        })}
      </group>

      {[0, 1, 2].map((index) => (
        <mesh
          key={index}
          rotation={[
            Math.PI / 2 + index * 0.55,
            orbit * (index % 2 === 0 ? 0.7 : -0.45),
            index * 0.8,
          ]}
          scale={1 + index * 0.13}
        >
          <torusGeometry args={[3.4, 0.015, 8, 150]} />
          <meshBasicMaterial
            color={index === 1 ? '#7b54e9' : '#245777'}
            transparent
            opacity={0.28 + awaken * 0.22}
          />
        </mesh>
      ))}
    </>
  );
};

export const CrystalPlanetVideo: FC = () => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();

  return (
    <AbsoluteFill style={{backgroundColor: '#030713', overflow: 'hidden'}}>
      <ThreeCanvas
        width={width}
        height={height}
        shadows
        gl={{antialias: true, alpha: false}}
        style={{position: 'absolute', inset: 0}}
      >
        <CrystalWorld />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 42%, transparent 0 26%, rgba(3,7,19,.18) 56%, rgba(1,3,10,.86) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 80,
          right: 80,
          bottom: 136,
          textAlign: 'center',
          color: '#edfaff',
          fontFamily: 'Inter, Arial, sans-serif',
          opacity: interpolate(frame, [7.8 * fps, 9.2 * fps, 11.5 * fps, 12 * fps], [0, 1, 1, 0], {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
          translate: `0 ${interpolate(frame, [7.8 * fps, 9.2 * fps], [42, 0], clamp)}px`,
        }}
      >
        <div
          style={{
            fontSize: 94,
            lineHeight: 1.02,
            letterSpacing: -4,
            fontWeight: 700,
            textShadow: '0 0 32px rgba(53,226,255,.55)',
          }}
        >
          HÀNH TINH PHA LÊ
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 46,
            lineHeight: 1.2,
            letterSpacing: 11,
            fontWeight: 600,
            color: '#72ebff',
          }}
        >
          THỨC GIẤC
        </div>
      </div>
    </AbsoluteFill>
  );
};
