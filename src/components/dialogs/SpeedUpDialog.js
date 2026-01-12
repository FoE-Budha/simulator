import React from "react";
import "./Dialog.css";

export default function MessageDialog({
  isOpen,
  title,
  message,
  type = "info", // "info", "success", "warning", "error"
  onClose,
  onConfirm,
  confirmText = "OK",
  showCancel = false,
  cancelText = "Cancel",
}) {
  if (!isOpen) return null;

  // Determine styles based on type
  const typeStyles = {
    info: { bg: "#0b1a2a", border: "#06b6d4", icon: "ℹ️" },
    success: { bg: "#0b1a2a", border: "#10b981", icon: "✅" },
    warning: { bg: "#0b1a2a", border: "#f59e0b", icon: "⚠️" },
    error: { bg: "#0b1a2a", border: "#ef4444", icon: "❌" },
  };

  const style = typeStyles[type] || typeStyles.info;

  return (
    <div className="dialog-overlay">
      <div 
        className="message-dialog"
        style={{
          background: style.bg,
          border: `2px solid ${style.border}`,
        }}
      >
        <div className="dialog-header">
          <div className="dialog-title">
            <span style={{ marginRight: "8px" }}>{style.icon}</span>
            {title}
          </div>
          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="dialog-content">
          <div className="dialog-message">
            {message}
          </div>
        </div>
        
        <div className="dialog-footer">
          {showCancel && (
            <button
              className="dialog-button dialog-button-cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button
            className="dialog-button dialog-button-confirm"
            onClick={() => {
              onConfirm?.();
              onClose();
            }}
            style={{ backgroundColor: style.border }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}