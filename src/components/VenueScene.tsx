import { useEffect } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, Text } from '@react-three/drei';
import { PCFShadowMap } from 'three';
import type { LayerKey, VenueTwin } from '../data/types';
import { FEET_TO_METERS, ft } from '../lib/units';
import { cameraPositionForMode, type PlannerAction } from '../planner/store';
import type { PlacedObject, PlannerObjectCategory, PlannerScene, ScenePosition } from '../planner/types';

const zoneColors = {
  dock: '#a86b36',
  parking: '#5e6872',
  boh: '#526e64',
  power: '#bc8c3e',
  egress: '#9f4e47',
  curtain: '#85728d',
  obstruction: '#8a4f4f',
} as const;

interface VenueSceneProps {
  venue: VenueTwin;
  plannerScene: PlannerScene;
  activeLayers: Set<string>;
  measurementArmed: boolean;
  onAction: (action: PlannerAction) => void;
}

function metersToPosition(point: { x: number; y: number; z: number }): ScenePosition {
  return { xFt: point.x / FEET_TO_METERS, yFt: Math.max(0, point.y / FEET_TO_METERS), zFt: point.z / FEET_TO_METERS };
}

function layerForCategory(category: PlannerObjectCategory): LayerKey {
  if (category === 'Truss' || category === 'Motors' || category === 'Lighting fixtures') return 'rigging';
  if (category === 'FOH' || category === 'Delay towers' || category === 'Audio arrays' || category === 'Subs' || category === 'Monitor world') return 'production';
  if (category === 'Camera platforms' || category === 'Video walls' || category === 'Projection surfaces') return 'audience';
  if (category === 'Low fog' || category === 'Hazers') return 'production';
  return 'production';
}

function CameraRig({ venue, scene }: { venue: VenueTwin; scene: PlannerScene }) {
  const { camera } = useThree();
  useEffect(() => {
    const position = cameraPositionForMode(scene.camera.mode, venue);
    camera.position.set(ft(position.xFt), ft(position.yFt), ft(position.zFt));
    camera.lookAt(0, ft(7), 0);
    camera.updateProjectionMatrix();
  }, [camera, scene.camera.mode, scene.camera.projection, venue]);

  return (
    <OrbitControls
      makeDefault
      autoRotate={scene.camera.mode === 'ORBIT_360'}
      autoRotateSpeed={0.9}
      enableRotate={scene.camera.mode !== 'PLAN'}
      minDistance={ft(20)}
      maxDistance={ft(360)}
      maxPolarAngle={Math.PI / 2.02}
      target={[0, ft(7), 0]}
    />
  );
}

