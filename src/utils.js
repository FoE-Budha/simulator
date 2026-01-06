export function uuid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export function rectsOverlap(a, b) {
  return !(
    a.x + a.w <= b.x ||
    b.x + b.w <= a.x ||
    a.y + a.h <= b.y ||
    b.y + b.h <= a.y
  );
}

// ===== NUMBERS FORMATING =====

export const formatNumber = (num) => {
  if (num == null || isNaN(num)) return "0";
  const number = typeof num === "string" ? parseFloat(num) : num;
  return number.toLocaleString("en-US");
};

// ===== LOG FUNCTIONS =====

// Add this ONE function to replace all the separate ones:

/**
 * Create a unified log for any action
 * @param {string} type - "build", "collect", "sell", "move", "unlock", "resources"
 * @param {string} action - The action text: "Built House", "Collected from Farm", etc.
 * @param {object} resources - Current resources after the action
 * @param {object} delta - The change in resources (cost/yield/refund)
 * @param {object} metadata - Additional info like building name, coordinates, etc.
 */
export function createActionLog(
  type,
  action,
  resources,
  delta = {},
  metadata = {}
) {
  const id = uuid("log_");

  // Format the detail line if there's a delta
  let formattedDetail = "";
  if (Object.keys(delta).length > 0) {
    const parts = [];
    const refundParts = [];

    // Handle regular resources (Yield)
    if (delta.coins && delta.coins !== 0) {
      const sign = delta.coins > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.coins))} coins`);
    }
    if (delta.supplies && delta.supplies !== 0) {
      const sign = delta.supplies > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.supplies))} supplies`);
    }
    if (delta.alloy && delta.alloy !== 0) {
      const sign = delta.alloy > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.alloy))} alloy`);
    }
    if (delta.shards && delta.shards !== 0) {
      const sign = delta.shards > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.shards))} shards`);
    }
    if (delta.goods && delta.goods !== 0) {
      const sign = delta.goods > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.goods))} goods`);
    }
    if (delta.quantum && delta.quantum !== 0) {
      const sign = delta.quantum > 0 ? "+" : "";
      parts.push(`${sign}${formatNumber(Math.abs(delta.quantum))} quantum`);
    }

    // Handle refund resources separately
    if (delta.refundCoins && delta.refundCoins !== 0) {
      const sign = delta.refundCoins > 0 ? "+" : "";
      refundParts.push(
        `${sign}${formatNumber(Math.abs(delta.refundCoins))} coins`
      );
    }
    if (delta.refundSupplies && delta.refundSupplies !== 0) {
      const sign = delta.refundSupplies > 0 ? "+" : "";
      refundParts.push(
        `${sign}${formatNumber(Math.abs(delta.refundSupplies))} supplies`
      );
    }
    if (delta.refundAlloy && delta.refundAlloy !== 0) {
      const sign = delta.refundAlloy > 0 ? "+" : "";
      refundParts.push(
        `${sign}${formatNumber(Math.abs(delta.refundAlloy))} alloy`
      );
    }

    // Build the formatted detail based on type
    if (type === "sell" && (parts.length > 0 || refundParts.length > 0)) {
      const yieldStr = parts.length > 0 ? `Yield: ${parts.join(", ")}` : "";
      const refundStr =
        refundParts.length > 0 ? `Refund: ${refundParts.join(", ")}` : "";

      if (yieldStr && refundStr) {
        formattedDetail = `${yieldStr} | ${refundStr}`;
      } else {
        formattedDetail = yieldStr || refundStr;
      }
    } else if (type === "build" || type === "unlock") {
      if (parts.length > 0) {
        formattedDetail = `Cost: ${parts.join(", ")}`;
      }
    } else if (type === "collect") {
      if (parts.length > 0) {
        formattedDetail = `Yield: ${parts.join(", ")}`;
      }
    }
    // move and resources types don't have delta details
  }

  // Format resources line (coins, supplies, alloy, shards)
  const resourceParts = [];
  if (resources.coins !== undefined && resources.coins !== null) {
    resourceParts.push(`${formatNumber(resources.coins)} coins`);
  }
  if (resources.supplies !== undefined && resources.supplies !== null) {
    resourceParts.push(`${formatNumber(resources.supplies)} supplies`);
  }
  if (resources.alloy !== undefined && resources.alloy !== null) {
    resourceParts.push(`${formatNumber(resources.alloy)} alloy`);
  }
  if (resources.shards !== undefined && resources.shards !== null) {
    resourceParts.push(`${formatNumber(resources.shards)} shards`);
  }
  const formattedResources = resourceParts.join(", ");

  return {
    id,
    type,
    action, // The base action text (for merging)
    message: `1x ${action}`, // Changed from "(1)" to "1x"
    resources,
    delta,
    metadata,
    formattedResources,
    formattedDetail,
    count: 1,
  };
}

/**
 * Merge a new log with previous logs
 */
export function mergeLog(newLog, previousLogs = []) {
  if (previousLogs.length === 0) {
    return [newLog];
  }

  const lastLog = previousLogs[previousLogs.length - 1];

  // Check if we can merge:
  // 1. Same type
  // 2. Same action text (for build/collect/sell/move - means same building)
  // 3. For unlock: same resource type
  let canMerge = false;

  if (lastLog.type === newLog.type) {
    if (newLog.type === "unlock") {
      // For unlocks, merge if same resource type
      const lastResource = Object.keys(lastLog.delta || {})[0];
      const newResource = Object.keys(newLog.delta || {})[0];
      canMerge = lastResource === newResource;
    } else if (newLog.type === "resources") {
      // Don't merge resource updates
      canMerge = false;
    } else {
      // For others, merge if same action (same building)
      canMerge = lastLog.action === newLog.action;
    }
  }

  if (canMerge) {
    const mergedCount = lastLog.count + 1;

    // Sum deltas for ALL log types
    const mergedDelta = { ...lastLog.delta };
    Object.keys(newLog.delta || {}).forEach((key) => {
      const newValue = newLog.delta[key] || 0;
      const lastValue = lastLog.delta[key] || 0;
      mergedDelta[key] = lastValue + newValue;
    });

    // Recalculate the detail line with summed delta
    let mergedFormattedDetail = "";
    if (newLog.formattedDetail) {
      // Recreate the detail using the same logic as createActionLog
      const parts = [];
      const refundParts = [];

      // Handle regular resources
      if (mergedDelta.coins && mergedDelta.coins !== 0) {
        const sign = mergedDelta.coins > 0 ? "+" : "";
        parts.push(`${sign}${formatNumber(Math.abs(mergedDelta.coins))} coins`);
      }
      if (mergedDelta.supplies && mergedDelta.supplies !== 0) {
        const sign = mergedDelta.supplies > 0 ? "+" : "";
        parts.push(
          `${sign}${formatNumber(Math.abs(mergedDelta.supplies))} supplies`
        );
      }
      if (mergedDelta.alloy && mergedDelta.alloy !== 0) {
        const sign = mergedDelta.alloy > 0 ? "+" : "";
        parts.push(`${sign}${formatNumber(Math.abs(mergedDelta.alloy))} alloy`);
      }
      if (mergedDelta.shards && mergedDelta.shards !== 0) {
        const sign = mergedDelta.shards > 0 ? "+" : "";
        parts.push(
          `${sign}${formatNumber(Math.abs(mergedDelta.shards))} shards`
        );
      }
      if (mergedDelta.goods && mergedDelta.goods !== 0) {
        const sign = mergedDelta.goods > 0 ? "+" : "";
        parts.push(`${sign}${formatNumber(Math.abs(mergedDelta.goods))} goods`);
      }
      if (mergedDelta.quantum && mergedDelta.quantum !== 0) {
        const sign = mergedDelta.quantum > 0 ? "+" : "";
        parts.push(
          `${sign}${formatNumber(Math.abs(mergedDelta.quantum))} quantum`
        );
      }

      // Handle refund resources
      if (mergedDelta.refundCoins && mergedDelta.refundCoins !== 0) {
        const sign = mergedDelta.refundCoins > 0 ? "+" : "";
        refundParts.push(
          `${sign}${formatNumber(Math.abs(mergedDelta.refundCoins))} coins`
        );
      }
      if (mergedDelta.refundSupplies && mergedDelta.refundSupplies !== 0) {
        const sign = mergedDelta.refundSupplies > 0 ? "+" : "";
        refundParts.push(
          `${sign}${formatNumber(
            Math.abs(mergedDelta.refundSupplies)
          )} supplies`
        );
      }
      if (mergedDelta.refundAlloy && mergedDelta.refundAlloy !== 0) {
        const sign = mergedDelta.refundAlloy > 0 ? "+" : "";
        refundParts.push(
          `${sign}${formatNumber(Math.abs(mergedDelta.refundAlloy))} alloy`
        );
      }

      // Build the formatted detail based on type
      if (
        newLog.type === "sell" &&
        (parts.length > 0 || refundParts.length > 0)
      ) {
        const yieldStr = parts.length > 0 ? `Yield: ${parts.join(", ")}` : "";
        const refundStr =
          refundParts.length > 0 ? `Refund: ${refundParts.join(", ")}` : "";

        if (yieldStr && refundStr) {
          mergedFormattedDetail = `${yieldStr} | ${refundStr}`;
        } else {
          mergedFormattedDetail = yieldStr || refundStr;
        }
      } else if (newLog.type === "build" || newLog.type === "unlock") {
        if (parts.length > 0) {
          mergedFormattedDetail = `Cost: ${parts.join(", ")}`;
        }
      } else if (newLog.type === "collect") {
        if (parts.length > 0) {
          mergedFormattedDetail = `Yield: ${parts.join(", ")}`;
        }
      }
    }

    // Create merged log
    const mergedLog = {
      ...lastLog,
      count: mergedCount,
      message: `${mergedCount}x ${newLog.action}`,
      resources: newLog.resources,
      delta: mergedDelta,
      formattedResources: newLog.formattedResources,
      formattedDetail: mergedFormattedDetail,
      // Keep the latest metadata
      metadata: { ...lastLog.metadata, ...newLog.metadata },
    };

    return [...previousLogs.slice(0, -1), mergedLog];
  }

  // Can't merge, add as new log
  return [...previousLogs, newLog];
}
