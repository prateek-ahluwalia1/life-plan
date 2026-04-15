/**
 * Module restart/reset utility with confirmation
 * Handles the restart flow: first request returns a challenge, second request with confirmation proceeds
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";

// In-memory store for restart confirmations (in production, use Redis or similar)
const restartConfirmations: Map<string, { timestamp: number; module: string }> =
  new Map();

const CONFIRMATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clean up expired confirmations
 */
const cleanupExpiredConfirmations = () => {
  const now = Date.now();
  for (const [key, value] of restartConfirmations) {
    if (now - value.timestamp > CONFIRMATION_TIMEOUT_MS) {
      restartConfirmations.delete(key);
    }
  }
};

/**
 * Generate a unique confirmation key for a user and module
 */
const generateConfirmationKey = (userId: string, module: string): string => {
  return `restart_${userId}_${module}_${Date.now()}`;
};

/**
 * Handle restart request - first call requests confirmation, second call executes
 * Returns { needsConfirmation: true, confirmationId: "..." } on first call
 * Returns { confirmed: true } on second call
 */
export const handleRestartRequest = (
  userId: string,
  module: string,
  confirmationId?: string,
): { needsConfirmation: true; confirmationId: string } | { confirmed: true } => {
  cleanupExpiredConnections();

  if (!confirmationId) {
    // First request - generate confirmation challenge
    const newConfirmationId = generateConfirmationKey(userId, module);
    restartConfirmations.set(newConfirmationId, {
      timestamp: Date.now(),
      module,
    });

    return {
      needsConfirmation: true,
      confirmationId: newConfirmationId,
    };
  }

  // Second request - verify confirmation
  const confirmation = restartConfirmations.get(confirmationId);

  if (!confirmation) {
    throw new Error("Invalid or expired confirmation ID");
  }

  if (confirmation.module !== module) {
    throw new Error("Confirmation ID does not match module");
  }

  // Cleanup
  restartConfirmations.delete(confirmationId);

  return { confirmed: true };
};

/**
 * Send restart confirmation response
 */
export const sendRestartConfirmationNeeded = (
  res: Response,
  confirmationId: string,
  moduleName: string,
) => {
  res.status(409).json({
    status: "confirmation_required",
    message: `Are you sure you want to restart the ${moduleName} module? This will clear all progress in this module.`,
    confirmationId,
    action: "Send DELETE request with confirmationId in body to proceed",
  });
};

/**
 * Send restart confirmed response
 */
export const sendRestartConfirmed = (res: Response, moduleName: string) => {
  res.status(200).json({
    message: `${moduleName} module has been reset successfully`,
    status: "reset_complete",
  });
};

// Cleanup helper to remove old confirmations
const cleanupExpiredConnections = () => {
  cleanupExpiredConfirmations();
};

export default {
  handleRestartRequest,
  sendRestartConfirmationNeeded,
  sendRestartConfirmed,
};
