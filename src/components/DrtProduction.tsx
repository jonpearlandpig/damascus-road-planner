import { Edges } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { drtPackage } from '../data/venues';
import { ft } from '../lib/units';

interface DrtProductionProps {
  onSelect: (id: string) => void;
}

function stop(event: ThreeEvent<PointerEvent>, id: string, onSelect: (id: string) => void) {
  event.stopPropagation();
  onSelect(id);
}

export function DrtProduction({ onSelect }: DrtProductionProps) {
  const showOriginZ = -drtPackage.bStageLocalZFt;
  const deckCenterZ = showOriginZ;
  const deckHeight = ft(drtPackage.deckHeightFt);

  return (
    <group>
      <mesh
        position={[0, deckHeight / 2, ft(deckCenterZ)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[ft(drtPackage.deckWidthFt), deckHeight, ft(drtPackage.deckDepthFt)]} />
        <meshStandardMaterial color="#1c2f3f" roughness={0.72} metalness={0.08} />
        <Edges color="#d69a52" />
      </mesh>

      <mesh
        position={[0, deckHeight / 2 + 0.01, ft(showOriginZ + drtPackage.deckDepthFt / 2 + drtPackage.centerThrustLengthFt / 2)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
      >
        <boxGeometry args={[ft(drtPackage.centerThrustWidthFt), deckHeight, ft(drtPackage.centerThrustLengthFt)]} />
        <meshStandardMaterial color="#a96d33" roughness={0.5} />
      </mesh>

      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[ft(side * 23.8), deckHeight / 2 + 0.01, ft(showOriginZ + 36)]}
          rotation={[0, side * 0.65, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(drtPackage.sideThrustWidthFt), deckHeight, ft(drtPackage.sideThrustLengthFt)]} />
          <meshStandardMaterial color="#81522c" roughness={0.58} />
        </mesh>
      ))}

      <mesh
        position={[0, ft(0.35), 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(event) => stop(event, 'drt-bstage', onSelect)}
      >
        <cylinderGeometry args={[ft(drtPackage.bStageDiameterFt / 2), ft(drtPackage.bStageDiameterFt / 2), ft(0.7), 64]} />
        <meshStandardMaterial color="#c28542" roughness={0.5} />
        <Edges color="#f0d6ad" />
      </mesh>

      <group position={[0, deckHeight, ft(showOriginZ - 5)]}>
        <mesh position={[-ft(12.5), ft(drtPackage.prowHeightFt / 2), ft(12.5)]}>
          <boxGeometry args={[ft(1), ft(drtPackage.prowHeightFt), ft(35.35)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.2} side={2} />
        </mesh>
        <mesh position={[ft(12.5), ft(drtPackage.prowHeightFt / 2), ft(12.5)]}>
          <boxGeometry args={[ft(1), ft(drtPackage.prowHeightFt), ft(35.35)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.2} side={2} />
        </mesh>
      </group>
    </group>
  );
}
