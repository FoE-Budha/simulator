import React from "react";
import "./PalettePanel.css";
import { formatNumber } from "../../utils.js";

export default function PalettePanel({
  paletteGroups,
  selectedType,
  setSelectedType,
  onEdit,
  onCreate,
}) {
  // Fixed group order
  const GROUP_ORDER = [
    "residential",
    "production",
    "cultural",
    "goods",
    "army",
    "decorations",
  ];

  // Load persistent collapse state from storage - collapsed by default
  const [collapseState, setCollapseState] = React.useState(() => {
    try {
      const saved = localStorage.getItem("paletteCollapse");
      if (saved) {
        return JSON.parse(saved);
      } else {
        // Default to all groups collapsed
        const defaultCollapsed = {};
        GROUP_ORDER.forEach((group) => {
          defaultCollapsed[
            group.charAt(0).toUpperCase() + group.slice(1)
          ] = false;
        });
        return defaultCollapsed;
      }
    } catch {
      // Return all collapsed by default
      const defaultCollapsed = {};
      GROUP_ORDER.forEach((group) => {
        defaultCollapsed[
          group.charAt(0).toUpperCase() + group.slice(1)
        ] = false;
      });
      return defaultCollapsed;
    }
  });

  const handleGroupToggle = (groupName) => {
    const newState = {
      ...collapseState,
      [groupName]: !(collapseState[groupName] ?? false),
    };
    setCollapseState(newState);
    localStorage.setItem("paletteCollapse", JSON.stringify(newState));
  };

  // Sort items by tier - handles both numeric and string tiers (T1, T2, etc.)
  const sortItemsByTier = (items) => {
    return [...items].sort((a, b) => {
      // Extract tier values
      const tierA = extractTierNumber(a.tier);
      const tierB = extractTierNumber(b.tier);

      // If tiers are equal, sort by name
      if (tierA === tierB) {
        return (a.name || "").localeCompare(b.name || "");
      }

      return tierA - tierB;
    });
  };

  // Helper function to extract numeric tier from various formats
  const extractTierNumber = (tierValue) => {
    if (tierValue === undefined || tierValue === null) return 0;

    // If it's already a number
    if (typeof tierValue === "number") return tierValue;

    // If it's a string, try to extract numbers
    if (typeof tierValue === "string") {
      // Remove non-numeric characters and parse
      const match = tierValue.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    }

    return 0;
  };

  // Helper to format tier display
  const formatTierDisplay = (tier) => {
    if (!tier && tier !== 0) return "";

    // If tier is already a string with T prefix, use as-is
    if (typeof tier === "string" && tier.toUpperCase().startsWith("T")) {
      return tier;
    }

    // Otherwise, add T prefix
    return `T${tier}`;
  };

  return (
    <div className="palette-panel">
      <div className="palette-header">
        <strong>Building Palette</strong>
        <button className="button small" onClick={onCreate}>
          + New
        </button>
      </div>

      {GROUP_ORDER.map((groupKey) => {
        // Check if group exists in paletteGroups
        if (!paletteGroups[groupKey]) return null;

        const groupName = groupKey.charAt(0).toUpperCase() + groupKey.slice(1);
        const isOpen = collapseState[groupName] ?? false; // Default to collapsed
        const items = sortItemsByTier(paletteGroups[groupKey]);

        return (
          <div key={groupKey} className="palette-group">
            <div
              className="palette-group-header"
              onClick={() => handleGroupToggle(groupName)}
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && handleGroupToggle(groupName)
              }
            >
              <strong>
                {groupName}
                <span className="palette-group-count"> ({items.length})</span>
              </strong>
              <div className="palette-group-arrow">{isOpen ? "▾" : "▸"}</div>
            </div>

            {isOpen && (
              <div className="palette-items">
                {items.map((item) => {
                  const isSelected = selectedType?.id === item.id;
                  const tierDisplay = formatTierDisplay(item.tier);

                  return (
                    <div
                      key={item.id}
                      className={`palette-item ${isSelected ? "selected" : ""}`}
                    >
                      <div
                        className="palette-item-content"
                        onClick={() => setSelectedType(item)}
                      >
                        <div className="palette-item-name">
                          {item.name} {tierDisplay && `${tierDisplay} `}
                          {item.w}x{item.h}
                        </div>
                        <div className="palette-item-details">
                          {/* Only show costs if they are greater than 0 */}
                          {item.cost_coins > 0 &&
                            ` C: ${formatNumber(item.cost_coins)} •`}
                          {item.cost_supplies > 0 &&
                            ` S: ${formatNumber(item.cost_supplies)} •`}
                          {item.cost_alloy > 0 &&
                            ` Alloy: ${formatNumber(item.cost_alloy)} `}
                          {/* Show nothing if all costs are 0 or undefined */}
                          {(!item.cost_coins || item.cost_coins <= 0) &&
                            (!item.cost_supplies || item.cost_supplies <= 0) &&
                            (!item.cost_alloy || item.cost_alloy <= 0) &&
                            " • Free"}
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
