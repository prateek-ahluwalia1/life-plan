import authController from "../controllers/auth.controller";
import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/resend-otp", authController.resendOtp);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);
router.get("/me", authMiddleware, authController.me);
router.post("/google-login", authController.googleLogin);

export default router;
