import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.js";
import { AppError } from "../utils/app-error.js";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authorization header missing or malformed", 401));
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id != null ? String(decoded.id) : decoded.id,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError("Forbidden: insufficient permissions", 403));
    }
    next();
  };
};

