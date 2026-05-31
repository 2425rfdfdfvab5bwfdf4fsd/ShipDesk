import axios from "axios";
import { decrypt } from "../lib/crypto.js";

const VERCEL_API = "https://api.vercel.com";

export interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  target?: string | null;
  meta?: { githubCommitMessage?: string };
}

export async function verifyVercelToken(
  apiToken: string,
  vercelProjectId: string
): Promise<{ projectName: string }> {
  const { data } = await axios.get<{ name: string }>(
    `${VERCEL_API}/v9/projects/${vercelProjectId}`,
    { headers: { Authorization: `Bearer ${apiToken}` } }
  );
  return { projectName: data.name };
}

export async function fetchVercelDeployments(
  apiTokenEncrypted: string,
  vercelProjectId: string,
  since: Date,
  until: Date
): Promise<VercelDeployment[]> {
  const token = decrypt(apiTokenEncrypted);
  const { data } = await axios.get<{ deployments: VercelDeployment[] }>(
    `${VERCEL_API}/v6/deployments`,
    {
      params: {
        projectId: vercelProjectId,
        limit: 50,
        since: since.getTime(),
        until: until.getTime(),
      },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data.deployments || [];
}

export function formatVercelDeployments(deployments: VercelDeployment[]): string {
  if (!deployments.length) return "(No Vercel deployments this period)";

  const lines: string[] = [`Vercel deployments this period (${deployments.length} total):`];

  for (const d of deployments) {
    const date = new Date(d.created).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const target =
      d.target === "production"
        ? " [PRODUCTION]"
        : d.target
        ? ` [${d.target.toUpperCase()}]`
        : "";
    const status =
      d.state === "READY"
        ? "✓ Deployed"
        : d.state === "ERROR"
        ? "✗ Failed"
        : d.state === "BUILDING"
        ? "⟳ Building"
        : d.state;
    const commitMsg = d.meta?.githubCommitMessage
      ? ` — "${d.meta.githubCommitMessage.split("\n")[0].slice(0, 80)}"`
      : "";
    lines.push(`  [${date}] ${status}${target}: ${d.name}${commitMsg}`);
  }

  return lines.join("\n");
}
