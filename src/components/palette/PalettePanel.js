import React from "react";
import Palette from "./Palette";

export default function PalettePanel({
  paletteGroups,
  selectedType,
  setSelectedType,
  onEdit,
  onCreate,
}) {
  return (
    <div
      style={{ width: 320, padding: 12, background: "rgba(255,255,255,0.02)" }}
    >
      <Palette
        paletteGroups={paletteGroups}
        onSelect={setSelectedType}
        onEdit={onEdit}
        onDelete={() => {}} // can be wired later
        onCreate={onCreate}
      />

      <div style={{ marginTop: 12 }}>
        <strong>Selected</strong>
        <div
          style={{
            padding: 8,
            marginTop: 6,
            background: "rgba(255,255,255,0.01)",
          }}
        >
          {selectedType ? (
            <div>
              {selectedType.name} ({selectedType.w}x{selectedType.h})
            </div>
          ) : (
            "(none)"
          )}
        </div>
      </div>
    </div>
  );
}
