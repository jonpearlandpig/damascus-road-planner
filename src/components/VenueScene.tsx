import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls, Text } from '@react-three/drei';
import type { VenueTwin } from '../data/types';
import { ft } from '../lib/units';
import { DrtProduction } from './DrtProduction';

const zoneColors = {
  dock: '#a86b36', parking: '#5e6872', boh: '#526e64', power: '#bc8c3e',
  egress: '#9f4e47', curtain: '#85728d', obstruction: '#8a4f4f',
} as const;

interface VenueSceneProps {
  venue: VenueTwin;
  activeLayers: Set<string>;
  onSelect: (id: string) => void;
}

function Scene({ venue, activeLayers, onSelect }: VenueSceneProps) {
  const { geometry } = venue;
  const halfWidth = ft(geometry.floorWidthFt / 2);
  const halfLength = ft(geometry.floorLengthFt / 2);
  const lowSteel = ft(geometry.lowSteelFt ?? 80);

  return (
    <>
      <ambientLight intensity={0.72} />
      <directionalLight position={[20, 30, 15]} intensity={1.25} castShadow />
      <color attach="background" args={['#e8e0cf']} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={(event) => { event.stopPropagation(); onSelect('venue-floor'); }}>
        <planeGeometry args={[ft(geometry.floorWidthFt), ft(geometry.floorLengthFt)]} />
        <meshStandardMaterial color="#c8bda3" roughness={0.96} />
      </mesh>
      <Grid args={[ft(geometry.floorWidthFt), ft(geometry.floorLengthFt)]} cellSize={ft(5)} cellThickness={0.35} cellColor="#6f756f" sectionSize={ft(25)} sectionThickness={0.8} sectionColor="#33495a" fadeDistance={ft(260)} infiniteGrid={false} position={[0, 0.012, 0]} />
      <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]} onPointerDown={(event) => { event.stopPropagation(); onSelect('center-court'); }}>
        <ringGeometry args={[ft(5.5), ft(6), 64]} />
        <meshBasicMaterial color="#b06c34" />
      </mesh>
      <Text position={[0, 0.05, ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.5)} color="#263b4b">CENTER COURT</Text>
      {activeLayers.has('overview') && (
        <group>
          {[-1, 1].map((side) => (
            <mesh key={`side-${side}`} position={[side * (halfWidth + ft(9)), ft(10), 0]}>
              <boxGeometry args={[ft(16), ft(20), ft(geometry.floorLengthFt * 0.92)]} />
              <meshStandardMaterial color="#6d7b82" roughness={0.9} transparent opacity={0.52} />
            </mesh>
          ))}
          {[-1, 1].map((side) => (
            <mesh key={`end-${side}`} position={[0, ft(8), side * (halfLength + ft(9))]}>
              <boxGeometry args={[ft(geometry.floorWidthFt * 0.94), ft(16), ft(14)]} />
              <meshStandardMaterial color="#7d8584" roughness={0.92} transparent opacity={0.42} />
            </mesh>
          ))}
        </group>
      )}
      {activeLayers.has('rigging') && (
        <>
          <mesh position={[0, lowSteel, 0]} onPointerDown={(event) => { event.stopPropagation(); onSelect('grid-plane'); }}>
            <boxGeometry args={[ft(geometry.gridWidthFt ?? geometry.floorWidthFt * 0.82), ft(0.6), ft(geometry.gridDepthFt ?? geometry.floorLengthFt * 0.48)]} />
            <meshStandardMaterial color="#3d5261" transparent opacity={0.24} wireframe />
          </mesh>
          {geometry.centerhungBottomFt && (
            <mesh position={[0, ft(geometry.centerhungBottomFt + 8), 0]} onPointerDown={(event) => { event.stopPropagation(); onSelect('scoreboard'); }}>
              <cylinderGeometry args={[ft((geometry.centerhungDiameterFt ?? 30) / 2), ft((geometry.centerhungDiameterFt ?? 30) / 2.4), ft(16), 12]} />
              <meshStandardMaterial color="#253b4c" roughness={0.5} metalness={0.25} />
            </mesh>
          )}
        </>
      )}
      {venue.zones.filter((zone) => activeLayers.has(zone.layer)).map((zone) => (
        <mesh key={zone.id} position={[ft(zone.xFt), ft((zone.heightFt ?? 1) / 2), ft(zone.zFt)]} onPointerDown={(event) => { event.stopPropagation(); onSelect(zone.id); }}>
          <boxGeometry args={[ft(zone.widthFt), ft(zone.heightFt ?? 1), ft(zone.depthFt)]} />
          <meshStandardMaterial color={zoneColors[zone.kind]} transparent opacity={zone.kind === 'egress' ? 0.38 : 0.72} />
        </mesh>
      ))}
      {activeLayers.has('production') && <DrtProduction onSelect={onSelect} />}
      <OrbitControls makeDefault minDistance={ft(35)} maxDistance={ft(330)} maxPolarAngle={Math.PI / 2.04} target={[0, ft(7), ft(-20)]} />
    </>
  );
}

export function VenueScene(props: VenueSceneProps) {
  return (
    <div className="scene-shell" aria-label={`Interactive 3D planning model for ${props.venue.name}`}>
      <Canvas shadows camera={{ position: [ft(115), ft(95), ft(135)], fov: 42 }} dpr={[1, 1.6]}><Scene {...props} /></Canvas>
      <div className="scene-watermark">PLANNING MODEL · NOT VENUE CAD</div>
    </div>
  );
}
