import { buildDrtFitCheck } from '../data/drtFitChecks';
import type { VenueSourceReviewRecord } from '../data/venueSourceReviews';
import { polygonCenter, rectangleBoundary } from './geometryRules';
import { approvedFact, approvedFacts, numericValue, sourcedValueFromFact, sourceTitle } from './evidence';
import type { BoxGeometry, GeometryRenderState, Line2D, Polygon2D, SourcedGeometryValue, VenueNativeGeometry } from './types';

function fieldValue(review: VenueSourceReviewRecord, field: string, participatesInFitCheck: boolean): SourcedGeometryValue | undefined {
  const fact = approvedFact(review, field);
  return fact ? sourcedValueFromFact(fact, 'EXACT', `approved measurement ${fact.id}`, participatesInFitCheck) : undefined;
}

function sourceIdsForReview(review: VenueSourceReviewRecord): string[] {
  return [...new Set(review.sourceIdsReviewed)];
}

function blockerList(review: VenueSourceReviewRecord): string[] {
  return [
    ...review.missingRequiredGeometry.map((field) => `Missing ${field}`),
    ...review.conflicts.filter((conflict) => conflict.status === 'OPEN').map((conflict) => conflict.summary),
  ];
}

function makeRectanglePolygon(args: {
  id: string;
  widthFt: number;
  lengthFt: number;
  approvedMeasurementIds: string[];
  derivationRule: string;
  renderState: GeometryRenderState;
  participatesInFitCheck: boolean;
}): Polygon2D {
  return {
    id: args.id,
    points: rectangleBoundary(args.widthFt, args.lengthFt),
    derivationRule: args.derivationRule,
    exactness: args.renderState === 'REFERENCE_ONLY' ? 'REFERENCE_ONLY' : 'DERIVED',
    renderState: args.renderState,
    approvedMeasurementIds: args.approvedMeasurementIds,
    participatesInFitCheck: args.participatesInFitCheck,
  };
}

function derivedLine(id: string, start: { xFt: number; zFt: number }, end: { xFt: number; zFt: number }, approvedMeasurementIds: string[], participatesInFitCheck: boolean): Line2D {
  return {
    id,
    start,
    end,
    derivationRule: 'Derived from approved floor boundary dimensions and planner coordinate convention.',
    exactness: 'DERIVED',
    approvedMeasurementIds,
    participatesInFitCheck,
  };
}

function centerHungGeometry(review: VenueSourceReviewRecord, participatesInFitCheck: boolean): BoxGeometry | undefined {
  const lowPoint = fieldValue(review, 'centerhungBottomFt', participatesInFitCheck);
  const diameter = fieldValue(review, 'centerhungDiameterFt', false);
  const width = fieldValue(review, 'centerhungWidthFt', false);
  const depth = fieldValue(review, 'centerhungDepthFt', false);
  const height = fieldValue(review, 'centerhungHeightFt', false);
  const hasFootprint = Boolean(diameter || (width && depth));
  if (!lowPoint && !hasFootprint) return undefined;

  const widthValue = typeof width?.value === 'number' ? width : diameter;
  const depthValue = typeof depth?.value === 'number' ? depth : diameter;
  const lowPointFt = typeof lowPoint?.value === 'number' ? lowPoint.value : 0;
  const heightFt = typeof height?.value === 'number' ? height.value : 0;
  const dimensionIds = [widthValue?.measurementId, depthValue?.measurementId, height?.measurementId, lowPoint?.measurementId].filter((id): id is string => Boolean(id));
  const footprint = typeof widthValue?.value === 'number' && typeof depthValue?.value === 'number'
    ? makeRectanglePolygon({
      id: `${review.venueSlug}-centerhung-footprint`,
      widthFt: widthValue.value,
      lengthFt: depthValue.value,
      approvedMeasurementIds: dimensionIds,
      derivationRule: 'Derived center-hung footprint from approved scoreboard width/depth or approved diameter.',
      renderState: lowPoint ? 'APPROVED' : 'REFERENCE_ONLY',
      participatesInFitCheck: Boolean(lowPoint && participatesInFitCheck),
    })
    : undefined;

  return {
    id: `${review.venueSlug}-centerhung`,
    center: { xFt: 0, yFt: lowPointFt + heightFt / 2, zFt: 0 },
    dimensions: { widthFt: widthValue, depthFt: depthValue, heightFt: height },
    footprint,
    lowPoint,
    renderState: lowPoint && hasFootprint ? 'APPROVED' : 'REFERENCE_ONLY',
    exactness: lowPoint && hasFootprint ? 'DERIVED' : 'REFERENCE_ONLY',
    approvedMeasurementIds: dimensionIds,
    participatesInFitCheck: Boolean(lowPoint && participatesInFitCheck),
    derivationRule: hasFootprint && height
      ? 'Centered on the venue reference origin from approved center-hung dimensions.'
      : hasFootprint
        ? 'Approved center-hung footprint and/or low point only; missing axes are not fabricated.'
      : 'Partial center-hung source fact; unsupported axes are not fabricated.',
  };
}

