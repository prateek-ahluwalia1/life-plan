import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import gettingStartedModulesController from "../controllers/gettingStartedModules.controller";

const router = Router();

router.get(
  "/getting-started-modules",
  authMiddleware,
  gettingStartedModulesController.getGettingStartedModules,
);
router.put(
  "/getting-started-modules",
  authMiddleware,
  gettingStartedModulesController.upsertGettingStartedModules,
);
router.delete(
  "/getting-started-modules",
  authMiddleware,
  gettingStartedModulesController.resetGettingStartedModules,
);
router.get(
  "/getting-started-modules/pdf",
  authMiddleware,
  gettingStartedModulesController.downloadGettingStartedModulesPdf,
);

export default router;
