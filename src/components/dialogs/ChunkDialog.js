import React from "react";

export default function ChunkDialog({
  chunk,
  unlockCounts = { shards: 0, goods: 0 }, // Default to 0 if not provided
  onClose,
  onUnlock,
}) {
  // Pricing arrays (DO NOT MODIFY - these are the progression)
  const shardPrices = [
    100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
    850, 900, 950,
  ];

  const goodsPrices = [30, 60, 90, 130, 180, 240, 310, 390, 480, 580, 700];

  // Get current prices based on GLOBAL unlock counts
  const getCurrentShardPrice = () => {
    const count = unlockCounts.shards || 0;
    // If we've exceeded the array, use the last price
    return count >= shardPrices.length
      ? shardPrices[shardPrices.length - 1]
      : shardPrices[count];
  };

  const getCurrentGoodsPrice = () => {
    const count = unlockCounts.goods || 0;
    // If we've exceeded the array, use the last price
    return count >= goodsPrices.length
      ? goodsPrices[goodsPrices.length - 1]
      : goodsPrices[count];
  };

  const currentShardPrice = getCurrentShardPrice();
  const currentGoodsPrice = getCurrentGoodsPrice();
  const nextShardUnlockNumber = (unlockCounts.shards || 0) + 1;
  const nextGoodsUnlockNumber = (unlockCounts.goods || 0) + 1;

  // Handle unlock with shards
  const handleShardUnlock = () => {
    onUnlock(`${chunk.cx},${chunk.cy}`, {
      type: "shards",
      amount: currentShardPrice,
    });
  };

  // Handle unlock with goods
  const handleGoodsUnlock = () => {
    onUnlock(`${chunk.cx},${chunk.cy}`, {
      type: "goods",
      amount: currentGoodsPrice,
    });
  };

  // Escape key to close
  React.useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0b1220",
          padding: "20px",
          borderRadius: "8px",
          minWidth: "350px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: "15px", color: "#e6eef8" }}>
          Chunk ({chunk.cx}, {chunk.cy})
        </h3>

        <div style={{ marginBottom: "20px", color: "#94a3b8" }}>
          This chunk is locked. Unlock it to build here.
        </div>

        {/* Shards Option */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              marginBottom: "8px",
              color: "#06b6d4",
              fontWeight: "bold",
            }}
          >
            Unlock with Shards
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              color: "#cbd5e1",
              fontSize: "14px",
            }}
          >
            <span>
              Cost:{" "}
              <strong style={{ color: "#06b6d4" }}>{currentShardPrice}</strong>{" "}
              Shards
            </span>
            <span>Unlock #{nextShardUnlockNumber}</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: "#06b6d4",
              color: "#021827",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              transition: "background 0.2s",
            }}
            onClick={handleShardUnlock}
            onMouseOver={(e) => (e.target.style.background = "#0dc7e0")}
            onMouseOut={(e) => (e.target.style.background = "#06b6d4")}
          >
            Unlock with Shards
          </button>
          {unlockCounts.shards > 0 && (
            <div
              style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}
            >
              Already unlocked {unlockCounts.shards} chunk(s) with shards
            </div>
          )}
        </div>

        {/* Goods Option */}
        <div style={{ marginBottom: "25px" }}>
          <div
            style={{
              marginBottom: "8px",
              color: "#10b981",
              fontWeight: "bold",
            }}
          >
            Clear with Goods
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "12px",
              color: "#cbd5e1",
              fontSize: "14px",
            }}
          >
            <span>
              Cost:{" "}
              <strong style={{ color: "#10b981" }}>{currentGoodsPrice}</strong>{" "}
              Goods
            </span>
            <span>Clear #{nextGoodsUnlockNumber}</span>
          </div>
          <button
            style={{
              width: "100%",
              padding: "12px",
              background: "#10b981",
              color: "#021827",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
              transition: "background 0.2s",
            }}
            onClick={handleGoodsUnlock}
            onMouseOver={(e) => (e.target.style.background = "#34d399")}
            onMouseOut={(e) => (e.target.style.background = "#10b981")}
          >
            Clear with Goods
          </button>
          {unlockCounts.goods > 0 && (
            <div
              style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}
            >
              Already cleared {unlockCounts.goods} chunk(s) with goods
            </div>
          )}
        </div>

        {/* Progression Info */}
        <div
          style={{
            fontSize: "13px",
            color: "#94a3b8",
            marginBottom: "20px",
            padding: "12px",
            background: "rgba(255,255,255,0.05)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ marginBottom: "6px" }}>
            <strong>Price Progression:</strong>
          </div>
          <div style={{ marginBottom: "4px" }}>
            Shards: {shardPrices.slice(0, 5).join(" → ")}...
          </div>
          <div>Goods: {goodsPrices.slice(0, 5).join(" → ")}...</div>
          <div
            style={{ marginTop: "8px", fontSize: "12px", fontStyle: "italic" }}
          >
            Prices increase independently for each resource type
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <button
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.1)",
              color: "#e6eef8",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
            }}
            onClick={onClose}
            onMouseOver={(e) =>
              (e.target.background = "rgba(255,255,255,0.15)")
            }
            onMouseOut={(e) => (e.target.background = "rgba(255,255,255,0.1)")}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
