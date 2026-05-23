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

interface CommitInfo {
  message: string;
  id?: string;
  author?: string;
}

interface PullRequestInfo {
  title: string;
  state: string;
  body?: string;
  merged?: boolean;
  base?: string;
  head?: string;
  user?: { login?: string };
}

interface ReleaseInfo {
  tag_name: string;
  name?: string;
  body?: string;
  prerelease?: boolean;
}

function buildEventSummaries(events: GitHubEvent[]): { lines: string[]; stats: Record<string, number> } {
  const lines: string[] = [];
  const stats: Record<string, number> = {
    pushEvents: 0,
    totalCommits: 0,
    prsOpened: 0,
    prsMerged: 0,
    prsClosed: 0,
    releases: 0,
  };

  for (const e of events) {
    const payload = e.payload as Record<string, unknown>;
    const ts = new Date(e.receivedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    if (e.eventType === "push") {
      const commits = (payload.commits as CommitInfo[]) || [];
      const branch = (payload.ref as string || "").replace("refs/heads/", "") || "unknown branch";
      const pusher = (payload.pusher as { name?: string } | undefined)?.name;
      const distinctCommits = commits.filter((c) => (payload.distinct as boolean[] | undefined)?.[commits.indexOf(c)] !== false);
      const commitCount = distinctCommits.length || commits.length;

      stats.pushEvents++;
      stats.totalCommits += commitCount;

      const commitMessages = commits
        .slice(0, 8)
        .map((c) => {
          const shortId = c.id ? c.id.slice(0, 7) : "";
          const author = c.author && typeof c.author === "object" ? (c.author as { name?: string }).name : undefined;
          const authorTag = author && author !== pusher ? ` (by ${author})` : "";
          return `    - [${shortId}] ${c.message.split("\n")[0].trim()}${authorTag}`;
        })
        .join("\n");

      const extras = commits.length > 8 ? `\n    ... and ${commits.length - 8} more commits` : "";
      const pusherTag = pusher ? ` by ${pusher}` : "";

      lines.push(
        `[${ts}] PUSH to \`${branch}\`${pusherTag}: ${commitCount} commit(s)\n${commitMessages}${extras}`
      );
    } else if (e.eventType === "pull_request") {
      const pr = payload.pull_request as PullRequestInfo | undefined;
      const action = payload.action as string;

      if (action === "opened") stats.prsOpened++;
      else if (action === "closed" && pr?.merged) stats.prsMerged++;
      else if (action === "closed" && !pr?.merged) stats.prsClosed++;

      const author = pr?.user?.login ? ` by ${pr.user.login}` : "";
      const branch = pr?.head && pr?.base ? ` (\`${pr.head}\` → \`${pr.base}\`)` : "";
      const body = pr?.body?.trim()
        ? `\n    Description: ${pr.body.split("\n")[0].slice(0, 200).trim()}`
        : "";

      const statusLabel =
        action === "closed" && pr?.merged
          ? "MERGED"
          : action === "closed"
          ? "CLOSED (not merged)"
          : action.toUpperCase();

      lines.push(
        `[${ts}] PULL REQUEST ${statusLabel}${author}: "${pr?.title || "untitled"}"${branch}${body}`
      );
    } else if (e.eventType === "release") {
      const release = payload.release as ReleaseInfo | undefined;
      stats.releases++;

      const prerelease = release?.prerelease ? " (pre-release)" : "";
      const releaseNotes = release?.body?.trim()
        ? `\n    Release notes: ${release.body.split("\n").slice(0, 3).join(" | ").slice(0, 300).trim()}`
        : "";

      lines.push(
        `[${ts}] RELEASE${prerelease}: ${release?.tag_name || "unknown"} — ${release?.name || ""}${releaseNotes}`
      );
    } else {
      lines.push(`[${ts}] EVENT: ${e.eventType}`);
    }
  }

  return { lines, stats };
}

export async function generateWeeklyReport(opts: {
  projectName: string;
  projectDescription?: string | null;
  weekStartDate: Date;
  weekEndDate: Date;
  githubEvents: GitHubEvent[];
  developerName?: string;
}): Promise<ReportContent> {
  const ai = getClient();

  const weekStart = opts.weekStartDate.toISOString().split("T")[0];
  const weekEnd = opts.weekEndDate.toISOString().split("T")[0];
  const sender = opts.developerName || "Your Project Manager";

  const { lines: eventLines, stats } = buildEventSummaries(opts.githubEvents);

  const activityBlock =
    opts.githubEvents.length === 0
      ? "No GitHub activity was recorded this week."
      : `Activity statistics:
- Total pushes: ${stats.pushEvents}
- Total commits: ${stats.totalCommits}
- Pull requests opened: ${stats.prsOpened}
- Pull requests merged: ${stats.prsMerged}
- Pull requests closed without merge: ${stats.prsClosed}
- Releases published: ${stats.releases}

Detailed activity log (chronological):
${eventLines.join("\n\n")}`;

  const projectContext = opts.projectDescription?.trim()
    ? `Project description: ${opts.projectDescription.trim()}`
    : `Project name: ${opts.projectName}`;

  const prompt = `You are a professional technical project manager writing a weekly status update for a non-technical business client.

<project>
Name: ${opts.projectName}
${projectContext}
Sender (developer / agency name): ${sender}
Week covered: ${weekStart} to ${weekEnd}
</project>

<github_activity>
${activityBlock}
</github_activity>

<instructions>
Your job is to translate the GitHub activity above into a clear, honest, client-friendly status report.

ACCURACY RULES (most important):
- ONLY report work that is directly supported by the GitHub activity above. Do not invent, assume, or embellish.
- If commits mention a specific feature (e.g. "add payment form", "fix login bug"), describe that feature in plain English.
- If the activity is sparse or unclear, say so honestly — do not pad the report with vague filler.
- For nextSteps: only include items if they are clearly inferable from unfinished PRs, open branches, or explicit "wip"/"todo" commit messages. If nothing is inferable, use an empty array.
- Merged PRs = completed work. Open/closed-without-merge PRs = attempted or ongoing work.

TONE RULES:
- Write for a non-technical business owner. No jargon (no "refactor", "merge", "commit", "branch", "repo", "PR", "deploy pipeline" unless briefly explained).
- Keep it concise, warm, and professional.
- Use "we" when referring to the development team.

OUTPUT FORMAT:
Return ONLY a valid JSON object — no markdown fences, no extra text before or after.

{
  "summary": "2-3 sentence plain-English overview of what was accomplished this week. Be specific about what features/fixes were delivered.",
  "highlights": ["specific accomplishment 1", "specific accomplishment 2"],
  "nextSteps": ["planned next action 1"],
  "rawMarkdown": "Full Markdown report. Start with 'Hi,' (no placeholder). Sign off with '${sender}'. Include a Summary section and a What We Did section. Be specific."
}

Rules for highlights:
- 2–6 bullet points
- Each should name a concrete deliverable or fix, not a vague activity
- Good: "Fixed the login page not loading on mobile devices"
- Bad: "Worked on frontend improvements"

Rules for rawMarkdown:
- Use proper Markdown headings (##)
- Group related commits under meaningful feature names, not raw commit messages
- Include the week dates in the opening
</instructions>`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);

  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { temperature: 0.3, maxOutputTokens: 8192 },
    });
    clearTimeout(timeout);

    const raw = (result.text ?? "").trim();
    const text = raw
      .replace(/^```(?:json)?\s*\r?\n?/i, "")
      .replace(/\r?\n?```\s*$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(text) as ReportContent;
      return {
        summary: parsed.summary || null,
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : null,
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : null,
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