export function buildVenueNativeTwin(review: VenueSourceReviewRecord, reviewChecksum = 'runtime'): VenueNativeGeometry {
  const isReady = review.modelReadiness === 'READY';
  const isPartial = review.modelReadiness === 'PARTIAL';
  const floorWidth = fieldValue(review, 'floorWidthFt', isReady || isPartial);
  const floorLength = fieldValue(review, 'floorLengthFt', isReady || isPartial);
  const lowSteel = fieldValue(review, 'lowSteelFt', isReady || isPartial);
  const highSteel = fieldValue(review, 'highSteelFt', false);
  const gridWidth = fieldValue(review, 'gridWidthFt', false);
  const gridDepth = fieldValue(review, 'gridDepthFt', false);
  const floorWidthFt = typeof floorWidth?.value === 'number' ? floorWidth.value : undefined;
  const floorLengthFt = typeof floorLength?.value === 'number' ? floorLength.value : undefined;
  const canBuildFloor = floorWidthFt !== undefined && floorLengthFt !== undefined;
  const controllingGeometry = review.modelReadiness !== 'BLOCKED';
  const floorFactIds = [floorWidth?.measurementId, floorLength?.measurementId].filter((id): id is string => Boolean(id));
  const floorBoundary = canBuildFloor
    ? makeRectanglePolygon({
      id: `${review.venueSlug}-event-floor-boundary`,
      widthFt: floorWidthFt,
      lengthFt: floorLengthFt,
      approvedMeasurementIds: floorFactIds,
      derivationRule: 'Derived rectangular event-floor boundary from approved floor width and length.',
      renderState: controllingGeometry ? 'DERIVED' : 'REFERENCE_ONLY',
      participatesInFitCheck: controllingGeometry,
    })
    : undefined;
  const floorCenter = floorBoundary ? polygonCenter(floorBoundary.points) : { xFt: 0, zFt: 0 };
  const gridWidthFt = typeof gridWidth?.value === 'number' ? gridWidth.value : undefined;
  const gridDepthFt = typeof gridDepth?.value === 'number' ? gridDepth.value : undefined;
  const gridBoundary = gridWidthFt !== undefined && gridDepthFt !== undefined
    ? makeRectanglePolygon({
      id: `${review.venueSlug}-rigging-grid-boundary`,
      widthFt: gridWidthFt,
      lengthFt: gridDepthFt,
      approvedMeasurementIds: [gridWidth!.measurementId, gridDepth!.measurementId],
      derivationRule: 'Derived rigging-grid rectangle from approved grid width and depth.',
      renderState: controllingGeometry ? 'DERIVED' : 'REFERENCE_ONLY',
      participatesInFitCheck: false,
    })
    : undefined;
  const stageCenterline = floorBoundary
    ? derivedLine(
      `${review.venueSlug}-stage-centerline`,
      { xFt: 0, zFt: -floorLengthFt! / 2 },
      { xFt: 0, zFt: floorLengthFt! / 2 },
      floorFactIds,
      controllingGeometry,
    )
    : undefined;
  const maxStageFacts = approvedFacts(review, ['houseStageWidthFt', 'houseStageDepthFt']);
  const maxStageWidth = numericValue(maxStageFacts.find((fact) => fact.field === 'houseStageWidthFt'));
  const maxStageDepth = numericValue(maxStageFacts.find((fact) => fact.field === 'houseStageDepthFt'));
  const maximumStageBounds = maxStageWidth !== undefined && maxStageDepth !== undefined
    ? makeRectanglePolygon({
      id: `${review.venueSlug}-maximum-house-stage`,
      widthFt: maxStageWidth,
      lengthFt: maxStageDepth,
      approvedMeasurementIds: maxStageFacts.map((fact) => fact.id),
      derivationRule: 'Derived maximum house-stage rectangle from approved house-stage width and depth.',
      renderState: 'REFERENCE_ONLY',
      participatesInFitCheck: false,
    })
    : undefined;
  const centerHung = centerHungGeometry(review, controllingGeometry);
  const approvedMeasurementIds = [
    floorWidth,
    floorLength,
    lowSteel,
    highSteel,
    gridWidth,
    gridDepth,
    centerHung?.lowPoint,
    centerHung?.dimensions.widthFt,
    centerHung?.dimensions.depthFt,
    centerHung?.dimensions.heightFt,
  ].map((value) => value?.measurementId).filter((id): id is string => Boolean(id));
  const extraApprovedIds = [...maximumStageBounds?.approvedMeasurementIds ?? []];
  const allApprovedIds = [...new Set([...approvedMeasurementIds, ...extraApprovedIds])];
  const derivedGeometryIds = [
    floorBoundary?.id,
    floorBoundary ? `${review.venueSlug}-floor-center` : undefined,
    gridBoundary?.id,
    stageCenterline?.id,
    maximumStageBounds?.id,
    centerHung?.footprint?.id,
  ].filter((id): id is string => Boolean(id));
  const approximateGeometryIds: string[] = [];
  const fitCheck = buildDrtFitCheck(review);
  const blockers = blockerList(review);
  const warningForOrigin = floorBoundary
    ? 'Origin is the derived center of the approved event-floor rectangle; it is not a verified center-court point.'
    : 'No approved venue-native origin exists; reference origin is shown only as a planning warning.';
  const renderingStatus = review.modelReadiness === 'READY'
    ? 'READY_TO_RENDER'
    : review.modelReadiness === 'PARTIAL'
      ? 'PARTIAL_RENDER'
      : floorBoundary
        ? 'PARTIAL_RENDER'
        : 'BLOCKED_NO_SHELL';
  const sourceIds = sourceIdsForReview(review);

  return {
    schemaVersion: 1,
    venueSlug: review.venueSlug,
    readiness: review.modelReadiness,
    coordinateSystem: {
      origin: 'REFERENCE_ORIGIN',
      originMethod: floorBoundary ? 'DERIVED_FLOOR_CENTER' : 'REFERENCE_ORIGIN_WITH_WARNING',
      originLabel: floorBoundary ? 'Derived event-floor center' : 'Reference origin only',
      originPoint: floorCenter,
      xAxis: 'STAGE_LEFT_TO_STAGE_RIGHT',
      yAxis: 'ELEVATION',
      zAxis: 'UPSTAGE_TO_DOWNSTAGE',
      unit: 'ft',
      evidenceMeasurementIds: floorFactIds,
      warning: warningForOrigin,
    },
    floor: floorBoundary ? {
      boundary: floorBoundary,
      width: floorWidth,
      length: floorLength,
      center: floorCenter,
      orientationDeg: 0,
      renderState: controllingGeometry ? 'DERIVED' : 'REFERENCE_ONLY',
    } : undefined,
    rigging: lowSteel || highSteel || gridBoundary ? {
      gridBoundary,
      lowSteel,
      highSteel,
      noRigZones: [],
      renderState: gridBoundary || lowSteel || highSteel ? (controllingGeometry ? 'APPROVED' : 'REFERENCE_ONLY') : 'MISSING',
    } : undefined,
    obstructions: centerHung ? {
      centerHung,
      scoreboardLowPoint: centerHung.lowPoint,
      fixedObstructions: [],
      renderState: centerHung.renderState,
    } : undefined,
    stageReference: stageCenterline || maximumStageBounds ? {
      endStageDirection: stageCenterline ? 'UPSTAGE' : 'UNKNOWN',
      stageCenterline,
      maximumStageBounds,
      renderState: stageCenterline ? (controllingGeometry ? 'DERIVED' : 'REFERENCE_ONLY') : 'MISSING',
      warning: stageCenterline ? 'Stage direction follows the planner coordinate convention; no venue-specific stage-end orientation was approved.' : undefined,
    } : undefined,
    loading: approvedFact(review, 'pushDistanceFt') || approvedFact(review, 'dockCount') ? {
      dockDirection: 'UNKNOWN',
      renderState: 'REFERENCE_ONLY',
      warning: 'Loading facts are approved, but no source-backed dock coordinate or direction was available for native placement.',
    } : undefined,
    evidence: {
      approvedMeasurementIds: allApprovedIds,
      derivedGeometryIds,
      approximateGeometryIds,
      sourceIds,
      sourceTitles: sourceIds.map(sourceTitle),
    },
    diagnostics: {
      approvedMeasurementCount: allApprovedIds.length,
      derivedGeometryCount: derivedGeometryIds.length,
      approximateGeometryCount: approximateGeometryIds.length,
      conflictCount: review.conflicts.filter((conflict) => conflict.status === 'OPEN').length,
      missingCriticalFields: review.missingRequiredGeometry,
      blockers,
      warnings: [
        warningForOrigin,
        ...(review.modelReadiness === 'BLOCKED' ? ['Blocked review records do not contribute controlling fit geometry.'] : []),
      ],
      renderingStatus,
    },
    drtFit: {
      status: fitCheck.status,
      checkedFactIds: fitCheck.checkedFactIds,
      blockers: fitCheck.blockers,
      warnings: fitCheck.warnings,
    },
    generation: {
      generatorSchemaVersion: 1,
      sourceReviewDate: review.reviewDate,
      sourceRevision: review.sourceRevision,
      reviewChecksum,
    },
  };
}

