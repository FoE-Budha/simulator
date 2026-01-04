import React from "react";
import "./PalettePanel.css";

export default function PalettePanel({
  paletteGroups,
  selectedType,
  setSelectedType,
  onEdit,
  onCreate,
}) {
  // Load persistent collapse state from storage
  const [collapseState, setCollapseState] = React.useState(() => {
    try {
      const saved = localStorage.getItem("paletteCollapse");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleGroupToggle = (groupName) => {
    const newState = { ...collapseState, [groupName]: !(collapseState[groupName] ?? true) };
    setCollapseState(newState);
    localStorage.setItem("paletteCollapse", JSON.stringify(newState));
  };

  return (
    <div className="palette-panel">
      <div className="palette-header">
        <strong>Building Palette</strong>
        <button className="button small" onClick={onCreate}>
          + New
        </button>
      </div>

      {Object.keys(paletteGroups)
        .sort()
        .map((groupKey) => {
          const groupName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
          const isOpen = collapseState[groupName] ?? true;
          const items = paletteGroups[groupKey];

          return (
            <div key={groupKey} className="palette-group">
              <div
                className="palette-group-header"
                onClick={() => handleGroupToggle(groupName)}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleGroupToggle(groupName)}
              >
                <strong>
                  {groupName}
                  <span className="palette-group-count"> ({items.length})</span>
                </strong>
                <div className="palette-group-arrow">
                  {isOpen ? "▾" : "▸"}
                </div>
              </div>

              {isOpen && (
                <div className="palette-items">
                  {items.map((item) => {
                    const isSelected = selectedType?.id === item.id;
                    
                    return (
                      <div
                        key={item.id}
                        className={`palette-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div 
                          className="palette-item-content"
                          onClick={() => setSelectedType(item)}
                        >
                          <div className="palette-item-name">{item.name} {item.tier} {item.w}x{item.h}</div>
                          <div className="palette-item-details">
                            {item.cost_coins && ` • ${item.cost_coins} coins`}
                            {item.cost_supplies && ` • ${item.cost_supplies} supplies`}
                            {item.cost_alloy && ` • ${item.cost_alloy} alloy`}
                          </div>
                        </div>
                        <div className="palette-actions">
                          <button
                            className="button small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}