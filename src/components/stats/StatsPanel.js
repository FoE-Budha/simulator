import React from "react";

export default function StatsPanel({
  resources,
  aggregates,
  logs,
  snapshots,
  lastCompare,
  saveSnapshot,
  compareSnapshot,
  onOpenResourcesDialog,
}) {
  // Safety check for resources
  if (!resources) {
    return <div style={{ padding: "12px", color: "#ff6b6b" }}>Loading...</div>;
  }

  // Ensure logs is an array
  const safeLogs = Array.isArray(logs) ? logs : [];

  // Ensure resources has all properties with defaults
  const safeResources = {
    coins: resources.coins || 0,
    supplies: resources.supplies || 0,
    goods: resources.goods || 0,
    shards: resources.shards || 0,
    alloy: resources.alloy || 0,
    quantumActions: resources.quantumActions || 0,
    population: resources.population || 0,
    euphoria: resources.euphoria || 0,
    coinBoost: resources.coinBoost || 0,
    suppliesBoost: resources.suppliesBoost || 0,
    attack: resources.attack || 0,
    defense: resources.defense || 0,
  };

  return (
    <div
      style={{
        width: "320px",
        padding: "12px",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div className="header">Resources</div>
      <div style={{ marginBottom: "12px" }}>
        <div>Coins: {safeResources.coins}</div>
        <div>Supplies: {safeResources.supplies}</div>
        <div>Goods: {safeResources.goods}</div>
        <div>Shards: {safeResources.shards}</div>
        <div>Alloy: {safeResources.alloy}</div>
        <button
          className="button small"
          onClick={onOpenResourcesDialog}
          style={{ padding: "4px 8px", fontSize: "11px" }}
        >
          Edit
        </button>
      </div>

      <div className="header">Stats</div>
      <div style={{ marginBottom: "12px" }}>
        <div>Population: {safeResources.population}</div>
        <div>Euphoria: {safeResources.euphoria}</div>
        <div>Coin Boost: {safeResources.coinBoost * 100}%</div>
        <div>Supplies Boost: {safeResources.suppliesBoost * 100}%</div>
        <div>Quantum Actions: {safeResources.quantumActions}</div>
        <div>Attack: {safeResources.attack * 100}%</div>
        <div>Defense: {safeResources.defense * 100}%</div>
      </div>

      {aggregates && (
        <>
          <div className="header">Aggregates</div>
          <div style={{ marginBottom: "12px", fontSize: "13px" }}>
            <div>Euphoria Ratio: {aggregates.euphRatio || 0}%</div>
            <div>Multiplier: {(aggregates.eupMultiplier || 1).toFixed(2)}x</div>
            <div>Final Coins: {aggregates.finalCoins || 0}</div>
            <div>Final Supplies: {aggregates.finalSupplies || 0}</div>
          </div>
        </>
      )}

      <div className="header">Actions</div>
      <div style={{ marginBottom: "12px", display: "flex", gap: "8px" }}>
        <button
          className="button small"
          onClick={() =>
            saveSnapshot(`Snapshot ${(snapshots || []).length + 1}`)
          }
        >
          Save Snapshot
        </button>
        {lastCompare && (
          <button
            className="button small"
            onClick={() => console.log("Compare details:", lastCompare)}
          >
            Show Diff
          </button>
        )}
      </div>

      <div className="header">Recent Logs</div>
      <div style={{ maxHeight: "200px", overflowY: "auto", fontSize: "12px" }}>
        {safeLogs.length === 0 ? (
          <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
            No logs yet
          </div>
        ) : (
          safeLogs.slice(-5).map((log, idx) => {
            // Determine color based on log type
            let logColor = "#94a3b8";
            if (log.type === "build") logColor = "#06b6d4";
            else if (log.type === "collect") logColor = "#10b981";
            else if (log.type === "sell") logColor = "#FF2400";
            else if (log.type === "unlock") logColor = "#8b5cf6";
            else if (log.type === "move") logColor = "#64748b";
            else if (log.type === "resources") logColor = "#64748b";

            return (
              <div
                key={log.id || idx}
                style={{
                  marginBottom: "8px",
                  padding: "6px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${logColor}`,
                }}
              >
                {/* Header with count (already formatted in log.message) */}
                <div
                  style={{
                    fontWeight: "bold",
                    color: logColor,
                    fontSize: "13px",
                    marginBottom: "2px",
                  }}
                >
                  {log.message || "Unknown event"}
                </div>

                {/* Resources (already formatted in log.formattedResources) */}
                {log.formattedResources && (
                  <div
                    style={{
                      fontSize: "11px",
                      color: "#94a3b8",
                      marginBottom: log.formattedDetail ? "2px" : "0",
                    }}
                  >
                    {log.formattedResources}
                  </div>
                )}

                {/* Detail (Cost/Yield/Refund - already formatted) */}
                {log.formattedDetail && (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#64748b",
                      fontStyle: "italic",
                    }}
                  >
                    {log.formattedDetail}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
