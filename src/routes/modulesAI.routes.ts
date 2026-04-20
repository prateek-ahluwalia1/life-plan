import { Router } from "express";
import modulesAIController from "../controllers/modulesAI.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

// ==================== GETTING STARTED MODULE ====================

// Get AI-generated opening questions
router.get(
  "/getting-started/ai-questions",
  authMiddleware,
  modulesAIController.getAIGettingStartedQuestions
);

// Get follow-up questions for a specific domain
router.post(
  "/getting-started/ai-followup",
  authMiddleware,
  modulesAIController.getAIGettingStartedFollowUp
);

// ==================== WHERE I AM NOW MODULE ====================

// Get AI-generated assessment questions
router.get(
  "/where-i-am-now/ai-questions",
  authMiddleware,
  modulesAIController.getAIWhereIAmNowQuestions
);

// Get contextual follow-up for a specific response
router.post(
  "/where-i-am-now/ai-followup",
  authMiddleware,
  modulesAIController.getAIWhereIAmNowFollowUp
);

export default router;
