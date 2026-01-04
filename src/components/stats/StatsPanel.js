import React from "react";

export default function StatsPanel({
  resources,
  aggregates,
  logs,
  snapshots,
  lastCompare,
  saveSnapshot,
  compareSnapshot,
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
    <div style={{ width: "320px", padding: "12px", background: "rgba(255,255,255,0.03)" }}>
      <div className="header">Resources</div>
      <div style={{ marginBottom: "12px" }}>
        <div>Coins: {safeResources.coins}</div>
        <div>Supplies: {safeResources.supplies}</div>
        <div>Goods: {safeResources.goods}</div>
        <div>Alloy: {safeResources.alloy}</div>
      </div>

      <div className="header">Stats</div>
      <div style={{ marginBottom: "12px" }}>
        <div>Population: {safeResources.population}</div>
        <div>Euphoria: {safeResources.euphoria}</div>
        <div>Coin Boost: {safeResources.coinBoost*100}%</div>
        <div>Supplies Boost: {safeResources.suppliesBoost*100}%</div>
        <div>Quantum Actions: {safeResources.quantumActions}</div>
        <div>Attack: {safeResources.attack*100}%</div>
        <div>Defense: {safeResources.defense*100}%</div>
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
          onClick={() => saveSnapshot(`Snapshot ${(snapshots || []).length + 1}`)}
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
          <div style={{ color: "#94a3b8", fontStyle: "italic" }}>No logs yet</div>
        ) : (
          safeLogs.slice(-5).map((log, idx) => {
            // Determine color based on log type
            let logColor = "#94a3b8";
            if (log.type === "build") logColor = "#06b6d4";
            else if (log.type === "collect") logColor = "#10b981";
            else if (log.type === "sell") logColor = "#f59e0b";
            
            // Helper to format resources without zeros
            const formatResources = (resources) => {
              const parts = [];
              if (resources?.coins && resources.coins !== 0) parts.push(`${resources.coins} coins`);
              if (resources?.supplies && resources.supplies !== 0) parts.push(`${resources.supplies} supplies`);
              if (resources?.alloy && resources.alloy !== 0) parts.push(`${resources.alloy} alloy`);
              return parts.join(', ') || '0 resources';
            };
              // Format delta (cost/yield/refund) without zeros
              const formatDelta = (delta, prefix = '') => {
                const parts = [];
                if (delta?.coins && delta.coins !== 0) {
                  const sign = delta.coins > 0 ? '+' : '';
                  parts.push(`${sign}${delta.coins} coins`);
                }
                if (delta?.supplies && delta.supplies !== 0) {
                  const sign = delta.supplies > 0 ? '+' : '';
                  parts.push(`${sign}${delta.supplies} supplies`);
                }
                if (delta?.alloy && delta.alloy !== 0) {
                  const sign = delta.alloy > 0 ? '+' : '';
                  parts.push(`${sign}${delta.alloy} alloy`);
                }
                return parts.length > 0 ? `${prefix}${parts.join(', ')}` : '';
              };

            return (
              <div 
                key={log.id || idx} 
                style={{ 
                  marginBottom: "4px", 
                  color: logColor,
                  padding: "4px",
                  background: "rgba(255,255,255,0.02)",
                  borderRadius: "4px",
                  borderLeft: `3px solid ${logColor}`
                }}
              >
                <div style={{ 
                  fontWeight: "500",
                  fontSize: log.count > 1 ? "13px" : "12px"
                }}>
                  {log.count > 1 ? `(${log.count}) ` : ""}{log.message || "Unknown event"}
                </div>
                
                {/* Show current resources after the action */}
                <div style={{ fontSize: "11px", opacity: 0.7, marginTop: "2px" }}>
                  {formatResources(log.resources)}
                </div>
                
                {/* Show delta changes without zero values */}
                {log.details?.cost && (
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "1px" }}>
                    {formatDelta(log.details.cost, 'Cost: ')}
                  </div>
                )}
                {log.details?.yield && (
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "1px" }}>
                    {formatDelta(log.details.yield, 'Yield: ')}
                  </div>
                )}
                {log.details?.refund && (
                  <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "1px" }}>
                    {formatDelta(log.details.refund, 'Refund: ')}
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