// Palette.js
import React from "react";

function Group({
  name,
  items,
  onSelect,
  onEdit,
  onDelete,
  collapseState,
  setCollapseState,
}) {
  const open = collapseState[name] ?? true;

  function toggle() {
    const newState = { ...collapseState, [name]: !open };
    setCollapseState(newState);
    localStorage.setItem("paletteCollapse", JSON.stringify(newState));
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
          padding: "4px 6px",
          background: "rgba(255,255,255,0.06)",
          borderRadius: 6,
          userSelect: "none",
        }}
        onClick={toggle}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter") toggle();
        }}
      >
        <strong>
          {name}
          <span style={{ opacity: 0.7, fontWeight: 400 }}>
            {" "}
            ({items.length})
          </span>
        </strong>
        <div style={{ opacity: 0.8 }}>{open ? "▾" : "▸"}</div>
      </div>

      {open && (
        <div style={{ marginTop: 6 }}>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 6,
                borderRadius: 6,
                marginBottom: 6,
                background: "rgba(255,255,255,0.03)",
                cursor: "pointer",
              }}
            >
              <div onClick={() => onSelect(p)} style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {p.w}x{p.h} • {p.tier}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="button small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(p);
                  }}
                >
                  Edit
                </button>
                <button
                  className="button small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p);
                  }}
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Palette({
  paletteGroups,
  onSelect,
  onCreate,
  onEdit,
  onDelete,
}) {
  // --- Load persistent collapse state from storage ---
  const [collapseState, setCollapseState] = React.useState(() => {
    try {
      const saved = localStorage.getItem("paletteCollapse");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <strong>Building Palette</strong>
        <button className="button small" onClick={onCreate}>
          + New
        </button>
      </div>

      {Object.keys(paletteGroups)
        .sort()
        .map((groupKey) => {
          const groupName =
            groupKey.charAt(0).toUpperCase() + groupKey.slice(1);

          return (
            <Group
              key={groupKey}
              name={groupName}
              items={paletteGroups[groupKey]}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              collapseState={collapseState}
              setCollapseState={setCollapseState}
            />
          );
        })}
    </div>
  );
}
