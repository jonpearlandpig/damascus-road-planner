import { useMemo } from "react";
import * as THREE from "three";
import type { SceneObject } from "@/lib/drt/types";

// Semantic color tokens for scene objects. Kept in one place; components never
// hardcode hex/tailwind colors.
const COLORS: Record<string, { color: string; opacity: number; wireframe?: boolean }> = {
  floor: { color: "#e9e2cf", opacity: 1 },
  boundary: { color: "#c7573a", opacity: 1 },
  accent: { color: "#c7573a", opacity: 1 },
  "bowl-lower": { color: "#2b3348", opacity: 0.18, wireframe: true },
  "bowl-club": { color: "#2b3348", opacity: 0.12, wireframe: true },
  "bowl-upper": { color: "#2b3348", opacity: 0.08, wireframe: true },
  grid: { color: "#2b3348", opacity: 0.22 },
  "grid-soft": { color: "#2b3348", opacity: 0.12 },
  scoreboard: { color: "#2b3348", opacity: 0.28, wireframe: true },
  ops: { color: "#c7573a", opacity: 0.18 },
  "ops-soft": { color: "#c7573a", opacity: 0.1 },
  deck: { color: "#1f2740", opacity: 0.92 },
  monolith: { color: "#3a4160", opacity: 0.95 },
  bstage: { color: "#c7573a", opacity: 0.9 },
  band: { color: "#4a5170", opacity: 0.9 },
};

function tokenFor(obj: SceneObject) {
  return COLORS[obj.color ?? ""] ?? { color: "#1f2740", opacity: 0.9 };
}

function useGeometry(obj: SceneObject) {
  return useMemo(() => {
    const g = obj.geometry;
    switch (g.type) {
      case "box":
        return new THREE.BoxGeometry(g.size.x, g.size.y, g.size.z);
      case "cylinder":
        return new THREE.CylinderGeometry(g.radius, g.radius, g.height, 48);
      case "plane": {
        const p = new THREE.PlaneGeometry(g.size.w, g.size.d);
        p.rotateX(-Math.PI / 2);
        return p;
      }
      case "marker": {
        const p = new THREE.CircleGeometry(g.radius, 48);
        p.rotateX(-Math.PI / 2);
        return p;
      }
      case "prism": {
        // Triangular prism: base along X, depth along Z, height along Y.
        // Base edge at z=0 (downstage), vertex line at z=depth.
        const b = g.base / 2;
        const shape = new THREE.Shape();
        shape.moveTo(-b, 0);
        shape.lineTo(b, 0);
        shape.lineTo(0, g.height);
        shape.lineTo(-b, 0);
        const geom = new THREE.ExtrudeGeometry(shape, {
          depth: g.depth,
          bevelEnabled: false,
        });
        // Extrude goes +Z; we want vertex line upstage (+Z), base at z=0.
        // Rotate so Y is up (already), keep as-is; center Z.
        geom.translate(0, 0, -g.depth / 2);
        return geom;
      }
    }
  }, [obj.geometry]);
}

interface Props {
  object: SceneObject;
  selected: boolean;
  onSelect: () => void;
  parentOffset?: { x: number; y: number; z: number };
  parentRotationY?: number;
}

export function SceneObjectMesh({
  object,
  selected,
  onSelect,
  parentOffset = { x: 0, y: 0, z: 0 },
  parentRotationY = 0,
}: Props) {
  const geometry = useGeometry(object);
  const token = tokenFor(object);

  // Apply parent (show origin) transform: rotate the local position around Y,
  // then translate.
  const cos = Math.cos(parentRotationY);
  const sin = Math.sin(parentRotationY);
  const lx = object.position.x;
  const lz = object.position.z;
  const wx = parentOffset.x + lx * cos + lz * sin;
  const wz = parentOffset.z + -lx * sin + lz * cos;
  const wy = parentOffset.y + object.position.y;

  return (
    <mesh
      geometry={geometry}
      position={[wx, wy, wz]}
      rotation={[0, (object.rotationY ?? 0) + parentRotationY, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial
        color={token.color}
        transparent={token.opacity < 1}
        opacity={token.opacity}
        wireframe={token.wireframe}
        emissive={selected ? "#c7573a" : "#000000"}
        emissiveIntensity={selected ? 0.35 : 0}
        roughness={0.85}
        metalness={0.05}
      />
    </mesh>
  );
}
