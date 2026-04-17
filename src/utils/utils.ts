import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = (
  password: string,
  hashedPassword: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateOTP = (): string => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
};

export const hashToken = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

export const generateResetToken = (): {
  rawToken: string;
  hashedToken: string;
} => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    hashedToken: hashToken(rawToken),
  };
};

export const createJwtToken = (payload: {
  userId: string;
  email: string;
}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as NonNullable<
    SignOptions["expiresIn"]
  >;

  return jwt.sign({ sub: payload.userId, email: payload.email }, secret, {
    expiresIn,
  });
};

export const isStrongPassword = (password: string): boolean => {
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  return hasMinLength && hasUpper && hasLower && hasDigit;
};
