import type { Request, Response, NextFunction } from "express";
import { getAgentToken, touchAgentToken } from "@mayhem-tracker/shared";

export function requireAgentToken(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }
  const record = getAgentToken(token);
  if (!record) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  touchAgentToken(token);
  next();
}
