import type { MouseEvent as ReactMouseEvent, ReactNode } from 'react';
import type { VenueTwin } from '../data/types';
import type { PlannerScene, PlacedObject } from '../planner/types';
import { canonicalDrtGeometry, canonicalDrtPackage } from '../production/drt/canonicalGeometry';
import { buildDrtPlanModel } from '../production/drt/planModel';
import { polygonDimensions } from '../venue-twins/geometryRules';
import { venueNativeTwinForSlug } from '../venue-twins/records';

interface DrtPlanViewProps {
  venue: VenueTwin;
  scene: PlannerScene;
  activeLayers: Set<string>;
  onSelect: (id?: string) => void;
}

function feet(value: number): string {
  return Number.isInteger(value) ? `${value} ft` : `${Number(value.toFixed(2))} ft`;
}

function select(event: ReactMouseEvent<SVGGElement>, id: string, onSelect: (id?: string) => void) {
  event.stopPropagation();
  onSelect(id);
}

function ObjectGroup({ object, selected, children, onSelect }: { object: PlacedObject; selected: boolean; children: ReactNode; onSelect: (id?: string) => void }) {
  return (
    <g
      className={`plan-object ${selected ? 'plan-object--selected' : ''} ${object.locked ? 'plan-object--locked' : ''}`}
      data-object-id={object.id}
      data-locked={object.locked ? 'true' : 'false'}
      transform={`translate(${object.position.xFt} ${object.position.zFt}) rotate(${object.rotationYDeg})`}
      onClick={(event) => select(event, object.id, onSelect)}
    >
      {children}
    </g>
  );
}

function DimensionLine({ x1, z1, x2, z2, label, offset = 0 }: { x1: number; z1: number; x2: number; z2: number; label: string; offset?: number }) {
  const horizontal = Math.abs(z2 - z1) < Math.abs(x2 - x1);
  const textX = (x1 + x2) / 2 + (horizontal ? 0 : offset);
  const textZ = (z1 + z2) / 2 + (horizontal ? offset : 0);
  return (
    <g className="plan-dimension">
      <line x1={x1} y1={z1} x2={x2} y2={z2} />
      <line x1={x1 - (horizontal ? 0 : 1)} y1={z1 - (horizontal ? 1 : 0)} x2={x1 + (horizontal ? 0 : 1)} y2={z1 + (horizontal ? 1 : 0)} />
      <line x1={x2 - (horizontal ? 0 : 1)} y1={z2 - (horizontal ? 1 : 0)} x2={x2 + (horizontal ? 0 : 1)} y2={z2 + (horizontal ? 1 : 0)} />
      <text x={textX} y={textZ}>{label}</text>
    </g>
  );
}

function PlanObject({ object, selected, onSelect }: { object: PlacedObject; selected: boolean; onSelect: (id?: string) => void }) {
  const halfWidth = object.dimensions.widthFt / 2;
  const halfDepth = object.dimensions.depthFt / 2;
  const canonical = canonicalDrtGeometry.objects.find((item) => item.id === object.canonicalGeometryId);

  if (object.shape === 'monolith') {
    const points = `${-halfWidth},${-halfDepth} 0,${halfDepth} ${halfWidth},${-halfDepth}`;
    return (
      <ObjectGroup object={object} selected={selected} onSelect={onSelect}>
        <polyline className="plan-monolith" points={points} />
        <text className="plan-label" x={0} y={-1}>TWO-FACE MONOLITH</text>
      </ObjectGroup>
    );
  }

  if (object.shape === 'b-stage') {
    const tail = canonical?.renderParts?.find((part) => part.id === 'drt-b-stage-tail');
    return (
      <ObjectGroup object={object} selected={selected} onSelect={onSelect}>
        <circle r={halfWidth} />
        {tail && (
          <rect
            className="plan-reference-part"
            x={tail.relativePosition.xFt - tail.dimensions.widthFt / 2}
            y={tail.relativePosition.zFt - tail.dimensions.depthFt / 2}
            width={tail.dimensions.widthFt}
            height={tail.dimensions.depthFt}
            transform={`rotate(${tail.rotationYDeg} ${tail.relativePosition.xFt} ${tail.relativePosition.zFt})`}
          />
        )}
        <text className="plan-label" x={0} y={1}>B STAGE</text>
      </ObjectGroup>
    );
  }

  if (object.shape === 'fog') {
    return (
      <ObjectGroup object={object} selected={selected} onSelect={onSelect}>
        <circle r={Math.max(1.2, halfWidth)} />
        <text className="plan-label plan-label--small" x={0} y={-2}>LF</text>
      </ObjectGroup>
    );
  }

  return (
    <ObjectGroup object={object} selected={selected} onSelect={onSelect}>
      <rect x={-halfWidth} y={-halfDepth} width={object.dimensions.widthFt} height={object.dimensions.depthFt} />
      <text className="plan-label" x={0} y={0}>{object.label.replace('DRT ', '').toUpperCase()}</text>
    </ObjectGroup>
  );
}

