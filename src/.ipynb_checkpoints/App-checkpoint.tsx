// src/App.tsx

import React, { useEffect, useState } from "react";
import { fetchNeighbors, fetchBranchStats, fetchPath } from "./api";
import type { NeighborsResponse, PathResponse } from "./api";
import { GraphScene } from "./GraphScene";

const DEFAULT_NODE = "steam_engine";

export const App: React.FC = () => {
  const [centerId, setCenterId] = useState(DEFAULT_NODE);
  const [neighbors, setNeighbors] = useState<NeighborsResponse | null>(null);
  const [pathFrom, setPathFrom] = useState("fire");
  const [pathTo, setPathTo] = useState("gps");
  const [path, setPath] = useState<PathResponse | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [loadingNode, setLoadingNode] = useState(false);
  const [loadingPath, setLoadingPath] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load default node on first render
  useEffect(() => {
    loadNode(DEFAULT_NODE);
  }, []);

  async function loadNode(nodeId: string) {
    try {
      setError(null);
      setLoadingNode(true);
      setPath(null);

      const [n, stats] = await Promise.all([
        fetchNeighbors(nodeId),
        fetchBranchStats(nodeId),
      ]);

      setNeighbors(n);

      const label = n.label ?? nodeId;
      const txt =
        `Node "${label}" has ${stats.ancestorCount} ancestors ` +
        `and ${stats.descendantCount} descendants (total ${stats.totalConnected}). ` +
        `It has ${n.upstream.length} direct prerequisites and ` +
        `${n.downstream.length} direct downstream technologies.`;
      setSummary(txt);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load node");
    } finally {
      setLoadingNode(false);
    }
  }

  async function loadPath() {
    try {
      setError(null);
      setLoadingPath(true);
      const p = await fetchPath(pathFrom, pathTo);
      setPath(p);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Failed to load path");
    } finally {
      setLoadingPath(false);
    }
  }

  function handleNodeClick(id: string) {
    setCenterId(id);
    setPathFrom(id); // convenience: autoselect clicked node as path start
    loadNode(id);
  }

  const currentPathIds = path?.found ? path.ids : [];

  return (
    <div className="app-root">
      <div className="sidebar">
        <h1>Atlas 3D Tech Map</h1>

        <section>
          <h2>Focus Node</h2>
          <label>
            Node ID
            <input
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              placeholder="steam_engine"
            />
          </label>
          <button onClick={() => loadNode(centerId)} disabled={loadingNode}>
            {loadingNode ? "Loading..." : "Load Node"}
          </button>
        </section>

        <section>
          <h2>Path Finder</h2>
          <div className="path-inputs">
            <label>
              From
              <input
                value={pathFrom}
                onChange={(e) => setPathFrom(e.target.value)}
                placeholder="fire"
              />
            </label>
            <label>
              To
              <input
                value={pathTo}
                onChange={(e) => setPathTo(e.target.value)}
                placeholder="gps"
              />
            </label>
          </div>
          <button onClick={loadPath} disabled={loadingPath}>
            {loadingPath ? "Finding..." : "Find Path"}
          </button>

          {path && (
            <div className="path-summary">
              {path.found ? (
                <>
                  <div>
                    Path ({path.ids.length} steps):
                    <br />
                    <strong>{path.labels.join(" → ")}</strong>
                  </div>
                </>
              ) : (
                <div>No path found between these nodes.</div>
              )}
            </div>
          )}
        </section>

        <section>
          <h2>Summary</h2>
          <p>{summary || "Load a node to see its context in the tech tree."}</p>
          {error && <p className="error">Error: {error}</p>}
        </section>
      </div>

      <div className="scene-container">
        <GraphScene
          data={neighbors}
          pathIds={currentPathIds}
          onNodeClick={handleNodeClick}
        />
      </div>
    </div>
  );
};

export default App;
