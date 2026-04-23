/**
 * Follow-up Validation Service
 * 
 * SPECIFICATION-ALIGNED: Enforces max 2 follow-ups rule
 * This runs on both frontend and backend for defense-in-depth
 */

import type { Request, Response } from "express";

// Track follow-up attempts per session/cell
// In production, this would be persisted to database or Redis
const followUpTracker: Record<string, Record<string, number>> = {};

/**
 * Initialize follow-up tracking for a user session
 */
export const initializeFollowUpTracking = (userId: string): void => {
  if (!followUpTracker[userId]) {
    followUpTracker[userId] = {};
  }
};

/**
 * Generate cache key for a specific question
 */
const generateCacheKey = (
  domain: string,
  question: string,
  assessmentType?: string
): string => {
  const typeStr = assessmentType ? `_${assessmentType}` : "";
  return `${domain}_${question}${typeStr}`;
};

/**
 * Check if follow-up is allowed for this question
 * Returns { allowed: boolean, count: number, remainingFollowUps: number }
 */
export const canRequestFollowUp = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): { allowed: boolean; count: number; remaining: number } => {
  const cacheKey = generateCacheKey(domain, questionId, assessmentType);
  initializeFollowUpTracking(userId);

  const currentCount = followUpTracker[userId]?.[cacheKey] || 0;
  const allowed = currentCount < 2;
  const remaining = Math.max(0, 2 - currentCount);

  return { allowed, count: currentCount, remaining };
};

/**
 * Increment follow-up count for a question
 * Called when follow-up is successfully returned to user
 */
export const incrementFollowUpCount = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): number => {
  const cacheKey = generateCacheKey(domain, questionId, assessmentType);
  initializeFollowUpTracking(userId);

  const userTracker = followUpTracker[userId];
  if (!userTracker) {
    return 0;
  }

  const newCount = (userTracker[cacheKey] || 0) + 1;
  userTracker[cacheKey] = newCount;

  return newCount;
};

/**
 * Reset follow-up count (called when response is finalized)
 */
export const resetFollowUpCount = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): void => {
  const cacheKey = generateCacheKey(domain, questionId, assessmentType);
  if (followUpTracker[userId]) {
    delete followUpTracker[userId][cacheKey];
  }
};

/**
 * Clear all follow-up tracking for a user
 * Called on module reset
 */
export const clearFollowUpTracking = (userId: string): void => {
  delete followUpTracker[userId];
};

/**
 * Middleware for validating follow-up requests
 * Usage: router.post("/follow-up", validateFollowUpMiddleware, controller);
 */
export const validateFollowUpMiddleware =
  (req: any, res: Response, next: Function) => {
    const userId = req.user?.id;
    const { domain, questionId, assessmentType } = req.body;

    if (!userId || !domain || !questionId) {
      return res.status(400).json({
        error: "Missing required fields: userId, domain, questionId",
      });
    }

    const validation = canRequestFollowUp(userId, domain, questionId, assessmentType);

    if (!validation.allowed) {
      return res.status(429).json({
        error: "Maximum follow-ups reached for this question",
        details: {
          message: "SPECIFICATION COMPLIANCE: Maximum 2 follow-ups per question",
          current: validation.count,
          max: 2,
          remaining: validation.remaining,
        },
      });
    }

    // Attach validation result to request for use in controller
    req.followUpValidation = validation;
    req.followUpKey = generateCacheKey(domain, questionId, assessmentType);

    next();
  };

/**
 * Endpoint guard - validate follow-up request before generation
 */
export const guardFollowUpGeneration = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): { isAllowed: boolean; message: string } => {
  const validation = canRequestFollowUp(userId, domain, questionId, assessmentType);

  if (!validation.allowed) {
    return {
      isAllowed: false,
      message: `Maximum 2 follow-ups allowed. You have ${validation.count} follow-ups for this question. Reset response to start over.`,
    };
  }

  return { isAllowed: true, message: "" };
};

/**
 * After successful follow-up generation
 */
export const recordFollowUpGeneration = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): void => {
  const newCount = incrementFollowUpCount(userId, domain, questionId, assessmentType);
  console.log(`[Follow-up Tracking] User ${userId}: Domain ${domain}, Question ${questionId}, Follow-up count: ${newCount}/2`);
};

/**
 * Get follow-up status for a question
 */
export const getFollowUpStatus = (
  userId: string,
  domain: string,
  questionId: string,
  assessmentType?: string
): { used: number; available: number; maxReached: boolean } => {
  const validation = canRequestFollowUp(userId, domain, questionId, assessmentType);
  return {
    used: validation.count,
    available: validation.remaining,
    maxReached: validation.count >= 2,
  };
};

export default {
  initializeFollowUpTracking,
  canRequestFollowUp,
  incrementFollowUpCount,
  resetFollowUpCount,
  clearFollowUpTracking,
  validateFollowUpMiddleware,
  guardFollowUpGeneration,
  recordFollowUpGeneration,
  getFollowUpStatus,
};
