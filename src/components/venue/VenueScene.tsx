import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import type { LayerId, SceneObject, ShowPlacement, TourPackage, VenueTwin } from "@/lib/drt/types";
import { SceneObjectMesh } from "./SceneObjectMesh";
import { ft } from "@/lib/units";

interface Props {
  venue: VenueTwin;
  tourPackage: TourPackage;
  placement: ShowPlacement;
  activeLayers: Set<LayerId>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export function VenueScene({
  venue,
  tourPackage,
  placement,
  activeLayers,
  selectedId,
  onSelect,
}: Props) {
  const visibleVenue = venue.objects.filter((o) => activeLayers.has(o.layer));
  const visibleTour = tourPackage.objects.filter((o) => activeLayers.has(o.layer));

  return (
    <Canvas
      shadows={false}
      dpr={[1, 2]}
      camera={{ position: [ft(140), ft(80), ft(180)], fov: 32, near: 0.5, far: 2000 }}
      onPointerMissed={() => onSelect(null)}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#efe9d8"]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[60, 120, 40]} intensity={0.9} />
      <directionalLight position={[-80, 60, -40]} intensity={0.35} />

      <Suspense fallback={null}>
        <Grid
          args={[ft(400), ft(400)]}
          cellSize={ft(10)}
          cellThickness={0.6}
          cellColor="#c9c0a4"
          sectionSize={ft(50)}
          sectionThickness={1}
          sectionColor="#8a8064"
          fadeDistance={ft(600)}
          fadeStrength={1}
          infiniteGrid={false}
          position={[0, -0.005, 0]}
        />

        {visibleVenue.map((o) => (
          <SceneObjectMesh
            key={o.id}
            object={o}
            selected={selectedId === o.id}
            onSelect={() => onSelect(o.id)}
          />
        ))}

        {visibleTour.map((o) => (
          <SceneObjectMesh
            key={o.id}
            object={o as SceneObject}
            selected={selectedId === o.id}
            onSelect={() => onSelect(o.id)}
            parentOffset={placement.showOrigin}
            parentRotationY={placement.showRotationY}
          />
        ))}
      </Suspense>

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={ft(20)}
        maxDistance={ft(500)}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, ft(6), 0]}
      />
    </Canvas>
  );
}
