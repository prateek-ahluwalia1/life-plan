import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
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
  whereIAmNowController.downloadWhereIAmNowPdf,
);

export default router;
