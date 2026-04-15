import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { checkModuleAccess } from "../middlewares/moduleGating.middleware";

const router = Router();

// Central access-check endpoint for all modules
router.get("/access-check/:module", authMiddleware, checkModuleAccess);

export default router;
