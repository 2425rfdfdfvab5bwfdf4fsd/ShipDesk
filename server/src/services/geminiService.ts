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
  id?: string;
  message: string;
  author?: { name?: string } | string;
  timestamp?: string;
  distinct?: boolean;
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

function getAuthorName(commit: CommitInfo, pusher?: string): string | undefined {
  if (!commit.author) return undefined;
  if (typeof commit.author === "string") return commit.author !== pusher ? commit.author : undefined;
  if (typeof commit.author === "object") return commit.author.name !== pusher ? commit.author.name : undefined;
  return undefined;
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
    // Use the actual event date (receivedAt) for the display timestamp.
    // For API-synced events this is the commit date; for webhooks it's delivery time.
    const ts = new Date(e.receivedAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

    if (e.eventType === "push") {
      const commits = (payload.commits as CommitInfo[]) || [];
      const branch = ((payload.ref as string) || "").replace("refs/heads/", "") || "unknown branch";
      const pusher = (payload.pusher as { name?: string } | undefined)?.name;

      // GitHub puts 'distinct: boolean' on each commit object (not as a top-level array).
      // Only count commits where distinct !== false (i.e. new commits, not re-pushes).
      const distinctCommits = commits.filter((c) => c.distinct !== false);
      const commitCount = distinctCommits.length || commits.length;

      stats.pushEvents++;
      stats.totalCommits += commitCount;

      // Show the first 10 commit messages with short SHA and author
      const commitMessages = commits
        .slice(0, 10)
        .map((c) => {
          const shortId = c.id ? c.id.slice(0, 7) : "";
          const authorName = getAuthorName(c, pusher);
          const authorTag = authorName ? ` [${authorName}]` : "";
          // Use only the first line of the commit message
          const firstLine = c.message.split("\n")[0].trim();
          const dateTag = c.timestamp ? ` (${new Date(c.timestamp).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })})` : "";
          return `    • ${shortId ? `[${shortId}] ` : ""}${firstLine}${authorTag}${dateTag}`;
        })
        .join("\n");

      const extras = commits.length > 10 ? `\n    … and ${commits.length - 10} more commits` : "";
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

function extractJsonFromText(raw: string): string {
  // 1. Strip markdown code fences
  let text = raw
    .replace(/^```(?:json)?\s*\r?\n?/im, "")
    .replace(/\r?\n?```\s*$/im, "")
    .trim();

  // 2. If the result looks like JSON already, return it
  if (text.startsWith("{")) return text;

  // 3. Try to find a JSON object anywhere in the text
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1);
  }

  return text;
}

function buildPrompt(opts: {
  greeting: string;
  sender: string;
  projectName: string;
  projectContext: string;
  weekStart: string;
  weekEnd: string;
  activityBlock: string;
}): string {
  const { greeting, sender, projectName, projectContext, weekStart, weekEnd, activityBlock } = opts;

  return `You are a professional technical project manager writing a client-facing weekly status update.

<project>
Name: ${projectName}
${projectContext}
Week: ${weekStart} to ${weekEnd}
Developer / Agency: ${sender}
</project>

<github_activity>
${activityBlock}
</github_activity>

<task>
Translate the GitHub activity above into a polished, client-friendly status report.

ACCURACY (most important):
- Only describe work that is directly evidenced by the commit messages above. Never invent, assume, or pad.
- If a commit message is specific (e.g. "fix: login page crash on mobile"), describe that specific fix.
- If commit messages are vague (e.g. "update code"), describe them honestly as general improvements.
- Merged PRs = completed work. Open/unmerged PRs = in-progress.
- For nextSteps: include only items clearly inferable from WIP/TODO commit messages or open PRs. If nothing is inferable, use an empty array [].

LANGUAGE:
- Write for a non-technical business owner. No jargon.
- Avoid: "commit", "branch", "repo", "merge", "push", "PR", "refactor", "deploy pipeline".
- Use "we" for the dev team. Keep it warm, professional, and concise.
- Group related commits under one description rather than listing them individually.

OUTPUT: Return a JSON object with exactly these four fields:

{
  "summary": "2-3 sentences. Specific overview of what was accomplished. Name actual features/fixes.",
  "highlights": ["specific accomplishment 1", "specific accomplishment 2"],
  "nextSteps": ["planned next action 1"],
  "rawMarkdown": "Full Markdown status report (see format below)"
}

highlights rules:
- 2 to 6 items. Each names one concrete deliverable or fix.
- Good: "Fixed the checkout page crashing on mobile devices"
- Bad: "Worked on improvements"

rawMarkdown format — use exactly this structure:
${greeting}

Here is your weekly status update for **${projectName}**, covering ${weekStart} to ${weekEnd}.

## Summary

[2-3 sentence summary of the week]

## What We Did This Week

[Group work into 2-5 thematic sections. Each section has a bold heading and 1-2 sentences of description. Be specific about features and fixes based on the actual commits.]

## What's Next

[1-3 items, or omit this section if nothing is clearly planned]

${sender}
</task>`;
}

async function callGemini(
  ai: GoogleGenAI,
  prompt: string,
  temperature: number
): Promise<string> {
  const result = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    },
  });
  return (result.text ?? "").trim();
}

