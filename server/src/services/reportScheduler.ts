import cron from "node-cron";
import { db } from "../lib/prisma.js";
import { generateWeeklyReport } from "./geminiService.js";
import { sendReportPublished } from "./emailService.js";

function getWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() + mondayOffset);
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export async function generateReportsForAllProjects(): Promise<void> {
  const { start, end } = getWeekBounds();

  const projects = await db.project.findMany({
    where: {
      status: "ACTIVE",
      githubRepoId: { not: null },
    },
    include: {
      workspace: true,
    },
  });

  for (const project of projects) {
    try {
      const events = await db.gitHubEvent.findMany({
        where: {
          projectId: project.id,
          receivedAt: { gte: start },
        },
      });

      const weekStart = start.toISOString().split("T")[0];
      const weekEndShort = end.toISOString().split("T")[0];
      const title = `This Week in ${project.name} — ${weekStart} to ${weekEndShort}`;

      const content = await generateWeeklyReport({
        projectName: project.name,
        weekStartDate: start,
        weekEndDate: end,
        githubEvents: events,
      });

      await db.report.create({
        data: {
          projectId: project.id,
          weekStartDate: start,
          weekEndDate: end,
          title,
          content: content as object,
          status: "DRAFT",
          generatedBy: "SCHEDULED",
        },
      });
    } catch (err) {
      console.error(`Failed to generate report for project ${project.id}:`, err);
    }
  }
}

export async function markOverdueInvoices(): Promise<void> {
  const now = new Date();
  const result = await db.invoice.updateMany({
    where: {
      status: "UNPAID",
      dueDate: { lt: now },
    },
    data: { status: "OVERDUE" },
  });
  if (result.count > 0) {
    console.log(`Marked ${result.count} invoice(s) as OVERDUE`);
  }
}

export function startScheduler(): void {
  cron.schedule(
    "0 9 * * 5",
    () => {
      console.log("Running scheduled report generation...");
      generateReportsForAllProjects().catch(console.error);
    },
    { timezone: "UTC" }
  );

  cron.schedule(
    "0 0 * * *",
    () => {
      console.log("Running overdue invoice check...");
      markOverdueInvoices().catch(console.error);
    },
    { timezone: "UTC" }
  );

  console.log("Schedulers started — reports: Fridays 09:00 UTC, overdue check: daily 00:00 UTC");
}

export async function notifyClientsOfPublishedReport(
  reportId: string
): Promise<void> {
  const report = await db.report.findUnique({
    where: { id: reportId },
    include: { project: { include: { workspace: true, clientAccess: { where: { revokedAt: null }, include: { client: true } } } } },
  });

  if (!report) return;

  const content = report.content as { summary?: string | null };
  const portalBase =
    process.env.CLIENT_PORTAL_BASE_URL || "https://portal.shipdesk.io";
  const portalUrl = `https://${report.project.workspace.slug}.${portalBase.replace("https://", "")}/projects/${report.projectId}/reports/${reportId}`;

  for (const access of report.project.clientAccess) {
    try {
      await sendReportPublished({
        to: access.client.email,
        clientName: access.client.name,
        reportTitle: report.title,
        reportSummary: content.summary || null,
        portalUrl,
        agencyName: report.project.workspace.agencyName,
      });
    } catch (err) {
      console.error(`Failed to notify client ${access.client.id}:`, err);
    }
  }
}
