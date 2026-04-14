import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: missing token" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return res.status(500).json({ message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & {
      email?: string;
    };

    if (!decoded.sub) {
      return res.status(401).json({ message: "Unauthorized: invalid token" });
    }

    req.user = {
      id: String(decoded.sub),
      email: decoded.email || "",
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized: token expired or invalid" });
  }
};

export default authMiddleware;
