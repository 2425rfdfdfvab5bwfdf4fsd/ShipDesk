import axios from "axios";
import { decrypt } from "../lib/crypto.js";

const LINEAR_GRAPHQL = "https://api.linear.app/graphql";
const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";
const LINEAR_AUTH_URL = "https://linear.app/oauth/authorize";

export interface LinearTeam {
  id: string;
  name: string;
  key: string;
}

export interface LinearIssue {
  id: string;
  identifier: string;
  title: string;
  updatedAt: string;
  completedAt?: string | null;
  state: { name: string; type: string };
  labels?: { nodes: { name: string }[] };
}

async function gql<T>(token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await axios.post<{ data: T; errors?: { message: string }[] }>(
    LINEAR_GRAPHQL,
    { query, variables },
    { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
  );
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

export function getLinearAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read",
    state,
  });
  return `${LINEAR_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}> {
  const params = new URLSearchParams({
    code,
    redirect_uri: process.env.LINEAR_OAUTH_CALLBACK_URL || "",
    client_id: process.env.LINEAR_CLIENT_ID || "",
    client_secret: process.env.LINEAR_CLIENT_SECRET || "",
    grant_type: "authorization_code",
  });

  const { data } = await axios.post<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  }>(LINEAR_TOKEN_URL, params.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  return data;
}

export async function getLinearViewer(token: string): Promise<{
  id: string;
  name: string;
  organizationId: string;
  organizationName: string;
}> {
  const data = await gql<{
    viewer: { id: string; name: string; organization: { id: string; name: string } };
  }>(token, `query { viewer { id name organization { id name } } }`);

  return {
    id: data.viewer.id,
    name: data.viewer.name,
    organizationId: data.viewer.organization.id,
    organizationName: data.viewer.organization.name,
  };
}

export async function fetchLinearTeams(accessTokenEncrypted: string): Promise<LinearTeam[]> {
  const token = decrypt(accessTokenEncrypted);
  const data = await gql<{ teams: { nodes: LinearTeam[] } }>(
    token,
    `query { teams { nodes { id name key } } }`
  );
  return data.teams.nodes;
}

export async function fetchLinearIssues(
  accessTokenEncrypted: string,
  teamId: string,
  since: Date,
  until: Date
): Promise<LinearIssue[]> {
  const token = decrypt(accessTokenEncrypted);
  const data = await gql<{ issues: { nodes: LinearIssue[] } }>(
    token,
    `query($filter: IssueFilter) {
      issues(filter: $filter, first: 100, orderBy: updatedAt) {
        nodes {
          id identifier title updatedAt completedAt
          state { name type }
          labels { nodes { name } }
        }
      }
    }`,
    {
      filter: {
        team: { id: { eq: teamId } },
        updatedAt: { gte: since.toISOString(), lte: until.toISOString() },
      },
    }
  );
  return data.issues.nodes;
}

export function formatLinearIssues(issues: LinearIssue[]): string {
  if (!issues.length) return "(No Linear issues updated this period)";

  const completed = issues.filter((i) => i.state.type === "completed");
  const inProgress = issues.filter(
    (i) => i.state.type === "started" || i.state.type === "inProgress"
  );
  const other = issues.filter(
    (i) => !["completed", "started", "inProgress"].includes(i.state.type)
  );

  const lines: string[] = [`Linear issues updated this period (${issues.length} total):`];

  if (completed.length) {
    lines.push("\nCompleted:");
    for (const i of completed) {
      const labels = i.labels?.nodes.map((l) => l.name).join(", ");
      lines.push(`  ✓ [${i.identifier}] ${i.title}${labels ? ` (${labels})` : ""}`);
    }
  }
  if (inProgress.length) {
    lines.push("\nIn progress:");
    for (const i of inProgress) {
      lines.push(`  → [${i.identifier}] ${i.title} — ${i.state.name}`);
    }
  }
  if (other.length) {
    lines.push("\nOther updated:");
    for (const i of other) {
      lines.push(`  · [${i.identifier}] ${i.title} — ${i.state.name}`);
    }
  }

  return lines.join("\n");
}
