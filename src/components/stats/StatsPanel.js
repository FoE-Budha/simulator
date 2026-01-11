import React from "react";
import { formatNumber } from "../../utils.js";
import "./StatsPanel.css";

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
    return <div className="loading-message">Loading...</div>;
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

  // Function to export logs as CSV
  const exportLogsCSV = () => {
    if (safeLogs.length === 0) return;

    // Create CSV content
    const headers = [
      "Timestamp",
      "Event Type",
      "Message",
      "Resources",
      "Details",
    ];
    const csvRows = [
      headers.join(","),
      ...safeLogs.map((log) => {
        const row = [
          log.timestamp || new Date().toISOString(),
          log.type || "unknown",
          log.message || "Unknown event",
          log.formattedResources || "",
          log.formattedDetail || "",
        ];

        // Escape special characters for CSV
        return row
          .map((cell) => {
            const cellStr = String(cell);
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",");
      }),
    ];

    const csvContent = csvRows.join("\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `game-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="stats-panel">
      {/* Resources Header Row */}
      <div className="resources-header">
        <strong className="resources-title">Resources</strong>
        <button
          className="button small edit-button"
          onClick={onOpenResourcesDialog}
        >
          Edit
        </button>
      </div>

      <div className="resources-section">
        <div>Coins: {formatNumber(safeResources.coins)}</div>
        <div>Supplies: {formatNumber(safeResources.supplies)}</div>
        <div>Goods: {formatNumber(safeResources.goods)}</div>
        <div>Shards: {formatNumber(safeResources.shards)}</div>
        <div>Alloy: {formatNumber(safeResources.alloy)}</div>
      </div>

      <div className="header">Stats</div>
      <div className="stats-section">
        <div>Population: {formatNumber(safeResources.population)}</div>
        <div>Euphoria: {formatNumber(safeResources.euphoria)}</div>
        <div>Coin Boost: {safeResources.coinBoost * 100}%</div>
        <div>Supplies Boost: {safeResources.suppliesBoost * 100}%</div>
        <div>Quantum Actions: {safeResources.quantumActions}</div>
        <div>Attack: {safeResources.attack * 100}%</div>
        <div>Defense: {safeResources.defense * 100}%</div>
      </div>

      {aggregates && (
        <>
          <div className="header">Aggregates</div>
          <div className="aggregates-section">
            <div>Euphoria Ratio: {aggregates.euphRatio || 0}%</div>
            <div>Multiplier: {(aggregates.eupMultiplier || 1).toFixed(2)}x</div>
            <div>Final Coins: {aggregates.finalCoins || 0}</div>
            <div>Final Supplies: {aggregates.finalSupplies || 0}</div>
          </div>
        </>
      )}

      <div className="header">Actions</div>
      <div className="actions-section">
        <button
          className="button small"
          onClick={() =>
            saveSnapshot(`Snapshot ${(snapshots || []).length + 1}`)
          }
        >
          Save Snapshot
        </button>
        <button className="button small" onClick={() => compareSnapshot()}>
          Compare Snapshots
        </button>
      </div>

      {/* Recent Logs with export button */}
      <div className="logs-header">
        <div className="header">Recent Logs</div>
        <button
          className="button small export-button"
          onClick={exportLogsCSV}
          disabled={safeLogs.length === 0}
          title="Export logs as CSV file (opens in Excel)"
        >
          Export Logs
        </button>
      </div>

      <div className="logs-container">
        {safeLogs.length === 0 ? (
          <div className="no-logs-message">No logs yet</div>
        ) : (
          safeLogs.slice(-10).map((log, idx) => {
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
                className="log-entry"
                style={{ borderLeftColor: logColor }}
              >
                {/* Header with count (already formatted in log.message) */}
                <div className="log-message" style={{ color: logColor }}>
                  {log.message || "Unknown event"}
                </div>

                {/* Resources (already formatted in log.formattedResources) */}
                {log.formattedResources && (
                  <div className="log-resources">{log.formattedResources}</div>
                )}

                {/* Detail (Cost/Yield/Refund - already formatted) */}
                {log.formattedDetail && (
                  <div className="log-detail">{log.formattedDetail}</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
