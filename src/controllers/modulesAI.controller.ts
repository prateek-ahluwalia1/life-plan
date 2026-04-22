import type { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import GettingStartedModules from "../models/gettingStartedModules.model";
import WhereIAmNow from "../models/whereIAmNow.model";
import {
  generateGettingStartedQuestions,
  generateWhereIAmNowQuestions,
  generateDomainFollowUpQuestions,
  generateContextualFollowUp,
} from "../services/modules.ai.service";

// ==================== GETTING STARTED MODULE ====================

/**
 * GET /api/v1/modules/getting-started/ai-questions
 * Generate AI-powered opening questions for the Getting Started module
 */
export const getAIGettingStartedQuestions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email?.split("@")[0] || "Friend";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Generate AI questions (Only pass userName, as the service expects 1 argument)
    const questions = await generateGettingStartedQuestions(userName);

    return res.status(200).json({
      success: true,
      questions,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get AI Getting Started questions error:", error);
    return res.status(500).json({
      error: "Failed to generate questions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/v1/modules/getting-started/ai-followup
 * Generate follow-up questions for a specific domain
 */
export const getAIGettingStartedFollowUp = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email?.split("@")[0] || "Friend";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { domain, userContext, examples } = req.body || {};

    if (!domain || !userContext) {
      return res.status(400).json({
        error: "domain and userContext are required",
      });
    }

    const followupQuestions = await generateDomainFollowUpQuestions(
      domain,
      examples || [],
      userContext,
      userName // Pass user name for personalization
    );

    return res.status(200).json({
      success: true,
      domain,
      followupQuestions,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get AI Getting Started follow-up error:", error);
    return res.status(500).json({
      error: "Failed to generate follow-up questions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ==================== WHERE I AM NOW MODULE ====================

/**
 * GET /api/v1/modules/where-i-am-now/ai-questions
 * Generate AI-powered assessment questions
 */
export const getAIWhereIAmNowQuestions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email?.split("@")[0] || "Friend";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch existing data for context
    const existingData = await WhereIAmNow.findOne({ userId });

    // Generate AI questions
    const questions = await generateWhereIAmNowQuestions(
      userName,
      existingData?.toObject() || undefined
    );

    return res.status(200).json({
      success: true,
      questions,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get AI Where I Am Now questions error:", error);
    return res.status(500).json({
      error: "Failed to generate questions",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/v1/modules/where-i-am-now/ai-followup
 * Generate contextual follow-up for a specific response
 */
export const getAIWhereIAmNowFollowUp = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || req.user?.email?.split("@")[0] || "Friend";

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { domain, userResponse, assessmentType } = req.body || {};

    if (!domain || !userResponse || !assessmentType) {
      return res.status(400).json({
        error: "domain, userResponse, and assessmentType are required",
      });
    }

    const followUp = await generateContextualFollowUp(
      domain,
      userResponse,
      assessmentType as "right" | "wrong" | "confused" | "missing",
      undefined, // followUpCount
      userName // Pass user's name for personalization
    );

    return res.status(200).json({
      success: true,
      followUp,
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get AI Where I Am Now follow-up error:", error);
    return res.status(500).json({
      error: "Failed to generate follow-up",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default {
  getAIGettingStartedQuestions,
  getAIGettingStartedFollowUp,
  getAIWhereIAmNowQuestions,
  getAIWhereIAmNowFollowUp,
};