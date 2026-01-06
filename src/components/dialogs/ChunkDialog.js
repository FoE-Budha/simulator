import React from "react";
import "./Dialog.css";

export default function ChunkDialog({
  chunk,
  unlockCounts = { shards: 0, goods: 0 },
  onClose,
  onUnlock,
}) {
  // Pricing
  const shardPrices = [100, 150, 200, 250, 300, 350, 400, 450, 500];
  const goodsPrices = [30, 60, 90, 130, 180, 240, 310, 390, 480];

  const currentShardPrice =
    shardPrices[Math.min(unlockCounts.shards, shardPrices.length - 1)];
  const currentGoodsPrice =
    goodsPrices[Math.min(unlockCounts.goods, goodsPrices.length - 1)];
  const nextShardPrice =
    shardPrices[Math.min(unlockCounts.shards + 1, shardPrices.length - 1)];
  const nextGoodsPrice =
    goodsPrices[Math.min(unlockCounts.goods + 1, goodsPrices.length - 1)];

  return (
    <div className="building-dialog-overlay" onClick={onClose}>
      <div
        className="building-dialog-content"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="building-dialog-title">Unlock Expansion</h3>

        <div className="building-dialog-field">
          <p className="chunk-dialog-info-text">
            This expansion is locked. Unlock it to build here.
          </p>
        </div>

        {/* Shards Button */}
        <div className="building-dialog-field">
          <button
            className="button chunk-dialog-button-shards"
            onClick={() =>
              onUnlock(`${chunk.cx},${chunk.cy}`, {
                type: "shards",
                amount: currentShardPrice,
              })
            }
          >
            Unlock with {currentShardPrice} Shards
          </button>
          {unlockCounts.shards > 0 && (
            <div className="chunk-dialog-count">
              Already unlocked {unlockCounts.shards} expansion(s) with shards
            </div>
          )}
        </div>

        {/* Goods Button */}
        <div className="building-dialog-field" style={{ marginBottom: "24px" }}>
          <button
            className="button chunk-dialog-button-goods"
            onClick={() =>
              onUnlock(`${chunk.cx},${chunk.cy}`, {
                type: "goods",
                amount: currentGoodsPrice,
              })
            }
          >
            Unlock with {currentGoodsPrice} Goods
          </button>
          {unlockCounts.goods > 0 && (
            <div className="chunk-dialog-count">
              Already unlocked {unlockCounts.goods} expansion(s) with goods
            </div>
          )}
        </div>

        {/* Next Costs */}
        <div className="building-dialog-section">
          <div className="building-dialog-section-title">Next Unlock Cost</div>
          <div className="building-dialog-grid">
            <div className="building-dialog-field">
              <label className="building-dialog-label">Shards</label>
              <div className="chunk-dialog-cost-display chunk-dialog-cost-shards">
                {nextShardPrice}
              </div>
            </div>

            <div className="building-dialog-field">
              <label className="building-dialog-label">Goods</label>
              <div className="chunk-dialog-cost-display chunk-dialog-cost-goods">
                {nextGoodsPrice}
              </div>
            </div>
          </div>
        </div>

        <div className="building-dialog-actions">
          <button
            type="button"
            className="button small building-dialog-cancel"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
