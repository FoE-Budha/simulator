import React, { useState, useEffect } from "react";
import "./Dialog.css"; // Reuse the same styles

export default function ResourcesDialog({ resources, onSave, onClose }) {
  const [formData, setFormData] = useState({
    coins: 0,
    supplies: 0,
    goods: 0,
    shards: 0,
  });

  // Initialize form when component mounts or resources change
  useEffect(() => {
    if (resources) {
      setFormData({
        coins: resources.coins || 0,
        supplies: resources.supplies || 0,
        goods: resources.goods || 0,
        shards: resources.shards || 0,
      });
    }
  }, [resources]);

  const handleChange = (field, value) => {
    // Convert to number, but keep as string in state for empty input
    const numValue = value === "" ? "" : Number(value);
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Convert empty strings to 0
    const cleanedData = {};
    Object.entries(formData).forEach(([key, value]) => {
      cleanedData[key] = value === "" ? 0 : value;
    });

    onSave(cleanedData);
    onClose();
  };

  const resourceGroups = [
    {
      title: "Basic Resources",
      fields: [
        {
          key: "coins",
          label: "Coins",
          type: "number",
          step: "1000",
          min: "0",
        },
        {
          key: "supplies",
          label: "Supplies",
          type: "number",
          step: "1000",
          min: "0",
        },
        { key: "goods", label: "Goods", type: "number", step: "1", min: "0" },
        { key: "shards", label: "Shards", type: "number", step: "1", min: "0" },
      ],
    },
  ];

  return (
    <div className="building-dialog-overlay" onClick={onClose}>
      <div
        className="building-dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="building-dialog-title">Edit Resources</h3>

        <form onSubmit={handleSubmit}>
          {resourceGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="building-dialog-section">
              <div className="building-dialog-section-title">{group.title}</div>
              <div className="building-dialog-grid">
                {group.fields.map((field) => (
                  <div key={field.key} className="building-dialog-field">
                    <label className="building-dialog-label">
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      className="building-dialog-input"
                      value={formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      min={field.min}
                      step={field.step}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

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
              Update Resources
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