export function DrtPlanView({ venue, scene, activeLayers, onSelect }: DrtPlanViewProps) {
  const twin = venueNativeTwinForSlug(venue.slug);
  const sourcedFloor = twin?.floor?.boundary ? polygonDimensions(twin.floor.boundary.points) : undefined;
  const floor = sourcedFloor ?? { widthFt: venue.geometry.floorWidthFt, lengthFt: venue.geometry.floorLengthFt };
  const margin = 12;
  const minX = -floor.widthFt / 2 - margin;
  const minZ = -floor.lengthFt / 2 - margin;
  const viewWidth = floor.widthFt + margin * 2;
  const viewDepth = floor.lengthFt + margin * 2;
  const stage = scene.objects.find((object) => object.id === 'drt-main-stage');
  const centerThrust = scene.objects.find((object) => object.id === 'drt-center-thrust');
  const bStage = scene.objects.find((object) => object.id === 'drt-b-stage');
  const plan = buildDrtPlanModel(scene.objects);
  const stageReference = twin?.stageReference?.maximumStageBounds ? polygonDimensions(twin.stageReference.maximumStageBounds.points) : undefined;

  return (
    <div className="plan-view-shell" aria-label={`Orthographic DRT plan validation for ${venue.name}`}>
      <svg
        className="drt-plan-svg"
        viewBox={`${minX} ${minZ} ${viewWidth} ${viewDepth}`}
        role="img"
        aria-label={`DRT plan ${plan.seedVersion}`}
        data-testid="drt-plan-svg"
        data-drt-seed-version={plan.seedVersion}
        onClick={() => onSelect(undefined)}
      >
        <rect className="plan-venue-floor" x={-floor.widthFt / 2} y={-floor.lengthFt / 2} width={floor.widthFt} height={floor.lengthFt} />
        {activeLayers.has('centerlines') && (
          <g className="plan-centerlines">
            <line x1={0} y1={-floor.lengthFt / 2} x2={0} y2={floor.lengthFt / 2} />
            <line x1={-floor.widthFt / 2} y1={0} x2={floor.widthFt / 2} y2={0} />
            <circle cx={0} cy={0} r={4} />
            <text x={2} y={-2}>VENUE 0/0</text>
          </g>
        )}
        {activeLayers.has('stage-reference') && stageReference && (
          <g className="plan-house-reference">
            <rect
              x={-stageReference.widthFt / 2}
              y={-floor.lengthFt / 2}
              width={stageReference.widthFt}
              height={stageReference.lengthFt}
            />
            <text x={0} y={-floor.lengthFt / 2 + stageReference.lengthFt + 3}>HOUSE REFERENCE / NOT DRT</text>
          </g>
        )}
        {activeLayers.has('drt-production') && scene.objects
          .filter((object) => object.geometryClass === 'DRT_TOURING_PRODUCTION' && object.visible)
          .map((object) => <PlanObject key={object.id} object={object} selected={scene.selectedObjectId === object.id} onSelect={onSelect} />)}
        {stage && (
          <>
            <DimensionLine x1={stage.position.xFt - stage.dimensions.widthFt / 2} z1={stage.position.zFt - stage.dimensions.depthFt / 2 - 5} x2={stage.position.xFt + stage.dimensions.widthFt / 2} z2={stage.position.zFt - stage.dimensions.depthFt / 2 - 5} label={feet(stage.dimensions.widthFt)} offset={-1.4} />
            <DimensionLine x1={stage.position.xFt + stage.dimensions.widthFt / 2 + 5} z1={stage.position.zFt - stage.dimensions.depthFt / 2} x2={stage.position.xFt + stage.dimensions.widthFt / 2 + 5} z2={stage.position.zFt + stage.dimensions.depthFt / 2} label={feet(stage.dimensions.depthFt)} offset={3} />
          </>
        )}
        {centerThrust && <DimensionLine x1={centerThrust.position.xFt - 6} z1={centerThrust.position.zFt - centerThrust.dimensions.depthFt / 2} x2={centerThrust.position.xFt - 6} z2={centerThrust.position.zFt + centerThrust.dimensions.depthFt / 2} label={`${feet(centerThrust.dimensions.widthFt)} × ${feet(centerThrust.dimensions.depthFt)}`} offset={-4} />}
        {stage && bStage && <DimensionLine x1={stage.position.xFt - 10} z1={stage.position.zFt} x2={bStage.position.xFt - 10} z2={bStage.position.zFt} label={`${feet(Math.abs(bStage.position.zFt - stage.position.zFt))} stage CL to B CL`} offset={-5} />}
        <g className="plan-orientation">
          <text x={minX + 4} y={minZ + 7}>UPSTAGE ↑</text>
          <text x={minX + 4} y={minZ + viewDepth - 4}>DOWNSTAGE / AUDIENCE ↓</text>
        </g>
      </svg>
      <aside className="plan-validation-summary" aria-label="DRT plan dimensions and warnings">
        <div><span>PLAN TRUTH</span><strong>{plan.seedVersion}</strong></div>
        <dl>
          {plan.labels.map((item) => <div key={item.id} data-testid={`plan-dimension-${item.id}`}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
          <div data-testid="plan-dimension-overall"><dt>Overall production footprint</dt><dd>{feet(plan.overallFootprint.widthFt)} × {feet(plan.overallFootprint.depthFt)}</dd></div>
        </dl>
        <div className="plan-unresolved">
          <strong>{plan.unresolved.length} unresolved design elements are excluded</strong>
          <p>{plan.unresolved.map((item) => item.label).join(' / ')}</p>
        </div>
        <p>Low fog: four reference units. Exact placement unresolved.</p>
        <p>Monolith: two authored faces. No second stacked configuration is filed.</p>
        <p>Canonical B-stage diameter: {canonicalDrtPackage.bStageDiameterFt} ft.</p>
      </aside>
    </div>
  );
}
