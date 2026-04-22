import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import moduleGatingMiddleware from "../middlewares/moduleGating.middleware";
import whereIAmNowController from "../controllers/whereIAmNow.controller";

const router = Router();

router.get(
  "/where-i-am-now",
  authMiddleware,
  whereIAmNowController.getWhereIAmNow,
);
router.put(
  "/where-i-am-now",
  authMiddleware,
  whereIAmNowController.upsertWhereIAmNow,
);
router.delete(
  "/where-i-am-now",
  authMiddleware,
  whereIAmNowController.resetWhereIAmNow,
);
router.get(
  "/where-i-am-now/pdf",
  authMiddleware,
  moduleGatingMiddleware("whereiam"),
  whereIAmNowController.downloadWhereIAmNowPdf,
);

router.get(
  "/where-i-am-now/examples",
  whereIAmNowController.getExamples,
);
router.get(
  "/where-i-am-now/metadata",
  whereIAmNowController.getMetadata,
);

export default router;