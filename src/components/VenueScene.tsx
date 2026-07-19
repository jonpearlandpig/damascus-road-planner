import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Edges, Grid, OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import { DoubleSide, MOUSE, PCFShadowMap, Plane, TOUCH, Vector3 } from 'three';
import type { LayerKey, VenueTwin } from '../data/types';
import { FEET_TO_METERS, ft } from '../lib/units';
import {
  beginPointerIntent,
  canStartTransform,
  isClickIntent,
  updatePointerIntent,
  type PointerIntent,
  type TransformEndReason,
  type TransformHandleKind,
} from '../planner/interaction';
import { snapAndConstrain, snapRotationDeg } from '../planner/snapping';
import { cameraPositionForMode, type PlannerAction } from '../planner/store';
import type { PlacedObject, PlannerObjectCategory, PlannerScene, PlannerTool, ScenePosition } from '../planner/types';
import { canonicalDrtDerived, canonicalDrtGeometry, canonicalDrtPackage } from '../production/drt/canonicalGeometry';
import { polygonDimensions } from '../venue-twins/geometryRules';
import { venueNativeTwinForSlug } from '../venue-twins/records';
import type { BoxGeometry, VenueNativeGeometry } from '../venue-twins/types';
import { DrtPlanView } from './DrtPlanView';

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
  tool: PlannerTool;
  onAction: (action: PlannerAction) => void;
}

interface SceneInteraction {
  startSelection: (event: ThreeEvent<PointerEvent>, id?: string) => void;
  moveSelection: (event: ThreeEvent<PointerEvent>) => void;
  endSelection: (event: ThreeEvent<PointerEvent>) => void;
  startFloor: (event: ThreeEvent<PointerEvent>) => void;
  moveFloor: (event: ThreeEvent<PointerEvent>) => void;
  endFloor: (event: ThreeEvent<PointerEvent>) => void;
}

interface TransformDraft {
  objectId: string;
  position: ScenePosition;
  rotationYDeg: number;
}

interface ActiveTransform {
  objectId: string;
  pointerId: number;
  handle: TransformHandleKind;
  startPoint: Vector3;
  start: TransformDraft;
  startAngleRad: number;
}

function metersToPosition(point: { x: number; y: number; z: number }): ScenePosition {
  return { xFt: point.x / FEET_TO_METERS, yFt: Math.max(0, point.y / FEET_TO_METERS), zFt: point.z / FEET_TO_METERS };
}

function claimTransformPointer(event: ThreeEvent<PointerEvent>) {
  event.stopPropagation();
  event.nativeEvent.preventDefault();
  event.nativeEvent.stopImmediatePropagation();
}

function gizmoHeightFt(object: PlacedObject): number {
  return object.position.yFt + object.dimensions.heightFt / 2 + 2;
}

function gizmoAxisLengthFt(object: PlacedObject): number {
  return Math.max(10, Math.min(24, Math.max(object.dimensions.widthFt, object.dimensions.depthFt) / 2 + 5));
}

function layerForCategory(category: PlannerObjectCategory): LayerKey {
  if (category === 'Truss' || category === 'Motors' || category === 'Lighting fixtures') return 'rigging';
  if (category === 'Camera platforms' || category === 'Video walls' || category === 'Projection surfaces') return 'audience';
  return 'production';
}

