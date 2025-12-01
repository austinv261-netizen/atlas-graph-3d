// src/api.ts
// Simple client for the Atlas Graph API on Render

// src/api.ts
const BASE_URL =
  import.meta.env.VITE_GRAPH_API_BASE_URL ?? "http://localhost:3033";

export type NeighborsResponse = {
  nodeId: string;
  upstream: string[];
  downstream: string[];
};

export type PathResponse = {
  from: string;
  to: string;
  ids: string[];
  labels: string[];
};

// example:
export async function fetchNeighbors(nodeId: string): Promise<NeighborsResponse> {
  const res = await fetch(`${BASE_URL}/graph/neighbors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nodeId }),
  });

  if (!res.ok) throw new Error("Failed to fetch neighbors");
  return res.json();
}


export function fetchNeighbors(nodeId: string) {
  return postJSON<NeighborsResponse>("/graph/neighbors", { nodeId });
}

export function fetchBranchStats(nodeId: string) {
  return postJSON<BranchStatsResponse>("/graph/branch-stats", { nodeId });
}

export function fetchPath(from: string, to: string) {
  return postJSON<PathResponse>("/graph/path", { from, to });
}
