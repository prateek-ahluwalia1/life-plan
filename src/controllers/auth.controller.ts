import type { Request, Response } from "express";
import User from "../models/user.model";
import {
  hashPassword,
  comparePassword,
  generateOTP,
  hashToken,
  generateResetToken,
  createJwtToken,
  isStrongPassword,
} from "../utils/utils";
import type {
  RegisterBody,
  LoginBody,
  VerifyOtpBody,
  ForgotPasswordBody,
  ResetPasswordBody,
} from "../types/auth";
import { sendEmail } from "../services/send.mail";
import otpTemplate from "../utils/emailTemplates/otp";
import resetPasswordTemplate from "../utils/emailTemplates/resetPassword";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { OAuth2Client } from "google-auth-library";

const OTP_EXPIRY_MINUTES = 10;
const RESEND_OTP_COOLDOWN_SECONDS = 60;
const RESET_PASSWORD_EXPIRY_MINUTES = 15;

const googleClient = new OAuth2Client(String(process.env.GOOGLE_CLIENT_ID));

const sanitizeEmail = (email: string): string => email.trim().toLowerCase();

const buildUserData = (id: string, email: string) => ({
  id,
  name: email.split("@")[0],
  email,
});

const register = async (req: Request, res: Response) => {
  try {
    const { email, password, confirmPassword } = req.body as RegisterBody;

    if (!email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const existingUser = await User.findOne({ email: normalizedEmail }).select(
      "+otpHash",
    );

    if (existingUser?.isVerified) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    const hashedPassword = await hashPassword(password);

    const user = existingUser || new User({ email: normalizedEmail });

    user.password = hashedPassword;
    user.isVerified = false;
    user.otpHash = hashToken(otp);
    user.otpExpiry = otpExpiry;
    user.otpRequestedAt = new Date();

    await sendEmail({
      to: normalizedEmail,
      subject: "LifePlan - Your OTP Code",
      html: otpTemplate(otp),
    });

    await user.save();

    res
      .status(201)
      .json({ message: "User registered successfully. OTP sent." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user || !user.password) {
      return res.status(401).json({
        message: "Invalid credentials, or please use Google Login.",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res
        .status(400)
        .json({ message: "Please verify your email first" });
    }

    const token = createJwtToken({
      userId: String(user._id),
      email: user.email,
    });

    res.status(200).json({
      message: "Login successful",
      token,
      userdata: {
        id: user._id,
        name: user.email.split("@")[0],
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body as VerifyOtpBody;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otpHash",
    );

    if (!user) {
      return res.status(400).json({ message: "Invalid email" });
    }

    if (!user.otpHash) {
      return res.status(400).json({ message: "OTP not requested" });
    }

    if (hashToken(otp) !== user.otpHash) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true;
    user.otpHash = null;
    user.otpExpiry = null;
    user.otpRequestedAt = null;

    await user.save();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as ForgotPasswordBody;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+otpHash",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    if (user.otpRequestedAt) {
      const elapsedMs = Date.now() - user.otpRequestedAt.getTime();
      const minimumWaitMs = RESEND_OTP_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < minimumWaitMs) {
        const retryAfter = Math.ceil((minimumWaitMs - elapsedMs) / 1000);
        return res.status(429).json({
          message: `Please wait ${retryAfter}s before requesting a new OTP`,
        });
      }
    }

    const otp = generateOTP();
    user.otpHash = hashToken(otp);
    user.otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpRequestedAt = new Date();

    await sendEmail({
      to: user.email,
      subject: "LifePlan - Your OTP Code",
      html: otpTemplate(otp),
    });

    await user.save();
    return res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as ForgotPasswordBody;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetTokenHash",
    );

    if (user) {
      const { rawToken, hashedToken } = generateResetToken();
      user.passwordResetTokenHash = hashedToken;
      user.passwordResetExpiry = new Date(
        Date.now() + RESET_PASSWORD_EXPIRY_MINUTES * 60 * 1000,
      );

      await user.save();

      const frontendBaseUrl = String(process.env.FRONTEND_URL);
      const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;

      await sendEmail({
        to: user.email,
        subject: "LifePlan - Password reset",
        html: resetPasswordTemplate(resetUrl),
      });
    }

    return res.status(200).json({
      message:
        "If an account with this email exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req: Request, res: Response) => {
  try {
    const { email, token, password, confirmPassword } =
      req.body as ResetPasswordBody;

    if (!email || !token || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a number",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const normalizedEmail = sanitizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordResetTokenHash +password",
    );

    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiry) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    if (user.passwordResetExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    const incomingTokenHash = hashToken(token);
    if (incomingTokenHash !== user.passwordResetTokenHash) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password = await hashPassword(password);
    user.passwordResetTokenHash = null;
    user.passwordResetExpiry = null;

    await user.save();

    return res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const me = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      userdata: buildUserData(String(user._id), user.email),
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const googleLogin = async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.body;

    if (!tokenId) {
      return res.status(400).json({ message: "Token ID is required" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: String(process.env.GOOGLE_CLIENT_ID),
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ message: "Invalid Google token" });
    }

    const normalizedEmail = sanitizeEmail(payload.email);
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      user = new User({
        email: normalizedEmail,
        isVerified: true,
        googleId: payload.sub,
      });
      await user.save();
    }

    const token = createJwtToken({
      userId: String(user._id),
      email: user.email,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      userdata: buildUserData(String(user._id), user.email),
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error", error });
  }
};

export default {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  me,
  googleLogin,
};
