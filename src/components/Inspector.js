// Inspector.js
import React from "react";

export default function Inspector({ totals, onSnapshot, snapshots, onCompare, onExport, onImport, onAddChunk, onClear }) {
  return (
    <div>
      <div style={{ marginBottom: 8 }}><strong>Stats</strong></div>
      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div>POPULATION: {totals.POPULATION}</div>
        <div>DEMAND: {totals.DEMAND}</div>
        <div>EUPHORIA: {totals.EUPHORIA}</div>
        <div>Ratio: {totals.ratio}%</div>
        <div>Multiplier: {totals.multiplier}×</div>
        <div>Chrono Alloy (10h): {totals.CHRONO_ALLOY}</div>
        <div>Goods (10h): {totals.GOODS_X}</div>
      </div>

      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={onSnapshot}>Capture Snapshot</button>
      </div>

      <div style={{ marginTop: 10 }}>
        <strong>Snapshots</strong>
        {snapshots.length === 0 && <div style={{ color: "var(--muted)", fontSize: 13 }}>No snapshots</div>}
        {snapshots.map((s, idx) => (
          <div key={s.id} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>{s.name}</div>
            <button className="button small" onClick={() => onCompare(s)}>Compare</button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Map Controls</strong>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="button small" onClick={() => onAddChunk('left')}>Add left</button>
          <button className="button small" onClick={() => onAddChunk('right')}>Add right</button>
          <button className="button small" onClick={() => onAddChunk('up')}>Add up</button>
          <button className="button small" onClick={() => onAddChunk('down')}>Add down</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button className="button small" onClick={onClear}>Clear All</button>
          <button className="button small" onClick={onExport}>Export</button>
          <label className="button small" style={{ cursor: "pointer", padding: 8 }}>
            Import
            <input type="file" accept="application/json" style={{ display: "none" }} onChange={onImport} />
          </label>
        </div>
      </div>
    </div>
  );
}
