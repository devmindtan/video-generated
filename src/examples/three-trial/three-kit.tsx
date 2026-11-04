import {useLayoutEffect, type FC, type ReactNode} from 'react';
import {useThree} from '@react-three/fiber';
import {ThreeCanvas} from '@remotion/three';
import {useVideoConfig} from 'remotion';
import {INK} from './kit';

// Camera placed from frame-derived values on every render (no useFrame, per the Remotion 3D rules).
export const Rig: FC<{position: [number, number, number]; target: [number, number, number]; fov?: number}> = ({position, target, fov = 35}) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(...position);
    camera.lookAt(...target);
    if ('fov' in camera && camera.fov !== fov) {camera.fov = fov;camera.updateProjectionMatrix();}
  });
  return null;
};

// Transparent canvas over the shared CSS backdrop; fog in the ink colour melts the ground into it.
export const Stage: FC<{children: ReactNode; fog?: [number, number]}> = ({children, fog = [12, 30]}) => {
  const {width, height} = useVideoConfig();
  return <ThreeCanvas width={width} height={height} shadows gl={{antialias: true, alpha: true}} style={{position: 'absolute', inset: 0}}>
    <fog attach="fog" args={[INK, ...fog]} />
    {children}
  </ThreeCanvas>;
};

// Warm key light with soft shadows plus a cool low fill, the same lighting idea for every trial scene.
export const Lights: FC<{keyLight?: [number, number, number]; intensity?: number}> = ({keyLight: keyPos = [-6, 9, 5], intensity = 2.4}) => <>
  <ambientLight intensity={.18} color="#9fb3a6" />
  <hemisphereLight args={['#f2e2bf', '#0d1411', .35]} />
  <directionalLight position={keyPos} intensity={intensity} color="#f3d9a4" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-.0004}
    shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
  <pointLight position={[0, 3, -6]} intensity={18} distance={22} color="#d9b56f" />
</>;

export const Ground: FC<{y?: number}> = ({y = 0}) => <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} receiveShadow>
  <planeGeometry args={[80, 80]} />
  <meshStandardMaterial color="#1b2420" roughness={.95} />
</mesh>;
