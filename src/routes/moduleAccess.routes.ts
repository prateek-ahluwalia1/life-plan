import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";
import { checkModuleAccess } from "../middlewares/moduleGating.middleware";

const router = Router();

router.get("/access-check/:module", authMiddleware, checkModuleAccess);

export default router;
