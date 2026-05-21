import { Request, Response, NextFunction } from "express";
import { db } from "../lib/prisma.js";

export interface ClientAuthRequest extends Request {
  clientId?: string;
  workspaceId?: string;
  sessionId?: string;
}

export async function requireClientAuth(
  req: ClientAuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.cookies?.shipdesk_client_session;
    if (!sessionId) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    const session = await db.clientSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.clearCookie("shipdesk_client_session");
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }

    if (new Date() > session.expiresAt) {
      await db.clientSession.delete({ where: { id: sessionId } });
      res.clearCookie("shipdesk_client_session");
      res.status(401).json({ error: "SESSION_EXPIRED" });
      return;
    }

    await db.clientSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });

    req.clientId = session.clientId;
    req.workspaceId = session.workspaceId;
    req.sessionId = session.id;

    next();
  } catch {
    res.status(401).json({ error: "UNAUTHORIZED" });
  }
}