export async function generateWeeklyReport(opts: {
  projectName: string;
  clientName?: string | null;
  projectDescription?: string | null;
  weekStartDate: Date;
  weekEndDate: Date;
  githubEvents: GitHubEvent[];
  developerName?: string;
  truncationNote?: string;
}): Promise<ReportContent> {
  const weekStart = opts.weekStartDate.toISOString().split("T")[0];
  const weekEnd = opts.weekEndDate.toISOString().split("T")[0];
  const sender = opts.developerName || "Your Development Team";
  const greeting = opts.clientName?.trim() ? `Hi ${opts.clientName.trim()},` : "Hi,";

  // Skip AI when there is no activity — avoids hallucinated filler.
  if (opts.githubEvents.length === 0) {
    const rawMarkdown = `${greeting}

Here is your weekly status update for **${opts.projectName}**, covering ${weekStart} to ${weekEnd}.

## Summary

No development activity was recorded in the GitHub repository this week.

## What We Did This Week

No commits, pull requests, or releases were pushed to the repository during this period. If work was done outside of GitHub (planning, design, calls, etc.) your developer may follow up separately.

${sender}`;

    return {
      summary: `No development activity was recorded for ${opts.projectName} this week (${weekStart} to ${weekEnd}).`,
      highlights: [],
      nextSteps: [],
      rawMarkdown,
      generationWarning: null,
    };
  }

  const ai = getClient();
  const { lines: eventLines, stats } = buildEventSummaries(opts.githubEvents);

  const activityBlock = [
    opts.truncationNote ? `Note: ${opts.truncationNote}\n` : "",
    `Statistics for the week:`,
    `  Pushes: ${stats.pushEvents}`,
    `  Commits: ${stats.totalCommits}`,
    `  Pull requests opened: ${stats.prsOpened}`,
    `  Pull requests merged: ${stats.prsMerged}`,
    `  Pull requests closed without merge: ${stats.prsClosed}`,
    `  Releases: ${stats.releases}`,
    ``,
    `Chronological activity log:`,
    eventLines.join("\n\n"),
  ]
    .filter(Boolean)
    .join("\n");

  const projectContext = opts.projectDescription?.trim()
    ? `Description: ${opts.projectDescription.trim()}`
    : `Project name: ${opts.projectName}`;

  const prompt = buildPrompt({
    greeting,
    sender,
    projectName: opts.projectName,
    projectContext,
    weekStart,
    weekEnd,
    activityBlock,
  });

  const timeout = setTimeout(() => {
    throw new Error("Gemini request timed out after 90s");
  }, 90_000);

  try {
    // First attempt
    let raw = "";
    try {
      raw = await callGemini(ai, prompt, 0.2);
    } catch (firstErr) {
      // Retry once at lower temperature without responseMimeType as fallback
      console.warn("Gemini first attempt failed, retrying:", firstErr);
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { temperature: 0.1, maxOutputTokens: 8192 },
      });
      raw = (result.text ?? "").trim();
    }
    clearTimeout(timeout);

    const text = extractJsonFromText(raw);

    try {
      const parsed = JSON.parse(text) as {
        summary?: string;
        highlights?: unknown;
        nextSteps?: unknown;
        rawMarkdown?: string;
      };

      // Validate that rawMarkdown contains the expected greeting
      const markdown = parsed.rawMarkdown || text;
      const hasGreeting = markdown.includes(greeting.replace(",", ""));

      return {
        summary: parsed.summary || null,
        highlights: Array.isArray(parsed.highlights)
          ? (parsed.highlights as string[]).filter((h) => typeof h === "string" && h.trim())
          : null,
        nextSteps: Array.isArray(parsed.nextSteps)
          ? (parsed.nextSteps as string[]).filter((s) => typeof s === "string" && s.trim())
          : null,
        rawMarkdown: hasGreeting
          ? markdown
          : `${greeting}\n\n${markdown.replace(/^Hi[^,\n]*,?\n*/i, "")}`,
        generationWarning: null,
      };
    } catch {
      // JSON parse failed — use the raw text as a markdown fallback
      const fallback = text.startsWith(greeting.split(",")[0]) ? text : `${greeting}\n\n${text}\n\n${sender}`;
      return {
        summary: null,
        highlights: null,
        nextSteps: null,
        rawMarkdown: fallback,
        generationWarning: "Report content was generated but could not be fully structured.",
      };
    }
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}
