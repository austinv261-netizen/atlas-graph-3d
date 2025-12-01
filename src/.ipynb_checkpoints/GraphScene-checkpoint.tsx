// src/GraphScene.tsx

import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { NeighborsResponse } from "./api";

type GraphSceneProps = {
  data: NeighborsResponse | null;
  pathIds: string[]; // ids along the current path (can be empty)
  onNodeClick?: (id: string) => void;
};

type PositionedNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  kind: "center" | "upstream" | "downstream";
};

type Edge = { from: string; to: string };

function computeLayout(data: NeighborsResponse | null): {
  nodes: PositionedNode[];
  edges: Edge[];
} {
  if (!data) return { nodes: [], edges: [] };

  const nodes: PositionedNode[] = [];
  const edges: Edge[] = [];

  const centerId = data.nodeId;
  const centerLabel = data.label ?? data.nodeId;

  nodes.push({
    id: centerId,
    label: centerLabel,
    x: 0,
    y: 0,
    z: 0,
    kind: "center",
  });

  const radius = 4;
  const upstreamCount = data.upstream.length;
  const downstreamCount = data.downstream.length;

  // Place upstream nodes in a circle above
  data.upstream.forEach((n, idx) => {
    const angle = (idx / Math.max(1, upstreamCount)) * Math.PI * 2;
    nodes.push({
      id: n.id,
      label: n.label ?? n.id,
      x: Math.cos(angle) * radius,
      y: 2,
      z: Math.sin(angle) * radius,
      kind: "upstream",
    });
    edges.push({ from: n.id, to: centerId });
  });

  // Place downstream nodes in a circle below
  data.downstream.forEach((n, idx) => {
    const angle = (idx / Math.max(1, downstreamCount)) * Math.PI * 2;
    nodes.push({
      id: n.id,
      label: n.label ?? n.id,
      x: Math.cos(angle) * radius,
      y: -2,
      z: Math.sin(angle) * radius,
      kind: "downstream",
    });
    edges.push({ from: centerId, to: n.id });
  });

  return { nodes, edges };
}

const NodeSphere: React.FC<{
  node: PositionedNode;
  highlighted: boolean;
  onClick?: () => void;
}> = ({ node, highlighted, onClick }) => {
  const color =
    node.kind === "center"
      ? "#4dabf7"
      : node.kind === "upstream"
      ? "#fab005"
      : "#51cf66";

  const scale = highlighted ? 0.6 : 0.4;

  return (
    <mesh position={[node.x, node.y, node.z]} onClick={onClick}>
      <sphereGeometry args={[scale, 32, 32]} />
      <meshStandardMaterial
        color={highlighted ? "#ffd43b" : color}
        emissive={highlighted ? "#ffd43b" : "#000000"}
        emissiveIntensity={highlighted ? 0.5 : 0}
      />
    </mesh>
  );
};

const EdgeLine: React.FC<{ from: PositionedNode; to: PositionedNode; highlighted: boolean }> = ({
  from,
  to,
  highlighted,
}) => {
  const points = useMemo(
    () => [
      [from.x, from.y, from.z],
      [to.x, to.y, to.z],
    ],
    [from, to]
  );

  return (
    <line>
      <bufferGeometry
        attach="geometry"
        setFromPoints={points.map((p) => new (window as any).THREE.Vector3(...p))}
      />
      <lineBasicMaterial
        attach="material"
        color={highlighted ? "#ffd43b" : "#888"}
        linewidth={highlighted ? 2 : 1}
      />
    </line>
  );
};

export const GraphScene: React.FC<GraphSceneProps> = ({
  data,
  pathIds,
  onNodeClick,
}) => {
  const { nodes, edges } = useMemo(() => computeLayout(data), [data]);

  const pathSet = useMemo(() => new Set(pathIds), [pathIds]);

  if (!data) {
    return (
      <div style={{ color: "#ccc", padding: "1rem" }}>
        No data loaded yet. Choose a node ID and click “Load Node”.
      </div>
    );
  }

  return (
    <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
      <color attach="background" args={["#050816"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />

      {edges.map((e, idx) => {
        const from = nodes.find((n) => n.id === e.from);
        const to = nodes.find((n) => n.id === e.to);
        if (!from || !to) return null;

        const highlighted =
          pathSet.has(e.from) && pathSet.has(e.to) && pathIds.length > 0;

        return (
          <EdgeLine
            key={idx}
            from={from}
            to={to}
            highlighted={highlighted}
          />
        );
      })}

      {nodes.map((n) => (
        <NodeSphere
          key={n.id}
          node={n}
          highlighted={pathSet.has(n.id)}
          onClick={() => onNodeClick && onNodeClick(n.id)}
        />
      ))}

      <OrbitControls enableDamping />
    </Canvas>
  );
};
