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
  const stageCenterZ = -drtPackage.bStageLocalZFt;
  const deckHeight = ft(drtPackage.deckHeightFt);
  const upstageEdgeZ = stageCenterZ - drtPackage.deckDepthFt / 2;
  const prowHalfBase = drtPackage.prowBaseFt / 2;
  const prowFaceLength = Math.hypot(prowHalfBase, drtPackage.prowVertexDepthFt);
  const prowFaceAngle = Math.atan2(prowHalfBase, drtPackage.prowVertexDepthFt);
  const prowMidZ = upstageEdgeZ + drtPackage.prowVertexDepthFt / 2;

  return (
    <group>
      <mesh
        position={[0, deckHeight / 2, ft(stageCenterZ)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[ft(drtPackage.deckWidthFt), deckHeight, ft(drtPackage.deckDepthFt)]} />
        <meshStandardMaterial color="#1c2f3f" roughness={0.72} metalness={0.08} />
        <Edges color="#d69a52" />
      </mesh>

      <mesh
        position={[0, deckHeight / 2 + 0.01, ft(stageCenterZ + drtPackage.deckDepthFt / 2 + drtPackage.centerThrustLengthFt / 2)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
      >
        <boxGeometry args={[ft(drtPackage.centerThrustWidthFt), deckHeight, ft(drtPackage.centerThrustLengthFt)]} />
        <meshStandardMaterial color="#a96d33" roughness={0.5} />
      </mesh>

      {/* Current master placement. Render stays at AKB-controlled 5′ × 32′ dimensions;
          the editable Rev D master also stores scale 1.10, which remains an open conflict. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[ft(side * 23.8), deckHeight / 2 + 0.01, ft(stageCenterZ + 35.9)]}
          rotation={[0, side * 0.649, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(drtPackage.sideThrustWidthFt), deckHeight, ft(drtPackage.sideThrustLengthFt)]} />
          <meshStandardMaterial color="#81522c" roughness={0.58} />
        </mesh>
      ))}

      <group onPointerDown={(event) => stop(event, 'drt-bstage', onSelect)}>
        <mesh position={[0, deckHeight / 2, 0]}>
          <cylinderGeometry args={[ft(drtPackage.bStageDiameterFt / 2), ft(drtPackage.bStageDiameterFt / 2), deckHeight, 64]} />
          <meshStandardMaterial color="#c28542" roughness={0.5} />
          <Edges color="#f0d6ad" />
        </mesh>
        <mesh position={[ft(11.5), deckHeight / 2, ft(13)]} rotation={[0, 0.785, 0]}>
          <boxGeometry args={[ft(5.2), deckHeight, ft(17)]} />
          <meshStandardMaterial color="#c28542" roughness={0.5} />
        </mesh>
      </group>

      {/* Open-top half-cube prow: 50′ base on the US edge, vertex 25′ downstage. */}
      <group position={[0, deckHeight, 0]}>
        <mesh
          position={[-ft(prowHalfBase / 2), ft(drtPackage.prowHeightFt / 2), ft(prowMidZ)]}
          rotation={[0, prowFaceAngle, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(0.5), ft(drtPackage.prowHeightFt), ft(prowFaceLength)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.28} side={2} />
          <Edges color="#b98b44" />
        </mesh>
        <mesh
          position={[ft(prowHalfBase / 2), ft(drtPackage.prowHeightFt / 2), ft(prowMidZ)]}
          rotation={[0, -prowFaceAngle, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(0.5), ft(drtPackage.prowHeightFt), ft(prowFaceLength)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.28} side={2} />
          <Edges color="#b98b44" />
        </mesh>
      </group>
    </group>
  );
}
