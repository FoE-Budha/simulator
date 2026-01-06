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

/**
 * Create a new log entry with automatic merging
 */
export function createLog(newLog, previousLogs = []) {
  // If no previous logs, just return the new one
  if (previousLogs.length === 0) {
    return [{ ...newLog, count: 1 }];
  }

  const lastLog = previousLogs[previousLogs.length - 1];

  // Check if we can merge with the last log
  let canMerge = false;

  if (lastLog.type === newLog.type) {
    // Different merging rules for different log types
    switch (newLog.type) {
      case "build":
        // Merge if same building AND same coordinates
        if (lastLog.details?.building === newLog.details?.building) {
          const lastCoords = lastLog.details?.coordinates;
          const newCoords = newLog.details?.coordinates;

          if (
            lastCoords &&
            newCoords &&
            lastCoords.x === newCoords.x &&
            lastCoords.y === newCoords.y
          ) {
            canMerge = true;
          }
        }
        break;

      case "collect":
      case "sell":
        // Merge if same building
        if (lastLog.details?.building === newLog.details?.building) {
          canMerge = true;
        }
        break;

      case "unlock":
        // Merge if same chunk
        if (lastLog.details?.chunk === newLog.details?.chunk) {
          canMerge = true;
        }
        break;

      default:
        // For other types, don't merge
        canMerge = false;
    }
  }

  if (canMerge) {
    // Merge logs
    const mergedCount = (lastLog.count || 1) + 1;
    const mergedLog = {
      ...lastLog,
      count: mergedCount,
      resources: newLog.resources,
      message: `${mergedCount}x ${newLog.message
        .replace(/^\d+x\s/, "")
        .replace(/^\(\d+\)\s/, "")}`,
    };

    // Replace last log with merged one
    return [...previousLogs.slice(0, -1), mergedLog];
  }

  // Can't merge, add as new log
  return [...previousLogs, { ...newLog, count: 1 }];
}

/**
 * Create a standardized build log
 */
export function createBuildLog(buildingName, cost, resources, coordinates) {
  return {
    id: uuid("log_"),
    type: "build",
    message: `Built ${buildingName}`,
    resources: resources,
    details: {
      building: buildingName,
      cost: cost,
      coordinates: coordinates,
    },
  };
}

/**
 * Create a standardized collect log
 */
export function createCollectLog(buildingName, yieldAmount, resources) {
  return {
    id: uuid("log_"),
    type: "collect",
    message: `Collected from ${buildingName}`,
    resources: resources,
    details: {
      building: buildingName,
      yield: yieldAmount,
    },
  };
}

/**
 * Create a standardized sell log
 */
export function createSellLog(buildingName, refund, resources) {
  return {
    id: uuid("log_"),
    type: "sell",
    message: `Sold ${buildingName}`,
    resources: resources,
    details: {
      building: buildingName,
      refund: refund,
    },
  };
}

/**
 * Create a standardized unlock log
 */
export function createUnlockLog(chunkKey, cost, resources, unlockNumber) {
  return {
    id: uuid("log_"),
    type: "unlock",
    message: `Unlocked chunk ${chunkKey}`,
    resources: resources,
    details: {
      chunk: chunkKey,
      cost: cost,
      unlockNumber: unlockNumber,
    },
  };
}

/**
 * Create a standardized resources update log
 */
export function createResourcesLog(resources) {
  return {
    id: uuid("log_"),
    type: "resources",
    message: "Manually updated resources",
    resources: resources,
    details: {
      action: "manual_update",
    },
  };
}

/**
 * Create a move log
 */
export function createMoveLog(buildingName, from, to, resources) {
  return {
    id: uuid("log_"),
    type: "move",
    message: `Moved ${buildingName}`,
    resources: resources,
    details: {
      building: buildingName,
      from: from,
      to: to,
    },
  };
}