function CameraRig({ venue, scene, tool, transformActive }: { venue: VenueTwin; scene: PlannerScene; tool: PlannerTool; transformActive: boolean }) {
  const { camera } = useThree();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  useEffect(() => {
    const position = cameraPositionForMode(scene.camera.mode, venue);
    const target = new Vector3(0, ft(7), 0);
    camera.position.set(ft(position.xFt), ft(position.yFt), ft(position.zFt));
    controls.current?.target.copy(target);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    controls.current?.update();
  }, [camera, scene.camera.mode, scene.camera.projection, scene.camera.resetSequence, venue]);

  const panOnly = tool === 'PAN';
  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enabled={!transformActive}
      autoRotate={scene.camera.mode === 'ORBIT_360'}
      autoRotateSpeed={0.9}
      enableRotate={!panOnly}
      enablePan
      enableZoom
      mouseButtons={{ LEFT: panOnly ? MOUSE.PAN : MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
      touches={{ ONE: panOnly ? TOUCH.PAN : TOUCH.ROTATE, TWO: TOUCH.DOLLY_PAN }}
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

function selectionHandlers(interaction: SceneInteraction, id: string) {
  return {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => interaction.startSelection(event, id),
    onPointerMove: interaction.moveSelection,
    onPointerUp: interaction.endSelection,
  };
}

function NativeFloor({ twin, plannerScene: scene, activeLayers, interaction }: { twin?: VenueNativeGeometry; plannerScene: PlannerScene; activeLayers: Set<string>; interaction: SceneInteraction }) {
  const dimensions = floorDimensions(twin);
  if (!twin?.floor?.boundary || !dimensions || !activeLayers.has('floor')) return null;
  const { widthFt, lengthFt } = dimensions;
  const halfWidth = ft(widthFt / 2);
  const halfLength = ft(lengthFt / 2);
  const isReference = twin.floor.renderState === 'REFERENCE_ONLY';
  const floorColor = isReference ? '#4c5155' : '#30383e';
  const boundaryHandlers = selectionHandlers(interaction, 'venue-native-floor');

  return (
    <>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={interaction.startFloor}
        onPointerMove={interaction.moveFloor}
        onPointerUp={interaction.endFloor}
      >
        <planeGeometry args={[ft(widthFt), ft(lengthFt)]} />
        <meshStandardMaterial color={floorColor} roughness={0.96} transparent opacity={isReference ? 0.52 : 0.88} />
      </mesh>
      {scene.grid.visible && (
        <Grid args={[ft(widthFt), ft(lengthFt)]} cellSize={ft(scene.grid.minorFt)} cellThickness={0.32} cellColor="#6e7478" sectionSize={ft(scene.grid.majorFt)} sectionThickness={0.85} sectionColor="#315a6b" fadeDistance={ft(300)} infiniteGrid={false} position={[0, 0.012, 0]} />
      )}
      <mesh {...boundaryHandlers} position={[0, 0.045, -halfLength]}>
        <boxGeometry args={[ft(widthFt), ft(0.08), ft(0.55)]} /><meshBasicMaterial color="#9db1bc" />
      </mesh>
      <mesh {...boundaryHandlers} position={[0, 0.045, halfLength]}>
        <boxGeometry args={[ft(widthFt), ft(0.08), ft(0.55)]} /><meshBasicMaterial color="#9db1bc" />
      </mesh>
      <mesh {...boundaryHandlers} position={[-halfWidth, 0.045, 0]}>
        <boxGeometry args={[ft(0.55), ft(0.08), ft(lengthFt)]} /><meshBasicMaterial color="#9db1bc" />
      </mesh>
      <mesh {...boundaryHandlers} position={[halfWidth, 0.045, 0]}>
        <boxGeometry args={[ft(0.55), ft(0.08), ft(lengthFt)]} /><meshBasicMaterial color="#9db1bc" />
      </mesh>
      {activeLayers.has('centerlines') && (
        <>
          <mesh position={[0, 0.058, 0]}><boxGeometry args={[ft(0.28), ft(0.08), ft(lengthFt)]} /><meshBasicMaterial color="#f38b43" /></mesh>
          <mesh position={[0, 0.06, 0]}><boxGeometry args={[ft(widthFt), ft(0.08), ft(0.28)]} /><meshBasicMaterial color="#39a4ad" /></mesh>
          <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[ft(5.5), ft(6), 64]} /><meshBasicMaterial color="#e39042" /></mesh>
          <Text position={[ft(11), 0.07, ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.2)} color="#dbe8eb">VENUE 0/0</Text>
        </>
      )}
      <Text position={[0, 0.08, -halfLength + ft(8)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.1)} color={isReference ? '#e2a262' : '#a8c9c6'}>
        {isReference ? 'VENUE FLOOR / REFERENCE ONLY' : 'VENUE-NATIVE FLOOR / FIXED'}
      </Text>
    </>
  );
}

function NativeRigging({ twin, activeLayers, interaction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; interaction: SceneInteraction }) {
  if (!twin?.rigging || !activeLayers.has('rigging-grid')) return null;
  const lowSteelFt = typeof twin.rigging.lowSteel?.value === 'number' ? twin.rigging.lowSteel.value : undefined;
  const floor = floorDimensions(twin);
  const grid = twin.rigging.gridBoundary ? polygonDimensions(twin.rigging.gridBoundary.points) : floor;
  if (lowSteelFt === undefined || !grid) return null;
  const referenceOnly = twin.rigging.renderState === 'REFERENCE_ONLY' || !twin.rigging.gridBoundary;
  return (
    <group {...selectionHandlers(interaction, 'venue-native-rigging')}>
      <mesh position={[0, ft(lowSteelFt), 0]}>
        <boxGeometry args={[ft(grid.widthFt), ft(0.5), ft(grid.lengthFt)]} />
        <meshStandardMaterial color="#7aa1b4" transparent opacity={referenceOnly ? 0.12 : 0.24} wireframe />
      </mesh>
      <Text position={[0, ft(lowSteelFt + 3), 0]} fontSize={ft(2.6)} color={referenceOnly ? '#dba760' : '#8fc6d9'}>{referenceOnly ? 'HOUSE RIGGING REFERENCE / FIXED' : 'VENUE RIGGING GRID / FIXED'}</Text>
    </group>
  );
}

function boxDimension(value: BoxGeometry['dimensions'][keyof BoxGeometry['dimensions']]): number | undefined {
  return typeof value?.value === 'number' ? value.value : undefined;
}

function NativeCenterHung({ twin, activeLayers, interaction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; interaction: SceneInteraction }) {
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
    <group {...selectionHandlers(interaction, 'venue-native-centerhung')}>
      <mesh position={[0, ft(yFt), 0]}>
        <boxGeometry args={[ft(widthFt), ft(heightFt), ft(depthFt)]} />
        <meshStandardMaterial color="#7890a0" roughness={0.5} metalness={0.25} transparent opacity={partial ? 0.24 : 0.58} />
        <Edges color={partial ? '#ed765f' : '#f7d36b'} />
      </mesh>
      <Text position={[0, ft(yFt + heightFt / 2 + 3), 0]} fontSize={ft(2.2)} color={partial ? '#ed765f' : '#a8c7d8'}>{partial ? 'HOUSE CENTER-HUNG / PARTIAL FIXED' : 'VENUE CENTER-HUNG / FIXED'}</Text>
    </group>
  );
}

function NativeStageReference({ twin, activeLayers, interaction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; interaction: SceneInteraction }) {
  const floor = floorDimensions(twin);
  const stageBounds = twin?.stageReference?.maximumStageBounds ? polygonDimensions(twin.stageReference.maximumStageBounds.points) : undefined;
  if (!twin?.stageReference || !floor || !activeLayers.has('stage-reference')) return null;
  return (
    <group {...selectionHandlers(interaction, 'house-stage-reference')}>
      <mesh position={[0, 0.09, -ft(floor.lengthFt / 2) + ft(1.4)]}><boxGeometry args={[ft(floor.widthFt), ft(0.08), ft(2.8)]} /><meshBasicMaterial color="#cf8350" transparent opacity={0.75} /></mesh>
      {stageBounds && <mesh position={[0, 0.1, -ft(floor.lengthFt / 2) + ft(stageBounds.lengthFt / 2)]}><boxGeometry args={[ft(stageBounds.widthFt), ft(0.1), ft(stageBounds.lengthFt)]} /><meshBasicMaterial color="#d68f56" transparent opacity={0.22} /></mesh>}
      <Text position={[0, 0.11, -ft(floor.lengthFt / 2) + ft(7)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.1)} color="#f0a36d">HOUSE REFERENCE / NOT DRT / FIXED</Text>
    </group>
  );
}

function FitOverlay({ twin, activeLayers, interaction }: { twin?: VenueNativeGeometry; activeLayers: Set<string>; interaction: SceneInteraction }) {
  const floor = floorDimensions(twin);
  if (!twin || !floor || !activeLayers.has('fit-overlay')) return null;
  const requiredWidth = canonicalDrtPackage.deckWidthFt;
  const minZ = canonicalDrtDerived.upstageEdgeZFt;
  const maxZ = canonicalDrtPackage.bStageDiameterFt / 2;
  const requiredLength = maxZ - minZ;
  const centerZ = (minZ + maxZ) / 2;
  const color = twin.drtFit.status === 'BLOCKED' ? '#ed765f' : twin.drtFit.status === 'PASS' ? '#6db99a' : '#d5ae67';
  return (
    <group {...selectionHandlers(interaction, 'venue-native-fit')}>
      <mesh position={[0, 0.13, ft(centerZ)]}><boxGeometry args={[ft(requiredWidth), ft(0.12), ft(requiredLength)]} /><meshBasicMaterial color={color} transparent opacity={0.13} /></mesh>
      <Text position={[0, 0.16, ft(centerZ)]} rotation={[-Math.PI / 2, 0, 0]} fontSize={ft(2.4)} color={color}>FIT {twin.drtFit.status} / REFERENCE</Text>
    </group>
  );
}

function CompositeObject({ object, selected }: { object: PlacedObject; selected: boolean }) {
  const canonical = canonicalDrtGeometry.objects.find((item) => item.id === object.canonicalGeometryId);
  if (!canonical?.renderParts) return null;
  return canonical.renderParts.map((part) => (
    <mesh
      key={part.id}
      position={[ft(part.relativePosition.xFt), ft(part.relativePosition.yFt), ft(part.relativePosition.zFt)]}
      rotation={[0, part.rotationYDeg * Math.PI / 180, 0]}
      castShadow
      receiveShadow
    >
      {part.shape === 'cylinder'
        ? <cylinderGeometry args={[ft(part.dimensions.widthFt / 2), ft(part.dimensions.widthFt / 2), ft(part.dimensions.heightFt), 64]} />
        : <boxGeometry args={[ft(part.dimensions.widthFt), ft(part.dimensions.heightFt), ft(part.dimensions.depthFt)]} />}
      <meshStandardMaterial color={object.color} roughness={0.56} transparent={object.shape === 'monolith'} opacity={object.shape === 'monolith' ? 0.42 : part.status === 'REFERENCE' ? 0.68 : 0.9} side={DoubleSide} />
      {(selected || object.shape === 'monolith') && <Edges color={selected ? '#ffe071' : part.status === 'REFERENCE' ? '#e3a35d' : '#e1c477'} />}
    </mesh>
  ));
}

function PlannerObjectMesh({ object, selected, interaction, draft }: { object: PlacedObject; selected: boolean; interaction: SceneInteraction; draft?: TransformDraft }) {
  if (!object.visible) return null;
  const materialOpacity = object.locked ? 0.62 : selected ? 0.96 : 0.84;
  const effectivePosition = draft?.objectId === object.id ? draft.position : object.position;
  const effectiveRotation = draft?.objectId === object.id ? draft.rotationYDeg : object.rotationYDeg;
  const position = [ft(effectivePosition.xFt), ft(effectivePosition.yFt), ft(effectivePosition.zFt)] as const;
  const rotation = [0, effectiveRotation * Math.PI / 180, 0] as const;
  const material = <meshStandardMaterial color={object.color} roughness={0.58} metalness={object.shape === 'truss' ? 0.18 : 0.05} transparent opacity={materialOpacity} />;
  const showPersistentLabel = object.canonicalGeometryId === 'drt-main-stage'
    || object.canonicalGeometryId === 'drt-monolith'
    || object.canonicalGeometryId === 'drt-b-stage';

  return (
    <group position={position} rotation={rotation} {...selectionHandlers(interaction, object.id)}>
      {object.shape === 'monolith' || object.shape === 'b-stage' ? (
        <CompositeObject object={object} selected={selected} />
      ) : object.shape === 'cylinder' || object.shape === 'fog' ? (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[ft(object.dimensions.widthFt / 2), ft(object.dimensions.widthFt / 2), ft(object.dimensions.heightFt), 48]} />
          {material}
          {selected && <Edges color="#ffe071" />}
        </mesh>
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[ft(object.dimensions.widthFt), ft(object.dimensions.heightFt), ft(object.dimensions.depthFt)]} />
          {material}
          {(selected || object.shape === 'truss') && <Edges color={selected ? '#ffe071' : '#d69a52'} />}
        </mesh>
      )}
      {object.shape === 'fog' && object.atmosphere?.enabled && <mesh position={[0, ft(0.08), 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[ft(object.atmosphere.coverageRadiusFt * object.atmosphere.output), 48]} /><meshBasicMaterial color={object.color} transparent opacity={0.14} /></mesh>}
      {object.lighting?.shutterOpen && <mesh position={[0, -ft(6), ft(9)]} rotation={[-Math.PI / 2, 0, 0]}><coneGeometry args={[ft((object.lighting.zoomDeg ?? 20) / 4), ft(18), 32, 1, true]} /><meshBasicMaterial color={object.lighting.color} transparent opacity={0.12 * object.lighting.intensity} /></mesh>}
      {(selected || showPersistentLabel) && (
        <Text position={[0, ft(object.dimensions.heightFt / 2 + (selected ? 2.4 : 1.7)), 0]} fontSize={ft(selected ? 1.7 : 1.35)} color={object.placementStatus === 'UNRESOLVED' ? '#f1ad67' : '#d9e6e8'}>
          {object.label.toUpperCase()}{selected && object.locked ? ' / LOCKED' : ''}{object.placementStatus === 'UNRESOLVED' ? ' / PLACEMENT UNRESOLVED' : ''}
        </Text>
      )}
    </group>
  );
}

