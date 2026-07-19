import type { Point2D, Polygon2D } from './types';

function signedArea(points: Point2D[]): number {
  return points.reduce((total, point, index) => {
    const next = points[(index + 1) % points.length]!;
    return total + point.xFt * next.zFt - next.xFt * point.zFt;
  }, 0) / 2;
}

function orientation(a: Point2D, b: Point2D, c: Point2D): number {
  return (b.zFt - a.zFt) * (c.xFt - b.xFt) - (b.xFt - a.xFt) * (c.zFt - b.zFt);
}

function onSegment(a: Point2D, b: Point2D, c: Point2D): boolean {
  return b.xFt <= Math.max(a.xFt, c.xFt)
    && b.xFt >= Math.min(a.xFt, c.xFt)
    && b.zFt <= Math.max(a.zFt, c.zFt)
    && b.zFt >= Math.min(a.zFt, c.zFt);
}

function segmentsIntersect(a1: Point2D, a2: Point2D, b1: Point2D, b2: Point2D): boolean {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);
  if (o1 * o2 < 0 && o3 * o4 < 0) return true;
  if (o1 === 0 && onSegment(a1, b1, a2)) return true;
  if (o2 === 0 && onSegment(a1, b2, a2)) return true;
  if (o3 === 0 && onSegment(b1, a1, b2)) return true;
  if (o4 === 0 && onSegment(b1, a2, b2)) return true;
  return false;
}

export function rectangleBoundary(widthFt: number, lengthFt: number): Point2D[] {
  const x = widthFt / 2;
  const z = lengthFt / 2;
  return [
    { xFt: -x, zFt: -z },
    { xFt: x, zFt: -z },
    { xFt: x, zFt: z },
    { xFt: -x, zFt: z },
  ];
}

export function polygonCenter(points: Point2D[]): Point2D {
  if (points.length === 0) return { xFt: 0, zFt: 0 };
  const centroid = points.reduce((total, point) => ({ xFt: total.xFt + point.xFt, zFt: total.zFt + point.zFt }), { xFt: 0, zFt: 0 });
  return {
    xFt: Number((centroid.xFt / points.length).toFixed(3)),
    zFt: Number((centroid.zFt / points.length).toFixed(3)),
  };
}

export function polygonAreaSqFt(points: Point2D[]): number {
  return Math.abs(signedArea(points));
}

export function validatePolygon(polygon: Polygon2D): string[] {
  const errors: string[] = [];
  const points = polygon.points;
  if (points.length < 3) errors.push(`${polygon.id} must contain at least 3 points`);
  if (polygonAreaSqFt(points) <= 0) errors.push(`${polygon.id} has zero area`);
  for (const [index, start] of points.entries()) {
    const end = points[(index + 1) % points.length]!;
    for (let otherIndex = index + 1; otherIndex < points.length; otherIndex += 1) {
      if (Math.abs(index - otherIndex) <= 1) continue;
      if (index === 0 && otherIndex === points.length - 1) continue;
      const otherStart = points[otherIndex]!;
      const otherEnd = points[(otherIndex + 1) % points.length]!;
      if (segmentsIntersect(start, end, otherStart, otherEnd)) errors.push(`${polygon.id} has self-intersecting edges`);
    }
  }
  return errors;
}

export function polygonDimensions(points: Point2D[]): { widthFt: number; lengthFt: number } | undefined {
  if (points.length === 0) return undefined;
  const xs = points.map((point) => point.xFt);
  const zs = points.map((point) => point.zFt);
  return {
    widthFt: Math.max(...xs) - Math.min(...xs),
    lengthFt: Math.max(...zs) - Math.min(...zs),
  };
}

