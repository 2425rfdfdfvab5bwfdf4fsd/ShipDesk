import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/prisma.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { AppError } from "../lib/errors.js";
import { generateUploadSignature, deleteAsset } from "../services/cloudinaryService.js";

const router = Router({ mergeParams: true });

const fileRecordSchema = z.object({
  fileName: z.string(),
  fileSize: z.number().int().positive(),
  mimeType: z.string(),
  cloudinaryPublicId: z.string(),
  cloudinarySecureUrl: z.string().url(),
});

async function getWorkspace(userId: string) {
  const ws = await db.workspace.findUnique({ where: { ownerId: userId } });
  if (!ws) throw new AppError("Workspace not found", 404, "NOT_FOUND");
  return ws;
}

router.get("/upload-signature", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const projectId = req.query.projectId as string;
    if (!projectId) throw new AppError("projectId required", 400, "VALIDATION_ERROR");

    const project = await db.project.findFirst({
      where: { id: projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const signature = generateUploadSignature(`shipdesk/files/${project.id}/`);
    res.json(signature);
  } catch (err) {
    next(err);
  }
});

router.get("/:projectId/files", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const files = await db.projectFile.findMany({
      where: { projectId: project.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (err) {
    next(err);
  }
});

router.post("/:projectId/files", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const fileCount = await db.projectFile.count({
      where: { projectId: project.id, deletedAt: null },
    });
    if (fileCount >= 500) {
      throw new AppError("File limit reached", 422, "FILE_LIMIT_REACHED");
    }

    const body = fileRecordSchema.parse(req.body);
    const user = await db.user.findUnique({ where: { id: req.userId! } });

    const file = await db.projectFile.create({
      data: {
        projectId: project.id,
        uploadedBy: req.userId!,
        uploaderType: "DEVELOPER",
        uploaderName: user?.name || "Developer",
        ...body,
      },
    });
    res.status(201).json(file);
  } catch (err) {
    next(err);
  }
});

router.delete("/:projectId/files/:fileId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const ws = await getWorkspace(req.userId!);
    const project = await db.project.findFirst({
      where: { id: req.params.projectId, workspaceId: ws.id },
    });
    if (!project) throw new AppError("Project not found", 404, "NOT_FOUND");

    const file = await db.projectFile.findFirst({
      where: { id: req.params.fileId, projectId: project.id, deletedAt: null },
    });
    if (!file) throw new AppError("File not found", 404, "NOT_FOUND");

    await deleteAsset(file.cloudinaryPublicId).catch(console.error);
    await db.projectFile.update({
      where: { id: file.id },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
