import { useEffect } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Grid, OrbitControls, OrthographicCamera, PerspectiveCamera, Text } from '@react-three/drei';
import { PCFShadowMap } from 'three';
import type { LayerKey, VenueTwin } from '../data/types';
import { drtPackage } from '../data/venues';
import { deriveDrtProductionGeometry } from '../geometry/drt';
import { FEET_TO_METERS, ft } from '../lib/units';
import { cameraPositionForMode, type PlannerAction } from '../planner/store';
import type { PlacedObject, PlannerObjectCategory, PlannerScene, ScenePosition } from '../planner/types';
import { polygonDimensions } from '../venue-twins/geometryRules';
import { venueNativeTwinForSlug } from '../venue-twins/records';
import type { BoxGeometry, VenueNativeGeometry } from '../venue-twins/types';

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

function floorDimensions(twin: VenueNativeGeometry | undefined) {
  return twin?.floor?.boundary ? polygonDimensions(twin.floor.boundary.points) : undefined;
}

function NativeFloor({ twin, plannerScene: scene, activeLayers, measurementArmed, onAction }: VenueSceneProps & { twin?: VenueNativeGeometry }) {
  const dimensions = floorDimensions(twin);
  if (!twin?.floor?.boundary || !dimensions || !activeLayers.has('floor')) return null;
  const { widthFt, lengthFt } = dimensions;
  const halfWidth = ft(widthFt / 2);
  const halfLength = ft(lengthFt / 2);
  const isReference = twin.floor.renderState === 'REFERENCE_ONLY';
  const floorColor = isReference ? '#b7afa0' : '#c8bda3';

  function handleFloorPointer(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    const position = metersToPosition(event.point);
    if (measurementArmed) {
      const hasStart = Boolean(scene.activeMeasurement?.start);
      const hasEnd = Boolean(scene.activeMeasurement?.end);
      onAction({ type: 'setMeasurementPoint', point: !hasStart || hasEnd ? 'start' : 'end', position: { ...position, yFt: 0 } });
      return;
    }
    onAction({ type: 'selectObject', id: 'venue-native-floor' });
  }

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow onPointerDown={handleFloorPointer} onPointerMove={(event) => {
        const selected = scene.objects.find((object) => object.id === scene.selectedObjectId);
        if (!selected || selected.locked || event.buttons !== 1 || measurementArmed) return;
        onAction({ type: 'moveObject', id: selected.id, position: metersToPosition(event.point) });
      }}>
        <planeGeometry args={[ft(widthFt), ft(lengthFt)]} />
        <meshStandardMaterial color={floorColor} roughness={0.96} transparent opacity={isReference ? 0.38 : 0.82} />
      </mesh>
      {scene.grid.visible && (
        <Grid args={[ft(widthFt), ft(lengthFt)]} cellSize={ft(scene.grid.minorFt)} cellThickness={0.32} cellColor="#6f756f" sectionSize={ft(scene.grid.majorFt)} sectionThickness={0.9} sectionColor="#33495a" fadeDistance={ft(300)} infiniteGrid={false} position={[0, 0.012, 0]} />
      )}
      <mesh position={[0, 0.045, -halfLength]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-floor' }); }}>
        <boxGeometry args={[ft(widthFt), ft(0.08), ft(0.55)]} />
        <meshBasicMaterial color={isReference ? '#7f7569' : '#263b4b'} transparent opacity={isReference ? 0.62 : 1} />
      </mesh>
      <mesh position={[0, 0.045, halfLength]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-floor' }); }}>
        <boxGeometry args={[ft(widthFt), ft(0.08), ft(0.55)]} />
        <meshBasicMaterial color={isReference ? '#7f7569' : '#263b4b'} transparent opacity={isReference ? 0.62 : 1} />
      </mesh>
      <mesh position={[-halfWidth, 0.045, 0]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-floor' }); }}>
        <boxGeometry args={[ft(0.55), ft(0.08), ft(lengthFt)]} />
        <meshBasicMaterial color={isReference ? '#7f7569' : '#263b4b'} transparent opacity={isReference ? 0.62 : 1} />
      </mesh>
      <mesh position={[halfWidth, 0.045, 0]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-floor' }); }}>
        <boxGeometry args={[ft(0.55), ft(0.08), ft(lengthFt)]} />
        <meshBasicMaterial color={isReference ? '#7f7569' : '#263b4b'} transparent opacity={isReference ? 0.62 : 1} />
      </mesh>
      {activeLayers.has('centerlines') && (
        <>
          <mesh position={[0, 0.058, 0]}>
            <boxGeometry args={[ft(0.35), ft(0.08), ft(lengthFt)]} />
            <meshBasicMaterial color="#df7f3e" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[ft(widthFt), ft(0.08), ft(0.35)]} />
            <meshBasicMaterial color="#2f6f78" />
          </mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ft(5.5), ft(6), 64]} />
            <meshBasicMaterial color="#b06c34" />
          </mesh>
          <Text position={[ft(11), 0.07, ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.4)} color="#263b4b">DERIVED 0/0</Text>
          <Text position={[halfWidth - ft(9), 0.07, ft(7)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color="#263b4b">+X</Text>
          <Text position={[ft(7), 0.07, halfLength - ft(12)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color="#263b4b">+Z</Text>
        </>
      )}
      <Text position={[0, 0.08, -halfLength + ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color={isReference ? '#7e3530' : '#315e4d'}>
        {isReference ? 'REFERENCE FLOOR' : 'DERIVED SOURCE FLOOR'}
      </Text>
    </>
  );
}

function NativeRigging({ twin, activeLayers, onAction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; onAction: (action: PlannerAction) => void }) {
  if (!twin?.rigging || !activeLayers.has('rigging-grid')) return null;
  const lowSteelFt = typeof twin.rigging.lowSteel?.value === 'number' ? twin.rigging.lowSteel.value : undefined;
  const floor = floorDimensions(twin);
  const grid = twin.rigging.gridBoundary ? polygonDimensions(twin.rigging.gridBoundary.points) : floor;
  if (lowSteelFt === undefined || !grid) return null;
  const referenceOnly = twin.rigging.renderState === 'REFERENCE_ONLY' || !twin.rigging.gridBoundary;
  return (
    <group onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-rigging' }); }}>
      <mesh position={[0, ft(lowSteelFt), 0]}>
        <boxGeometry args={[ft(grid.widthFt), ft(0.5), ft(grid.lengthFt)]} />
        <meshStandardMaterial color="#3d5261" transparent opacity={referenceOnly ? 0.12 : 0.24} wireframe />
      </mesh>
      <Text position={[0, ft(lowSteelFt + 3), 0]} fontSize={ft(2.6)} color={referenceOnly ? '#755b32' : '#2f516b'}>
        {referenceOnly ? 'LOW STEEL REFERENCE' : 'RIGGING GRID'}
      </Text>
    </group>
  );
}

function boxDimension(value: BoxGeometry['dimensions'][keyof BoxGeometry['dimensions']]): number | undefined {
  return typeof value?.value === 'number' ? value.value : undefined;
}

function NativeCenterHung({ twin, activeLayers, onAction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; onAction: (action: PlannerAction) => void }) {
  const centerHung = twin?.obstructions?.centerHung;
  const floor = floorDimensions(twin);
  if (!centerHung || !floor || !activeLayers.has('center-hung')) return null;
  const widthFt = boxDimension(centerHung.dimensions.widthFt);
  const depthFt = boxDimension(centerHung.dimensions.depthFt);
  const lowPointFt = typeof centerHung.lowPoint?.value === 'number' ? centerHung.lowPoint.value : undefined;
  if (widthFt === undefined || depthFt === undefined) return null;
  const heightFt = boxDimension(centerHung.dimensions.heightFt) ?? 0.8;
  const yFt = lowPointFt === undefined ? 8 : lowPointFt + heightFt / 2;
  const partial = lowPointFt === undefined || centerHung.renderState === 'REFERENCE_ONLY' || !centerHung.dimensions.heightFt;
  return (
    <group onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-centerhung' }); }}>
      <mesh position={[0, ft(yFt), 0]}>
        <boxGeometry args={[ft(widthFt), ft(heightFt), ft(depthFt)]} />
        <meshStandardMaterial color="#253b4c" roughness={0.5} metalness={0.25} transparent opacity={partial ? 0.24 : 0.58} />
        <Edges color={partial ? '#a95a52' : '#f7d36b'} />
      </mesh>
      <Text position={[0, ft(yFt + heightFt / 2 + 3), 0]} fontSize={ft(2.2)} color={partial ? '#a95a52' : '#253b4c'}>{partial ? 'PARTIAL SOURCE CENTER-HUNG' : 'CENTER-HUNG SOURCE'}</Text>
    </group>
  );
}

function NativeStageReference({ twin, activeLayers, onAction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; onAction: (action: PlannerAction) => void }) {
  const floor = floorDimensions(twin);
  const stageBounds = twin?.stageReference?.maximumStageBounds ? polygonDimensions(twin.stageReference.maximumStageBounds.points) : undefined;
  if (!twin?.stageReference || !floor || !activeLayers.has('stage-reference')) return null;
  return (
    <group onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-floor' }); }}>
      <mesh position={[0, 0.09, -ft(floor.lengthFt / 2) + ft(1.4)]}>
        <boxGeometry args={[ft(floor.widthFt), ft(0.08), ft(2.8)]} />
        <meshBasicMaterial color="#a8643b" transparent opacity={0.75} />
      </mesh>
      {stageBounds && (
        <mesh position={[0, 0.1, -ft(floor.lengthFt / 2) + ft(stageBounds.lengthFt / 2)]}>
          <boxGeometry args={[ft(stageBounds.widthFt), ft(0.1), ft(stageBounds.lengthFt)]} />
          <meshBasicMaterial color="#b47b42" transparent opacity={0.22} />
        </mesh>
      )}
      <Text position={[0, 0.11, -ft(floor.lengthFt / 2) + ft(7)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.1)} color="#7a3c2d">STAGE REFERENCE / DERIVED</Text>
    </group>
  );
}

function FitOverlay({ twin, activeLayers, onAction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; onAction: (action: PlannerAction) => void }) {
  const floor = floorDimensions(twin);
  if (!twin || !floor || !activeLayers.has('fit-overlay')) return null;
  const drt = deriveDrtProductionGeometry(drtPackage);
  const requiredWidth = drtPackage.deckWidthFt;
  const minZ = drt.upstageEdgeZFt;
  const maxZ = drtPackage.bStageDiameterFt / 2;
  const requiredLength = maxZ - minZ;
  const centerZ = (minZ + maxZ) / 2;
  const color = twin.drtFit.status === 'BLOCKED' ? '#a95a52' : twin.drtFit.status === 'PASS' ? '#638f7b' : '#bc9b64';
  return (
    <group onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: 'venue-native-fit' }); }}>
      <mesh position={[0, 0.13, ft(centerZ)]}>
        <boxGeometry args={[ft(requiredWidth), ft(0.12), ft(requiredLength)]} />
        <meshBasicMaterial color={color} transparent opacity={0.18} />
      </mesh>
      <Text position={[0, 0.16, ft(centerZ)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.4)} color={color}>{twin.drtFit.status}</Text>
    </group>
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

function isObjectLayerVisible(object: PlacedObject, activeLayers: Set<string>): boolean {
  if (object.id.startsWith('drt-')) return activeLayers.has('drt-production');
  return activeLayers.has('reference-geometry') || activeLayers.has(layerForCategory(object.category));
}

function Scene({ venue, plannerScene, activeLayers, measurementArmed, onAction }: VenueSceneProps) {
  const twin = venueNativeTwinForSlug(venue.slug);
  return (
    <>
      {plannerScene.camera.projection === 'ORTHOGRAPHIC'
        ? <OrthographicCamera makeDefault near={0.1} far={ft(1000)} zoom={plannerScene.camera.mode === 'PLAN' ? 6 : 4} />
        : <PerspectiveCamera makeDefault fov={42} near={0.1} far={ft(1000)} />}
      <CameraRig venue={venue} scene={plannerScene} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[20, 30, 15]} intensity={1.25} castShadow />
      <color attach="background" args={['#e8e0cf']} />
      <NativeFloor venue={venue} twin={twin} plannerScene={plannerScene} activeLayers={activeLayers} measurementArmed={measurementArmed} onAction={onAction} />
      <NativeStageReference twin={twin} activeLayers={activeLayers} onAction={onAction} />
      <NativeRigging twin={twin} activeLayers={activeLayers} onAction={onAction} />
      <NativeCenterHung twin={twin} activeLayers={activeLayers} onAction={onAction} />
      <FitOverlay twin={twin} activeLayers={activeLayers} onAction={onAction} />
      {venue.zones.filter((zone) => (activeLayers.has('loading') && zone.layer === 'logistics') || (activeLayers.has('obstructions') && zone.kind === 'obstruction')).map((zone) => (
        <mesh key={zone.id} position={[ft(zone.xFt), ft((zone.heightFt ?? 1) / 2), ft(zone.zFt)]} onPointerDown={(event) => { event.stopPropagation(); onAction({ type: 'selectObject', id: zone.id }); }}>
          <boxGeometry args={[ft(zone.widthFt), ft(zone.heightFt ?? 1), ft(zone.depthFt)]} />
          <meshStandardMaterial color={zoneColors[zone.kind]} transparent opacity={zone.kind === 'egress' ? 0.38 : 0.72} />
        </mesh>
      ))}
      {plannerScene.objects.filter((object) => isObjectLayerVisible(object, activeLayers)).map((object) => (
        <PlannerObjectMesh key={object.id} object={object} scene={plannerScene} onAction={onAction} />
      ))}
    </>
  );
}

export function VenueScene(props: VenueSceneProps) {
  const twin = venueNativeTwinForSlug(props.venue.slug);
  const showRiggingHeightAlert = props.activeLayers.has('rigging-grid') && !twin?.rigging?.lowSteel;
  const showFloorAlert = props.activeLayers.has('floor') && !twin?.floor?.boundary;
  const showFitAlert = props.activeLayers.has('fit-overlay') && twin?.drtFit.status === 'BLOCKED';
  return (
    <div className="scene-shell" aria-label={`Interactive 3D planning model for ${props.venue.name}`}>
      <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.6]}>
        <Scene {...props} />
      </Canvas>
      <div className="scene-watermark">PLANNING MODEL / NOT VENUE CAD</div>
      {props.measurementArmed && <div className="scene-alert scene-alert--measure">Measure armed</div>}
      {showFloorAlert && <div className="scene-alert">No source-backed venue-native floor shell</div>}
      {showRiggingHeightAlert && <div className="scene-alert">Rigging geometry incomplete or height-only</div>}
      {showFitAlert && <div className="scene-alert scene-alert--fit">Fit check blocked / missing or conflicted geometry</div>}
      {twin && <div className="scene-fit-badge">VENUE TWIN {twin.readiness} / {twin.drtFit.status}</div>}
    </div>
  );
}
