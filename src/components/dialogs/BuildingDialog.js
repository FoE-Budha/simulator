import React, { useState, useEffect } from "react";
import { uuid } from "../../utils";
import "./Dialog.css";

export default function BuildingDialog({
  building = null,
  onSave,
  onClose,
  paletteGroups,
}) {
  const isEditMode = building !== null;
  
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    group: "residential",
    width: 2,
    height: 2,
    tier: "T1",
    
    // Costs
    costCoins: 100,
    costSupplies: 50,
    costAlloy: 0,
    
    // Production
    producesCoins: 0,
    producesSupplies: 0,
    producesAlloy: 0,
    
    // Effects
    population: 0,
    euphoria: 0,
    coinBoost: 0,
    suppliesBoost: 0,
    attack: 0,
    defense: 0,
    quantumActions: 0,
  });

  const availableGroups = Object.keys(paletteGroups || {});

  // Initialize form
  useEffect(() => {
    if (building) {
      // Find which group this building belongs to
      let foundGroup = building.group || "residential";
      
      // If not in building object, search palette groups
      if (!building.group) {
        for (const [groupName, groupItems] of Object.entries(paletteGroups || {})) {
          if (groupItems.find(item => item.id === building.id)) {
            foundGroup = groupName;
            break;
          }
        }
      }

      setFormData({
        id: building.id,
        name: building.name || "",
        group: foundGroup,
        width: building.w || 2,
        height: building.h || 2,
        tier: building.tier || "T1",
        
        // Costs
        costCoins: Number(building.cost_coins) || 0,
        costSupplies: Number(building.cost_supplies) || 0,
        costAlloy: Number(building.cost_alloy) || 0,
        
        // Production
        producesCoins: Number(building.produces_coins) || 0,
        producesSupplies: Number(building.produces_supplies) || 0,
        producesAlloy: Number(building.produces_alloy) || 0,
        
        // Effects
        population: Number(building.population) || 0,
        euphoria: Number(building.euphoria) || 0,
        coinBoost: Number(building.coin_boost) || 0,
        suppliesBoost: Number(building.supplies_boost) || 0,
        attack: Number(building.attack) || 0,
        defense: Number(building.defense) || 0,
        quantumActions: Number(building.quantum_actions) || 0,
      });
    } else {
      // For new building, generate ID
      setFormData(prev => ({
        ...prev,
        id: uuid("building_")
      }));
    }
  }, [building, paletteGroups]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create building object with STANDARDIZED field names
    const buildingData = {
      id: formData.id,
      name: formData.name,
      w: parseInt(formData.width) || 1,
      h: parseInt(formData.height) || 1,
      tier: formData.tier,
      group: formData.group,
      
      // Costs
      cost_coins: parseInt(formData.costCoins) || 0,
      cost_supplies: parseInt(formData.costSupplies) || 0,
      cost_alloy: parseInt(formData.costAlloy) || 0,
      
      // Production
      produces_coins: parseInt(formData.producesCoins) || 0,
      produces_supplies: parseInt(formData.producesSupplies) || 0,
      produces_alloy: parseInt(formData.producesAlloy) || 0,
      
      // Effects
      population: parseInt(formData.population) || 0,
      euphoria: parseInt(formData.euphoria) || 0,
      coin_boost: parseFloat(formData.coinBoost) || 0,
      supplies_boost: parseFloat(formData.suppliesBoost) || 0,
      attack: parseFloat(formData.attack) || 0,
      defense: parseFloat(formData.defense) || 0,
      quantum_actions: parseInt(formData.quantumActions) || 0,
    };

    console.log("Saving building:", buildingData);
    onSave(buildingData, formData.group);
    onClose();
  };

  // Rest of the component (UI)
  return (
    <div className="building-dialog-overlay" onClick={onClose}>
      <div className="building-dialog-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="building-dialog-title">
          {isEditMode ? `Edit ${building.name}` : "Add New Building"}
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Basic Info*/}
          <div className="building-dialog-section building-dialog-section-basic">
            <div className="building-dialog-section-title">Basic Information</div>
            <div className="building-dialog-grid">
              <div className="building-dialog-field">
                <label className="building-dialog-label">Building Name</label>
                <input
                  type="text"
                  className="building-dialog-input"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Group</label>
                <select
                  className="building-dialog-select"
                  value={formData.group}
                  onChange={(e) => handleChange("group", e.target.value)}
                >
                  {availableGroups.map(group => (
                    <option key={group} value={group}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Width (cells)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="building-dialog-input"
                  value={formData.width}
                  onChange={(e) => handleChange("width", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Height (cells)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="building-dialog-input"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Tier</label>
                <select
                  className="building-dialog-select"
                  value={formData.tier}
                  onChange={(e) => handleChange("tier", e.target.value)}
                >
                  <option value="T1">Tier 1</option>
                  <option value="T2">Tier 2</option>
                  <option value="T3">Tier 3</option>
                </select>
              </div>
            </div>
          </div>

          {/* Costs*/}
          <div className="building-dialog-section building-dialog-section-costs">
            <div className="building-dialog-section-title">Construction Costs</div>
            <div className="building-dialog-grid building-dialog-grid-3">
              <div className="building-dialog-field">
                <label className="building-dialog-label">Coins</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.costCoins}
                  onChange={(e) => handleChange("costCoins", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Supplies</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.costSupplies}
                  onChange={(e) => handleChange("costSupplies", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Alloy</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.costAlloy}
                  onChange={(e) => handleChange("costAlloy", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Production*/}
          <div className="building-dialog-section building-dialog-section-production">
            <div className="building-dialog-section-title">Production (per hour)</div>
            <div className="building-dialog-grid building-dialog-grid-3">
              <div className="building-dialog-field">
                <label className="building-dialog-label">Coins</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.producesCoins}
                  onChange={(e) => handleChange("producesCoins", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Supplies</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.producesSupplies}
                  onChange={(e) => handleChange("producesSupplies", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Alloy</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.producesAlloy}
                  onChange={(e) => handleChange("producesAlloy", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Effects*/}
          <div className="building-dialog-section building-dialog-section-effects">
            <div className="building-dialog-section-title">Effects</div>
            <div className="building-dialog-grid">
              <div className="building-dialog-field">
                <label className="building-dialog-label">Population</label>
                <input
                  type="number"
                  className="building-dialog-input"
                  value={formData.population}
                  onChange={(e) => handleChange("population", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Euphoria</label>
                <input
                  type="number"
                  className="building-dialog-input"
                  value={formData.euphoria}
                  onChange={(e) => handleChange("euphoria", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Coin Boost (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="building-dialog-input"
                  value={formData.coinBoost}
                  onChange={(e) => handleChange("coinBoost", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Supplies Boost (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="building-dialog-input"
                  value={formData.suppliesBoost}
                  onChange={(e) => handleChange("suppliesBoost", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Attack</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="building-dialog-input"
                  value={formData.attack}
                  onChange={(e) => handleChange("attack", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Defense</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="building-dialog-input"
                  value={formData.defense}
                  onChange={(e) => handleChange("defense", e.target.value)}
                />
              </div>

              <div className="building-dialog-field">
                <label className="building-dialog-label">Quantum Actions</label>
                <input
                  type="number"
                  min="0"
                  className="building-dialog-input"
                  value={formData.quantumActions}
                  onChange={(e) => handleChange("quantumActions", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="building-dialog-actions">
            <button
              type="button"
              className="button small building-dialog-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button small building-dialog-submit"
            >
              {isEditMode ? "Save Changes" : "Add Building"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}