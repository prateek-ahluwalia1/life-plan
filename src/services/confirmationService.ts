/**
 * In-memory confirmation token storage
 * Stores temporary confirmation IDs for module restart requests
 * Auto-expires after 5 minutes (300000ms)
 */

interface ConfirmationToken {
  userId: string;
  action: string;
  createdAt: number;
  expiresAt: number;
}

const confirmationTokens = new Map<string, ConfirmationToken>();
const EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a unique confirmation ID
 */
const generateConfirmationId = (): string => {
  return `confirm_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Create a new confirmation token for a user action
 */
export const createConfirmationToken = (
  userId: string,
  action: string
): string => {
  const confirmationId = generateConfirmationId();
  const now = Date.now();

  confirmationTokens.set(confirmationId, {
    userId,
    action,
    createdAt: now,
    expiresAt: now + EXPIRATION_TIME,
  });

  // Clean up expired tokens periodically
  cleanupExpiredTokens();

  return confirmationId;
};

/**
 * Verify and consume a confirmation token
 * Returns true if valid, false if invalid/expired
 */
export const verifyConfirmationToken = (
  confirmationId: string,
  userId: string,
  action: string
): boolean => {
  const token = confirmationTokens.get(confirmationId);

  if (!token) {
    return false;
  }

  // Check if expired
  if (Date.now() > token.expiresAt) {
    confirmationTokens.delete(confirmationId);
    return false;
  }

  // Check if user and action match
  if (token.userId !== userId || token.action !== action) {
    return false;
  }

  // Consume the token (delete it so it can only be used once)
  confirmationTokens.delete(confirmationId);
  return true;
};

/**
 * Clean up expired tokens
 */
const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  for (const [confirmationId, token] of confirmationTokens.entries()) {
    if (now > token.expiresAt) {
      confirmationTokens.delete(confirmationId);
    }
  }
};

/**
 * Clear all tokens (useful for testing)
 */
export const clearAllTokens = (): void => {
  confirmationTokens.clear();
};
