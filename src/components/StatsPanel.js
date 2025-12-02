import React from "react";

export default function StatsPanel({
  resources,
  aggregates,
  snapshots,
  logs,
  lastCompare,
  saveSnapshot,
  exportLogs,
  compareSnapshot,
  setBuildings,
  setResources,
  setLogs,
  formatDelta,
}) {
  return (
    <div
      style={{
        width: 360,
        padding: 12,
        background: "rgba(255,255,255,0.02)",
        overflow: "auto",
      }}
    >
      <h3>Stats</h3>
      <div>
        <div>Coins: {resources.coins}</div>
        <div>Supplies: {resources.supplies}</div>
        <div>Goods: {resources.goods}</div>
        <div>Alloy: {resources.alloy}</div>
        <div>Quantum: {resources.quantumActions}</div>

        <div style={{ marginTop: 8 }}>Population: {resources.population}</div>
        <div>
          Euphoria Units: {resources.euphoria} (ratio: {aggregates.euphRatio}% |
          multiplier: {aggregates.eupMultiplier}×)
        </div>
        <div>Coin Boost: {Math.round(resources.coinBoost * 100)}%</div>
        <div>Supply Boost: {Math.round(resources.suppliesBoost * 100)}%</div>

        <div style={{ marginTop: 8 }}>
          <button onClick={saveSnapshot}>Save Snapshot</button>
          <button onClick={exportLogs} style={{ marginLeft: 8 }}>
            Export Logs
          </button>
        </div>
      </div>

      <h4 style={{ marginTop: 12 }}>Snapshots</h4>
      <div>
        {snapshots.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: 6,
              background: "rgba(255,255,255,0.01)",
              marginTop: 6,
            }}
          >
            <div>
              <div style={{ fontSize: 13 }}>{s.name}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{s.ts}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => compareSnapshot(s.id)}>Compare</button>
              <button
                onClick={() => {
                  if (confirm("Restore this snapshot?")) {
                    setBuildings(s.buildings);
                    setResources(s.resources);
                    setLogs(s.logs);
                    alert("Restored");
                  }
                }}
              >
                Restore
              </button>
            </div>
          </div>
        ))}
      </div>

      <h4 style={{ marginTop: 12 }}>Last Compare</h4>
      {lastCompare ? (
        <div>
          <div>Snapshot: {lastCompare.snap.name}</div>
          <div>Δ Coins: {lastCompare.diff.coins}</div>
          <div>Δ Supplies: {lastCompare.diff.supplies}</div>
          <div>Δ Alloy: {lastCompare.diff.alloy}</div>
          <div>Δ Population: {lastCompare.diff.population}</div>
        </div>
      ) : (
        <div style={{ opacity: 0.7 }}>No comparison yet</div>
      )}

      <h4 style={{ marginTop: 12 }}>Action Log</h4>
      <div
        style={{
          maxHeight: 240,
          overflow: "auto",
          background: "rgba(0,0,0,0.12)",
          padding: 8,
        }}
      >
        {logs.map((l) => (
          <div key={l.id} style={{ marginBottom: 6, fontSize: 13 }}>
            <div>
              <strong>{l.kind.toUpperCase()}</strong> {l.label}
            </div>
            <div style={{ fontSize: 12, opacity: 0.9 }}>
              {formatDelta(l.delta)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