export function geometryEvidenceForElement(twin: VenueNativeGeometry, elementId: string) {
  const ids = new Set<string>();
  if (elementId === 'venue-native-floor') for (const id of twin.floor?.boundary?.approvedMeasurementIds ?? []) ids.add(id);
  if (elementId === 'venue-native-rigging') {
    if (twin.rigging?.lowSteel?.measurementId) ids.add(twin.rigging.lowSteel.measurementId);
    if (twin.rigging?.highSteel?.measurementId) ids.add(twin.rigging.highSteel.measurementId);
    for (const id of twin.rigging?.gridBoundary?.approvedMeasurementIds ?? []) ids.add(id);
  }
  if (elementId === 'venue-native-centerhung') for (const id of twin.obstructions?.centerHung?.approvedMeasurementIds ?? []) ids.add(id);
  return [...ids].flatMap((id) => {
    const values = [
      twin.floor?.width,
      twin.floor?.length,
      twin.rigging?.lowSteel,
      twin.rigging?.highSteel,
      twin.obstructions?.centerHung?.lowPoint,
      twin.obstructions?.centerHung?.dimensions.widthFt,
      twin.obstructions?.centerHung?.dimensions.depthFt,
      twin.obstructions?.centerHung?.dimensions.heightFt,
    ].filter((value): value is SourcedGeometryValue => Boolean(value));
    return values.find((value) => value.measurementId === id)?.evidence ?? [];
  });
}
