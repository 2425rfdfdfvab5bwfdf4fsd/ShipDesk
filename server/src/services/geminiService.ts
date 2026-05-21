import { GoogleGenAI } from "@google/genai";
import { GitHubEvent } from "@prisma/client";

export interface ReportContent {
  summary: string | null;
  highlights: string[] | null;
  nextSteps: string[] | null;
  rawMarkdown: string;
  generationWarning: string | null;
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  const baseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;

  if (baseUrl) {
    return new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: "", baseUrl },
    });
  }
  return new GoogleGenAI({ apiKey });
}

export async function generateWeeklyReport(opts: {
  projectName: string;
  weekStartDate: Date;
  weekEndDate: Date;
  githubEvents: GitHubEvent[];
}): Promise<ReportContent> {
  const ai = getClient();

  const eventSummaries = opts.githubEvents.map((e) => {
    const payload = e.payload as Record<string, unknown>;
    if (e.eventType === "push") {
      const commits = (payload.commits as { message: string; id: string }[]) || [];
      return `PUSH: ${commits.length} commit(s) — ${commits.map((c) => c.message).join("; ")}`;
    }
    if (e.eventType === "pull_request") {
      const pr = payload.pull_request as { title: string; state: string } | undefined;
      const action = payload.action as string;
      return `PULL REQUEST [${action}]: ${pr?.title || "untitled"} (${pr?.state || "unknown"})`;
    }
    if (e.eventType === "release") {
      const release = payload.release as { tag_name: string; name: string } | undefined;
      return `RELEASE: ${release?.tag_name || "unknown"} — ${release?.name || ""}`;
    }
    return `EVENT: ${e.eventType}`;
  });

  const weekStart = opts.weekStartDate.toISOString().split("T")[0];
  const weekEnd = opts.weekEndDate.toISOString().split("T")[0];

  const prompt = `You are a professional technical project manager writing a weekly status update for a non-technical business client.

Project: ${opts.projectName}
Week: ${weekStart} to ${weekEnd}
GitHub Activity:
${eventSummaries.length > 0 ? eventSummaries.join("\n") : "No GitHub activity recorded this week."}

Write a professional, friendly weekly status report. Return a JSON object with this exact structure:
{
  "summary": "2-3 sentence plain-English overview of what was accomplished this week",
  "highlights": ["key accomplishment 1", "key accomplishment 2", ...],
  "nextSteps": ["planned next action 1", ...],
  "rawMarkdown": "Full Markdown-formatted report text"
}

Rules:
- Use plain English, no jargon
- summary: 2-3 sentences
- highlights: 3-6 bullet points
- nextSteps: 1-3 items (only if inferable from context)
- rawMarkdown: full formatted report in Markdown
- Return ONLY valid JSON, no markdown fences`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.4, maxOutputTokens: 8192 },
    });
    clearTimeout(timeout);
    const text = (result.text ?? "").trim();

    try {
      const parsed = JSON.parse(text) as ReportContent;
      return {
        summary: parsed.summary || null,
        highlights: parsed.highlights || null,
        nextSteps: parsed.nextSteps || null,
        rawMarkdown: parsed.rawMarkdown || text,
        generationWarning: null,
      };
    } catch (parseError) {
      return {
        summary: null,
        highlights: null,
        nextSteps: null,
        rawMarkdown: text,
        generationWarning: `JSON parsing failed: ${(parseError as Error).message}`,
      };
    }
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
