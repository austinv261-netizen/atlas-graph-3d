// src/api.ts
// Simple client for the Atlas Graph API on Render

const API_BASE = "https://atlas-graph-api.onrender.com";

export type Neighbor = {
  id: string;
  label: string | null;
  relation?: string;
};

export type NeighborsResponse = {
  nodeId: string;
  label: string | null;
  upstream: Neighbor[];
  downstream: Neighbor[];
};

export type BranchStatsResponse = {
  nodeId: string;
  ancestorCount: number;
  descendantCount: number;
  totalConnected: number;
};

export type PathResponse = {
  from: string;
  to: string;
  found: boolean;
  ids: string[];
  labels: string[];
};

// Generic helper for POSTing JSON
async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
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