function TransformGizmo({ object, tool, activeAxis, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onLostPointerCapture }: {
  object: PlacedObject;
  tool: PlannerTool;
  activeAxis?: TransformHandleKind;
  onPointerDown: (event: ThreeEvent<PointerEvent>, handle: TransformHandleKind) => void;
  onPointerMove: (event: ThreeEvent<PointerEvent>) => void;
  onPointerUp: (event: ThreeEvent<PointerEvent>) => void;
  onPointerCancel: (event: ThreeEvent<PointerEvent>) => void;
  onLostPointerCapture: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const yFt = gizmoHeightFt(object);
  const axisLengthFt = gizmoAxisLengthFt(object);
  const bind = (handle: TransformHandleKind) => ({
    onPointerDown: (event: ThreeEvent<PointerEvent>) => onPointerDown(event, handle),
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  });

  if (tool === 'MOVE') {
    return (
      <group position={[ft(object.position.xFt), ft(yFt), ft(object.position.zFt)]}>
        <group {...bind('MOVE_X')}>
          <mesh position={[ft(axisLengthFt / 2), 0, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[ft(1.15), ft(1.15), ft(axisLengthFt + 2), 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
          <mesh position={[ft(axisLengthFt / 2), 0, 0]} rotation={[0, 0, -Math.PI / 2]}><cylinderGeometry args={[ft(0.28), ft(0.28), ft(axisLengthFt), 16]} /><meshBasicMaterial color={activeAxis === 'MOVE_X' ? '#ffe071' : '#e25b55'} /></mesh>
          <mesh position={[ft(axisLengthFt), 0, 0]} rotation={[0, 0, -Math.PI / 2]}><coneGeometry args={[ft(0.9), ft(2.3), 18]} /><meshBasicMaterial color={activeAxis === 'MOVE_X' ? '#ffe071' : '#e25b55'} /></mesh>
          <Text position={[ft(axisLengthFt + 2.2), 0, 0]} fontSize={ft(1.8)} color="#e25b55">X</Text>
        </group>
        <group {...bind('MOVE_Z')}>
          <mesh position={[0, 0, ft(axisLengthFt / 2)]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[ft(1.15), ft(1.15), ft(axisLengthFt + 2), 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
          <mesh position={[0, 0, ft(axisLengthFt / 2)]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[ft(0.28), ft(0.28), ft(axisLengthFt), 16]} /><meshBasicMaterial color={activeAxis === 'MOVE_Z' ? '#ffe071' : '#4f8fe8'} /></mesh>
          <mesh position={[0, 0, ft(axisLengthFt)]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[ft(0.9), ft(2.3), 18]} /><meshBasicMaterial color={activeAxis === 'MOVE_Z' ? '#ffe071' : '#4f8fe8'} /></mesh>
          <Text position={[0, 0, ft(axisLengthFt + 2.2)]} fontSize={ft(1.8)} color="#4f8fe8">Z</Text>
        </group>
      </group>
    );
  }

  if (tool === 'ROTATE') {
    const radiusFt = Math.max(object.dimensions.widthFt, object.dimensions.depthFt) / 2 + 5;
    return (
      <group position={[ft(object.position.xFt), ft(yFt), ft(object.position.zFt)]} {...bind('ROTATE_Y')}>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[ft(radiusFt), ft(1.35), 10, 96]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[ft(radiusFt), ft(0.45), 12, 96]} /><meshBasicMaterial color={activeAxis === 'ROTATE_Y' ? '#ffe071' : '#d568da'} /></mesh>
        <Text position={[ft(radiusFt + 2), 0, 0]} fontSize={ft(1.8)} color="#d568da">ROT Y</Text>
      </group>
    );
  }

  return null;
}

function GizmoScreenPosition({ object, tool }: { object: PlacedObject; tool: 'MOVE' | 'ROTATE' }) {
  const { camera, gl } = useThree();
  useEffect(() => {
    const yFt = gizmoHeightFt(object);
    const point = tool === 'MOVE'
      ? new Vector3(ft(object.position.xFt + gizmoAxisLengthFt(object) * 0.78), ft(yFt), ft(object.position.zFt))
      : new Vector3(ft(object.position.xFt + Math.max(object.dimensions.widthFt, object.dimensions.depthFt) / 2 + 5), ft(yFt), ft(object.position.zFt));
    camera.updateMatrixWorld();
    point.project(camera);
    gl.domElement.dataset.gizmoHandlePosition = `${(point.x + 1) / 2},${(1 - point.y) / 2}`;
    return () => { delete gl.domElement.dataset.gizmoHandlePosition; };
  }, [camera, gl, object, tool]);
  return null;
}

function isObjectLayerVisible(object: PlacedObject, activeLayers: Set<string>): boolean {
  if (object.geometryClass === 'DRT_TOURING_PRODUCTION') return activeLayers.has('drt-production');
  if (object.geometryClass === 'HOUSE_REFERENCE') return activeLayers.has('reference-geometry');
  return activeLayers.has(layerForCategory(object.category));
}

function Scene({ venue, plannerScene, activeLayers, tool, onAction }: VenueSceneProps) {
  const twin = venueNativeTwinForSlug(venue.slug);
  const selectionIntent = useRef<PointerIntent | undefined>(undefined);
  const activeTransform = useRef<ActiveTransform | undefined>(undefined);
  const draftRef = useRef<TransformDraft | undefined>(undefined);
  const [draft, setDraftState] = useState<TransformDraft>();
  const [activeAxis, setActiveAxis] = useState<TransformHandleKind>();
  const selected = plannerScene.objects.find((object) => object.id === plannerScene.selectedObjectId);

  const setDraft = useCallback((next: TransformDraft | undefined) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const finishTransform = useCallback((reason: TransformEndReason) => {
    const active = activeTransform.current;
    const currentDraft = draftRef.current;
    activeTransform.current = undefined;
    setActiveAxis(undefined);
    setDraft(undefined);
    if (!active || !currentDraft || reason !== 'COMMIT') return;
    if (active.handle === 'ROTATE_Y') {
      if (currentDraft.rotationYDeg !== active.start.rotationYDeg) onAction({ type: 'rotateObject', id: active.objectId, rotationYDeg: currentDraft.rotationYDeg });
      return;
    }
    if (currentDraft.position.xFt !== active.start.position.xFt || currentDraft.position.zFt !== active.start.position.zFt) onAction({ type: 'moveObject', id: active.objectId, position: currentDraft.position });
  }, [onAction, setDraft]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape' && activeTransform.current) finishTransform('ESCAPE'); };
    const onBlur = () => { if (activeTransform.current) finishTransform('FOCUS_LOST'); };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('blur', onBlur);
    };
  }, [finishTransform]);

  const startSelection = useCallback((event: ThreeEvent<PointerEvent>, id?: string) => {
    if (tool !== 'SELECT' || event.button !== 0) return;
    event.stopPropagation();
    selectionIntent.current = beginPointerIntent(event.pointerId, event.clientX, event.clientY, id);
  }, [tool]);

  const moveSelection = useCallback((event: ThreeEvent<PointerEvent>) => {
    if (!selectionIntent.current || selectionIntent.current.pointerId !== event.pointerId) return;
    selectionIntent.current = updatePointerIntent(selectionIntent.current, event.clientX, event.clientY);
  }, []);

  const endSelection = useCallback((event: ThreeEvent<PointerEvent>) => {
    const pending = selectionIntent.current;
    selectionIntent.current = undefined;
    if (!pending || pending.pointerId !== event.pointerId || !isClickIntent(pending)) return;
    event.stopPropagation();
    onAction({ type: 'selectObject', id: pending.targetId });
  }, [onAction]);

  const startFloor = useCallback((event: ThreeEvent<PointerEvent>) => {
    if ((tool !== 'SELECT' && tool !== 'MEASURE') || event.button !== 0) return;
    event.stopPropagation();
    selectionIntent.current = beginPointerIntent(event.pointerId, event.clientX, event.clientY, tool === 'MEASURE' ? '__measure__' : undefined);
  }, [tool]);

  const moveFloor = moveSelection;
  const endFloor = useCallback((event: ThreeEvent<PointerEvent>) => {
    const pending = selectionIntent.current;
    selectionIntent.current = undefined;
    if (!pending || pending.pointerId !== event.pointerId || !isClickIntent(pending)) return;
    event.stopPropagation();
    if (pending.targetId === '__measure__') {
      const hasStart = Boolean(plannerScene.activeMeasurement?.start);
      const hasEnd = Boolean(plannerScene.activeMeasurement?.end);
      const position = metersToPosition(event.point);
      onAction({ type: 'setMeasurementPoint', point: !hasStart || hasEnd ? 'start' : 'end', position: { ...position, yFt: 0 } });
    } else {
      onAction({ type: 'selectObject', id: undefined });
    }
  }, [onAction, plannerScene.activeMeasurement]);

  const interaction = useMemo<SceneInteraction>(() => ({ startSelection, moveSelection, endSelection, startFloor, moveFloor, endFloor }), [endFloor, endSelection, moveFloor, moveSelection, startFloor, startSelection]);

  function pointOnTransformPlane(event: ThreeEvent<PointerEvent>, object: PlacedObject): Vector3 | undefined {
    const plane = new Plane(new Vector3(0, 1, 0), -ft(object.position.yFt));
    return event.ray.intersectPlane(plane, new Vector3()) ?? undefined;
  }

  function startObjectTransform(event: ThreeEvent<PointerEvent>, handle: TransformHandleKind) {
    if (!selected || event.button !== 0 || !canStartTransform(tool, plannerScene.selectedObjectId, selected, handle)) return;
    const startPoint = pointOnTransformPlane(event, selected);
    if (!startPoint) return;
    claimTransformPointer(event);
    const captureTarget = event.target as unknown as { setPointerCapture?: (pointerId: number) => void };
    captureTarget.setPointerCapture?.(event.pointerId);
    const start = { objectId: selected.id, position: selected.position, rotationYDeg: selected.rotationYDeg };
    const centerX = ft(selected.position.xFt);
    const centerZ = ft(selected.position.zFt);
    activeTransform.current = {
      objectId: selected.id,
      pointerId: event.pointerId,
      handle,
      startPoint,
      start,
      startAngleRad: Math.atan2(startPoint.z - centerZ, startPoint.x - centerX),
    };
    setActiveAxis(handle);
    setDraft(start);
  }

  function moveObjectTransform(event: ThreeEvent<PointerEvent>) {
    const active = activeTransform.current;
    if (!active || !selected || active.pointerId !== event.pointerId || active.objectId !== selected.id) return;
    const point = pointOnTransformPlane(event, selected);
    if (!point) return;
    claimTransformPointer(event);
    if (active.handle === 'ROTATE_Y') {
      const currentAngle = Math.atan2(point.z - ft(active.start.position.zFt), point.x - ft(active.start.position.xFt));
      const rotationYDeg = snapRotationDeg(active.start.rotationYDeg + (currentAngle - active.startAngleRad) * 180 / Math.PI, plannerScene.grid.rotationIncrementDeg);
      setDraft({ ...active.start, rotationYDeg });
      return;
    }
    const xDeltaFt = (point.x - active.startPoint.x) / FEET_TO_METERS;
    const zDeltaFt = (point.z - active.startPoint.z) / FEET_TO_METERS;
    const candidate = {
      ...active.start.position,
      xFt: active.handle === 'MOVE_X' ? active.start.position.xFt + xDeltaFt : active.start.position.xFt,
      zFt: active.handle === 'MOVE_Z' ? active.start.position.zFt + zDeltaFt : active.start.position.zFt,
    };
    const position = snapAndConstrain(candidate, selected.dimensions, { widthFt: venue.geometry.floorWidthFt, lengthFt: venue.geometry.floorLengthFt }, plannerScene.grid.snapFt);
    setDraft({ ...active.start, position });
  }

  function endObjectTransform(event: ThreeEvent<PointerEvent>) {
    const active = activeTransform.current;
    if (!active || active.pointerId !== event.pointerId) return;
    claimTransformPointer(event);
    finishTransform('COMMIT');
    const captureTarget = event.target as unknown as { hasPointerCapture?: (pointerId: number) => boolean; releasePointerCapture?: (pointerId: number) => void };
    if (captureTarget.hasPointerCapture?.(event.pointerId)) captureTarget.releasePointerCapture?.(event.pointerId);
  }

  function cancelObjectTransform(event: ThreeEvent<PointerEvent>) {
    const active = activeTransform.current;
    if (!active || active.pointerId !== event.pointerId) return;
    claimTransformPointer(event);
    finishTransform('POINTER_CANCEL');
  }

  const effectiveSelected = selected && draft?.objectId === selected.id ? { ...selected, position: draft.position, rotationYDeg: draft.rotationYDeg } : selected;

  return (
    <>
      <PerspectiveCamera makeDefault fov={42} near={0.1} far={ft(1000)} />
      <CameraRig venue={venue} scene={plannerScene} tool={tool} transformActive={Boolean(activeAxis)} />
      <ambientLight intensity={0.68} />
      <directionalLight position={[20, 30, 15]} intensity={1.2} castShadow />
      <color attach="background" args={['#11171b']} />
      <NativeFloor twin={twin} plannerScene={plannerScene} activeLayers={activeLayers} interaction={interaction} />
      <NativeStageReference twin={twin} activeLayers={activeLayers} interaction={interaction} />
      <NativeRigging twin={twin} activeLayers={activeLayers} interaction={interaction} />
      <NativeCenterHung twin={twin} activeLayers={activeLayers} interaction={interaction} />
      <FitOverlay twin={twin} activeLayers={activeLayers} interaction={interaction} />
      {venue.zones.filter((zone) => (activeLayers.has('loading') && zone.layer === 'logistics') || (activeLayers.has('obstructions') && zone.kind === 'obstruction')).map((zone) => (
        <mesh key={zone.id} position={[ft(zone.xFt), ft((zone.heightFt ?? 1) / 2), ft(zone.zFt)]} {...selectionHandlers(interaction, zone.id)}>
          <boxGeometry args={[ft(zone.widthFt), ft(zone.heightFt ?? 1), ft(zone.depthFt)]} />
          <meshStandardMaterial color={zoneColors[zone.kind]} transparent opacity={zone.kind === 'egress' ? 0.38 : 0.72} />
        </mesh>
      ))}
      {plannerScene.objects.filter((object) => isObjectLayerVisible(object, activeLayers)).map((object) => (
        <PlannerObjectMesh key={object.id} object={object} selected={plannerScene.selectedObjectId === object.id} interaction={interaction} draft={draft} />
      ))}
      {effectiveSelected && !effectiveSelected.locked && (tool === 'MOVE' || tool === 'ROTATE') && (
        <>
          <TransformGizmo
            object={effectiveSelected}
            tool={tool}
            activeAxis={activeAxis}
            onPointerDown={startObjectTransform}
            onPointerMove={moveObjectTransform}
            onPointerUp={endObjectTransform}
            onPointerCancel={cancelObjectTransform}
            onLostPointerCapture={cancelObjectTransform}
          />
          <GizmoScreenPosition object={effectiveSelected} tool={tool} />
        </>
      )}
    </>
  );
}

export function VenueScene(props: VenueSceneProps) {
  const twin = venueNativeTwinForSlug(props.venue.slug);
  const showRiggingHeightAlert = props.activeLayers.has('rigging-grid') && !twin?.rigging?.lowSteel;
  const showFloorAlert = props.activeLayers.has('floor') && !twin?.floor?.boundary;
  const showFitAlert = props.activeLayers.has('fit-overlay') && twin?.drtFit.status === 'BLOCKED';
  const planMode = props.plannerScene.camera.mode === 'PLAN';
  const selectedObject = props.plannerScene.objects.find((object) => object.id === props.plannerScene.selectedObjectId);
  const gizmoVisible = Boolean(selectedObject && !selectedObject.locked && (props.tool === 'MOVE' || props.tool === 'ROTATE'));
  return (
    <div
      className={`scene-shell ${planMode ? 'scene-shell--plan' : ''}`}
      aria-label={`Interactive planning model for ${props.venue.name}`}
      data-tool={props.tool}
      data-selected-object={selectedObject?.id ?? ''}
      data-selected-locked={selectedObject ? String(selectedObject.locked) : ''}
      data-transform-gizmo={gizmoVisible ? props.tool : 'NONE'}
    >
      {planMode ? (
        <DrtPlanView venue={props.venue} scene={props.plannerScene} activeLayers={props.activeLayers} onSelect={(id) => props.onAction({ type: 'selectObject', id })} />
      ) : (
        <Canvas shadows={{ type: PCFShadowMap }} dpr={[1, 1.6]} onPointerMissed={() => { if (props.tool === 'SELECT') props.onAction({ type: 'selectObject', id: undefined }); }}>
          <Scene {...props} />
        </Canvas>
      )}
      <div className="scene-watermark">TECHNICAL PLANNING / NOT VENUE CAD</div>
      <div className="scene-tool-badge">TOOL {props.tool}</div>
      {props.tool === 'MEASURE' && <div className="scene-alert scene-alert--measure">Measure tool active</div>}
      {showFloorAlert && <div className="scene-alert">No source-backed venue-native floor shell</div>}
      {showRiggingHeightAlert && <div className="scene-alert">Rigging geometry incomplete or height-only</div>}
      {showFitAlert && <div className="scene-alert scene-alert--fit">Fit check blocked / missing or conflicted geometry</div>}
      {twin && <div className="scene-fit-badge">VENUE {twin.readiness} / FIT {twin.drtFit.status}</div>}
    </div>
  );
}
