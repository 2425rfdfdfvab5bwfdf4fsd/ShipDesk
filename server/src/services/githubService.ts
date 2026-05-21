import crypto from "crypto";
import axios from "axios";
import { decrypt } from "../lib/crypto.js";

const GITHUB_API = "https://api.github.com";

function getHeaders(token: string) {
  return {
    Authorization: `token ${token}`,
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "ShipDesk/1.0",
  };
}

export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string
): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET || "";
  const expectedSig =
    "sha256=" +
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (signature.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig)
  );
}

export async function listUserRepos(
  accessTokenEncrypted: string,
  query?: string
): Promise<
  { id: number; full_name: string; private: boolean; pushed_at: string }[]
> {
  const token = decrypt(accessTokenEncrypted);
  const response = await axios.get(`${GITHUB_API}/user/repos`, {
    headers: getHeaders(token),
    params: {
      per_page: 100,
      sort: "pushed",
      direction: "desc",
    },
  });

  let repos = response.data as {
    id: number;
    full_name: string;
    private: boolean;
    pushed_at: string;
  }[];

  if (query) {
    const q = query.toLowerCase();
    repos = repos.filter((r) => r.full_name.toLowerCase().includes(q));
  }

  return repos;
}

export async function registerWebhook(
  accessTokenEncrypted: string,
  repoFullName: string,
  webhookUrl: string
): Promise<number> {
  const token = decrypt(accessTokenEncrypted);
  const response = await axios.post(
    `${GITHUB_API}/repos/${repoFullName}/hooks`,
    {
      name: "web",
      active: true,
      events: ["push", "pull_request", "release"],
      config: {
        url: webhookUrl,
        content_type: "json",
        secret: process.env.GITHUB_WEBHOOK_SECRET,
      },
    },
    { headers: getHeaders(token) }
  );
  return response.data.id as number;
}

export async function deleteWebhook(
  accessTokenEncrypted: string,
  repoFullName: string,
  webhookId: number
): Promise<void> {
  const token = decrypt(accessTokenEncrypted);
  await axios.delete(
    `${GITHUB_API}/repos/${repoFullName}/hooks/${webhookId}`,
    { headers: getHeaders(token) }
  );
}

export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  scope: string;
}> {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    },
    { headers: { Accept: "application/json" } }
  );
  return response.data as { access_token: string; scope: string };
}

export async function getAuthenticatedUser(
  accessTokenEncrypted: string
): Promise<{ id: number; login: string }> {
  const token = decrypt(accessTokenEncrypted);
  const response = await axios.get(`${GITHUB_API}/user`, {
    headers: getHeaders(token),
  });
  return response.data as { id: number; login: string };
}
