import { Edges } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { drtPackage } from '../data/venues';
import { deriveDrtProductionGeometry } from '../geometry/drt';
import { ft } from '../lib/units';

interface DrtProductionProps {
  onSelect: (id: string) => void;
}

function stop(event: ThreeEvent<PointerEvent>, id: string, onSelect: (id: string) => void) {
  event.stopPropagation();
  onSelect(id);
}

export function DrtProduction({ onSelect }: DrtProductionProps) {
  const geometry = deriveDrtProductionGeometry(drtPackage);
  const deckHeight = ft(geometry.deckHeightFt);

  return (
    <group>
      <mesh
        position={[0, deckHeight / 2, ft(geometry.stageCenterZFt)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[ft(drtPackage.deckWidthFt), deckHeight, ft(drtPackage.deckDepthFt)]} />
        <meshStandardMaterial color="#1c2f3f" roughness={0.72} metalness={0.08} />
        <Edges color="#d69a52" />
      </mesh>

      <mesh
        position={[0, deckHeight / 2 + 0.01, ft(geometry.stageCenterZFt + drtPackage.deckDepthFt / 2 + drtPackage.centerThrustLengthFt / 2)]}
        onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
      >
        <boxGeometry args={[ft(drtPackage.centerThrustWidthFt), deckHeight, ft(drtPackage.centerThrustLengthFt)]} />
        <meshStandardMaterial color="#a96d33" roughness={0.5} />
      </mesh>

      {/* Current master placement. Render stays at AKB-controlled 5′ × 32′ dimensions;
          the editable Rev D master also stores scale 1.10, which remains an open conflict. */}
      {geometry.sideThrusts.map((thrust) => (
        <mesh
          key={thrust.side}
          position={[ft(thrust.xFt), deckHeight / 2 + 0.01, ft(thrust.zFt)]}
          rotation={[0, thrust.rotationYRad, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(drtPackage.sideThrustWidthFt), deckHeight, ft(drtPackage.sideThrustLengthFt)]} />
          <meshStandardMaterial color="#81522c" roughness={0.58} />
        </mesh>
      ))}

      <group onPointerDown={(event) => stop(event, 'drt-bstage', onSelect)}>
        <mesh position={[0, deckHeight / 2, ft(geometry.bStageCenterZFt)]}>
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
          position={[-ft(geometry.prowHalfBaseFt / 2), ft(drtPackage.prowHeightFt / 2), ft(geometry.prowMidZFt)]}
          rotation={[0, geometry.prowFaceAngleRad, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(0.5), ft(drtPackage.prowHeightFt), ft(geometry.prowFaceLengthFt)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.28} side={2} />
          <Edges color="#b98b44" />
        </mesh>
        <mesh
          position={[ft(geometry.prowHalfBaseFt / 2), ft(drtPackage.prowHeightFt / 2), ft(geometry.prowMidZFt)]}
          rotation={[0, -geometry.prowFaceAngleRad, 0]}
          onPointerDown={(event) => stop(event, 'drt-stage', onSelect)}
        >
          <boxGeometry args={[ft(0.5), ft(drtPackage.prowHeightFt), ft(geometry.prowFaceLengthFt)]} />
          <meshStandardMaterial color="#d7c8a5" transparent opacity={0.28} side={2} />
          <Edges color="#b98b44" />
        </mesh>
      </group>
    </group>
  );
}