function FloorGrid({ venue, plannerScene: scene, measurementArmed, onAction }: VenueSceneProps) {
  const { geometry } = venue;
  const halfWidth = ft(geometry.floorWidthFt / 2);
  const halfLength = ft(geometry.floorLengthFt / 2);

  function handleFloorPointer(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const position = metersToPosition(event.point);
    if (measurementArmed) {
      const hasStart = Boolean(scene.activeMeasurement?.start);
      const hasEnd = Boolean(scene.activeMeasurement?.end);
      onAction({ type: 'setMeasurementPoint', point: !hasStart || hasEnd ? 'start' : 'end', position: { ...position, yFt: 0 } });
      return;
    }
    onAction({ type: 'selectObject', id: 'venue-floor' });
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={handleFloorPointer} onPointerMove={(event) => {
        const selected = scene.objects.find((object) => object.id === scene.selectedObjectId);
        if (!selected || selected.locked || event.buttons !== 1 || measurementArmed) return;
        onAction({ type: 'moveObject', id: selected.id, position: metersToPosition(event.point) });
      }}>
        <planeGeometry args={[ft(geometry.floorWidthFt), ft(geometry.floorLengthFt)]} />
        <meshStandardMaterial color="#c8bda3" roughness={0.96} />
      </mesh>
      {scene.grid.visible && (
        <Grid args={[ft(geometry.floorWidthFt), ft(geometry.floorLengthFt)]} cellSize={ft(scene.grid.minorFt)} cellThickness={0.32} cellColor="#6f756f" sectionSize={ft(scene.grid.majorFt)} sectionThickness={0.9} sectionColor="#33495a" fadeDistance={ft(300)} infiniteGrid={false} position={[0, 0.012, 0]} />
      )}
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ft(5.5), ft(6), 64]} />
        <meshBasicMaterial color="#b06c34" />
      </mesh>
      <mesh position={[0, 0.055, 0]}>
        <boxGeometry args={[ft(0.35), ft(0.08), ft(geometry.floorLengthFt)]} />
        <meshBasicMaterial color="#df7f3e" />
      </mesh>
      <mesh position={[0, 0.058, 0]}>
        <boxGeometry args={[ft(geometry.floorWidthFt), ft(0.08), ft(0.35)]} />
        <meshBasicMaterial color="#2f6f78" />
      </mesh>
      <Text position={[ft(11), 0.07, ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.4)} color="#263b4b">X/Z 0</Text>
      <Text position={[halfWidth - ft(9), 0.07, ft(7)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color="#263b4b">+X</Text>
      <Text position={[ft(7), 0.07, halfLength - ft(12)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color="#263b4b">+Z</Text>
    </>
  );
}

function PlannerObjectMesh({ object, scene, onAction }: { object: PlacedObject; scene: PlannerScene; onAction: (action: PlannerAction) => void }) {
  if (!object.visible) return null;
  const selected = scene.selectedObjectId === object.id;
  const materialOpacity = object.locked ? 0.58 : selected ? 0.94 : 0.82;
  const position = [ft(object.position.xFt), ft(object.position.yFt), ft(object.position.zFt)] as const;
  const rotation = [0, object.rotationYDeg * Math.PI / 180, 0] as const;

  function select(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    onAction({ type: 'selectObject', id: object.id });
  }

  function drag(event: ThreeEvent<PointerEvent>) {
    if (event.buttons !== 1 || object.locked) return;
    event.stopPropagation();
    onAction({ type: 'moveObject', id: object.id, position: metersToPosition(event.point) });
  }

  const material = <meshStandardMaterial color={object.color} roughness={0.58} metalness={object.shape === 'truss' ? 0.18 : 0.05} transparent opacity={materialOpacity} />;

  return (
    <group position={position} rotation={rotation} onPointerDown={select} onPointerMove={drag}>
      {object.shape === 'cylinder' || object.shape === 'fog' ? (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[ft(object.dimensions.widthFt / 2), ft(object.dimensions.widthFt / 2), ft(object.dimensions.heightFt), 48]} />
          {material}
          {selected && <Edges color="#f7d36b" />}
        </mesh>
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[ft(object.dimensions.widthFt), ft(object.dimensions.heightFt), ft(object.dimensions.depthFt)]} />
          {material}
          {(selected || object.shape === 'truss') && <Edges color={selected ? '#f7d36b' : '#d69a52'} />}
        </mesh>
      )}
      {object.shape === 'fog' && object.atmosphere?.enabled && (
        <mesh position={[0, ft(0.08), 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[ft(object.atmosphere.coverageRadiusFt * object.atmosphere.output), 48]} />
          <meshBasicMaterial color={object.color} transparent opacity={0.16} />
        </mesh>
      )}
      {object.lighting?.shutterOpen && (
        <mesh position={[0, -ft(6), ft(9)]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[ft((object.lighting.zoomDeg ?? 20) / 4), ft(18), 32, 1, true]} />
          <meshBasicMaterial color={object.lighting.color} transparent opacity={0.12 * object.lighting.intensity} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ venue, plannerScene, activeLayers, measurementArmed, onAction }: VenueSceneProps) {
  const { geometry } = venue;
  const halfWidth = ft(geometry.floorWidthFt / 2);
  const halfLength = ft(geometry.floorLengthFt / 2);
  const lowSteelStatus = venue.geometryProvenance.lowSteelFt?.status;
  const canRenderLowSteel = geometry.lowSteelFt !== undefined && lowSteelStatus !== 'MISSING' && lowSteelStatus !== 'CONFLICT';
  const lowSteel = canRenderLowSteel ? ft(geometry.lowSteelFt!) : undefined;

  return (
    <>
      {plannerScene.camera.projection === 'ORTHOGRAPHIC'
        ? <OrthographicCamera makeDefault near={0.1} far={ft(1000)} zoom={plannerScene.camera.mode === 'PLAN' ? 6 : 4} />
        : <PerspectiveCamera makeDefault fov={42} near={0.1} far={ft(1000)} />}
      <CameraRig venue={venue} scene={plannerScene} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[20, 30, 15]} intensity={1.25} castShadow />
      <color attach="background" args={['#e8e0cf']} />
      <FloorGrid venue={venue} plannerScene={plannerScene} activeLayers={activeLayers} measurementArmed={measurementArmed} onAction={onAction} />
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
          {lowSteel !== undefined && (
            <mesh position={[0, lowSteel, 0]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'grid-plane' }); }}>
              <boxGeometry args={[ft(geometry.gridWidthFt ?? geometry.floorWidthFt * 0.82), ft(0.6), ft(geometry.gridDepthFt ?? geometry.floorLengthFt * 0.48)]} />
              <meshStandardMaterial color="#3d5261" transparent opacity={0.24} wireframe />
            </mesh>
          )}
          {geometry.centerhungBottomFt && (
            <mesh position={[0, ft(geometry.centerhungBottomFt + 8), 0]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'scoreboard' }); }}>
              <cylinderGeometry args={[ft((geometry.centerhungDiameterFt ?? 30) / 2), ft((geometry.centerhungDiameterFt ?? 30) / 2.4), ft(16), 12]} />
              <meshStandardMaterial color="#253b4c" roughness={0.5} metalness={0.25} />
            </mesh>
          )}
        </>
      )}
      {venue.zones.filter((zone) => activeLayers.has(zone.layer)).map((zone) => (
        <mesh key={zone.id} position={[ft(zone.xFt), ft((zone.heightFt ?? 1) / 2), ft(zone.zFt)]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: zone.id }); }}>
          <boxGeometry args={[ft(zone.widthFt), ft(zone.heightFt ?? 1), ft(zone.depthFt)]} />
          <meshStandardMaterial color={zoneColors[zone.kind]} transparent opacity={zone.kind === 'egress' ? 0.38 : 0.72} />
        </mesh>
      ))}
      {plannerScene.objects.filter((object) => activeLayers.has(layerForCategory(object.category))).map((object) => (
        <PlannerObjectMesh key={object.id} object={object} scene={plannerScene} onAction={onAction} />
      ))}
    </>
  );
}

export function VenueScene(props: VenueSceneProps) {
  const lowSteelStatus = props.venue.geometryProvenance.lowSteelFt?.status;
  const showRiggingHeightAlert = props.activeLayers.has('rigging') && (props.venue.geometry.lowSteelFt === undefined || lowSteelStatus === 'MISSING' || lowSteelStatus === 'CONFLICT');
  return (
    <div className="scene-shell" aria-label={`Interactive 3D planning model for ${props.venue.name}`}>
      <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.6]}>
        <Scene {...props} />
      </Canvas>
      <div className="scene-watermark">PLANNING MODEL / NOT VENUE CAD</div>
      {props.measurementArmed && <div className="scene-alert scene-alert--measure">Measure armed</div>}
      {showRiggingHeightAlert && <div className="scene-alert">Rigging height not source-safe for this venue</div>}
    </div>
  );
}
