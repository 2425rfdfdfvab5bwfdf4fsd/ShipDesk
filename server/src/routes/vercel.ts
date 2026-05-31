import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { encrypt } from "../lib/crypto.js";
import { verifyVercelToken } from "../services/vercelService.js";

const router = Router();

async function assertProjectAccess(projectId: string, workspaceId: string) {
  const project = await db.project.findFirst({ where: { id: projectId, workspaceId } });
  if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");
  return project;
}

router.get("/:id/vercel/status", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    await assertProjectAccess(req.params.id, workspace.id);

    const conn = await db.vercelConnection.findUnique({
      where: { projectId: req.params.id },
    });

    if (!conn) {
      res.json({ connected: false, vercelProjectId: null, connectedAt: null });
      return;
    }

    res.json({
      connected: true,
      vercelProjectId: conn.vercelProjectId,
      connectedAt: conn.connectedAt,
    });
  } catch (err) {
    next(err);
  }
});

const connectSchema = z.object({
  apiToken: z.string().min(1, "API token is required"),
  vercelProjectId: z.string().min(1, "Vercel project ID or name is required"),
});

router.post("/:id/vercel/connect", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    await assertProjectAccess(req.params.id, workspace.id);

    const { apiToken, vercelProjectId } = connectSchema.parse(req.body);

    const { projectName } = await verifyVercelToken(apiToken, vercelProjectId);

    const encryptedToken = encrypt(apiToken);

    await db.vercelConnection.upsert({
      where: { projectId: req.params.id },
      update: { vercelProjectId, apiTokenEncrypted: encryptedToken },
      create: {
        projectId: req.params.id,
        vercelProjectId,
        apiTokenEncrypted: encryptedToken,
      },
    });

    res.json({ ok: true, projectName });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id/vercel/disconnect", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const workspace = await db.workspace.findUnique({ where: { ownerId: req.userId! } });
    if (!workspace) throw new AppError("Workspace not found", 404, "NOT_FOUND");

    await assertProjectAccess(req.params.id, workspace.id);

    await db.vercelConnection.deleteMany({ where: { projectId: req.params.id } });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
