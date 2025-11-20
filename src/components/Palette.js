// Palette.js
import React from "react";

function Group({ name, items, onSelect, onEdit, onDelete }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(o => !o)}>
        <strong>{name}</strong>
        <div style={{ opacity: 0.8 }}>{open ? "▾" : "▸"}</div>
      </div>
      {open && (
        <div style={{ marginTop: 6 }}>
          {items.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 6, borderRadius: 6, marginBottom: 6, background: "rgba(255,255,255,0.02)", cursor: "pointer" }}>
              <div onClick={() => onSelect(p)} style={{ flex: 1 }}>
                <div style={{ fontSize: 14 }}>{p.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{p.w}x{p.h} • {p.group}</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="button small" onClick={(e) => { e.stopPropagation(); onEdit(p); }}>Edit</button>
                <button className="button small" onClick={(e) => { e.stopPropagation(); onDelete(p); }}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Palette({ paletteGroups, onSelect, onCreate, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <strong>Building Palette</strong>
        <button className="button small" onClick={onCreate}>+ New</button>
      </div>

      {Object.keys(paletteGroups).map((groupKey) => (
        <Group
          key={groupKey}
          name={groupKey.charAt(0).toUpperCase() + groupKey.slice(1)}
          items={paletteGroups[groupKey]}
          onSelect={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
