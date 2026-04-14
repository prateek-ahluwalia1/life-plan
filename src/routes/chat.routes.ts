import { Router } from "express";
import chatController from "../controllers/chat.controller";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/initiate", authMiddleware, chatController.initateThread);
router.post("/send", authMiddleware, chatController.sendMessage);

export default router;
