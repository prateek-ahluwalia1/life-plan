import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import moduleGatingMiddleware from "../middlewares/moduleGating.middleware";
import gettingStartedModulesController from "../controllers/gettingStartedModules.controller";

const router = Router();

router.get(
  "/getting-started-modules",
  authMiddleware,
  moduleGatingMiddleware("getting-started"),
  gettingStartedModulesController.getGettingStartedModules,
);
router.put(
  "/getting-started-modules",
  authMiddleware,
  moduleGatingMiddleware("getting-started"),
  gettingStartedModulesController.upsertGettingStartedModules,
);
router.delete(
  "/getting-started-modules",
  authMiddleware,
  moduleGatingMiddleware("getting-started"),
  gettingStartedModulesController.resetGettingStartedModules,
);
router.get(
  "/getting-started-modules/pdf",
  authMiddleware,
  moduleGatingMiddleware("getting-started"),
  gettingStartedModulesController.downloadGettingStartedModulesPdf,
);

export default router;
