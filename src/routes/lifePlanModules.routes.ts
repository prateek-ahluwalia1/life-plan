import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import moduleGatingMiddleware from "../middlewares/moduleGating.middleware";
import lifePlanModulesController from "../controllers/lifePlanModules.controller";

const router = Router();

router.get(
  "/life-plan-modules",
  authMiddleware,
  moduleGatingMiddleware("perspective"),
  lifePlanModulesController.getLifePlanModules,
);
router.put(
  "/life-plan-modules",
  authMiddleware,
  moduleGatingMiddleware("perspective"),
  lifePlanModulesController.upsertLifePlanModules,
);
router.delete(
  "/life-plan-modules",
  authMiddleware,
  moduleGatingMiddleware("perspective"),
  lifePlanModulesController.resetLifePlanModules,
);
router.get(
  "/life-plan-modules/pdf/:document",
  authMiddleware,
  moduleGatingMiddleware("perspective"),
  lifePlanModulesController.downloadLifePlanModulesPdf,
);

export default router;
