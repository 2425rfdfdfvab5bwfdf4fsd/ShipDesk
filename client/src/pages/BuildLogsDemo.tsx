import {
  Terminal,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Clock,
} from "lucide-react";
import { useState } from "react";
const railwayErrorImg = "/railway-error.png";

type Severity = "warn" | "error" | "info" | "success" | "step" | "muted";

interface LogEntry {
  severity: Severity;
  text: string;
  ts?: string;
}

const WARN_ENTRIES: LogEntry[] = [
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "AES_ENCRYPTION_KEY") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLERK_SECRET_KEY") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLERK_WEBHOOK_SECRET") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLOUDINARY_API_KEY") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLOUDINARY_API_SECRET") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GEMINI_API_KEY") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GITHUB_CLIENT_SECRET") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GITHUB_WEBHOOK_SECRET") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "RESEND_API_KEY") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "SESSION_SECRET") (line 11)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "AES_ENCRYPTION_KEY") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLERK_SECRET_KEY") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLERK_WEBHOOK_SECRET") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLOUDINARY_API_KEY") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLOUDINARY_API_SECRET") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GEMINI_API_KEY") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GITHUB_CLIENT_SECRET") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GITHUB_WEBHOOK_SECRET") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "RESEND_API_KEY") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "SESSION_SECRET") (line 12)' },
  { severity: "warn", ts: "06:25:17", text: "UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)" },
];

const SECTIONS = [
  {
    id: "snapshot",
    title: "snapshot",
    badge: null,
    defaultOpen: false,
    entries: [
      { severity: "info" as Severity, ts: "06:24:52", text: 'scheduling build on Metal builder "builder-bkliao"' },
      { severity: "info" as Severity, ts: "06:24:54", text: "uploading snapshot → complete (2.4 MB, 44ms)" },
      { severity: "info" as Severity, ts: "06:24:54", text: "fetched snapshot sha256:c0d22f374e84f10e6cdd25c7458a4c1647fcd2a3857d98bba812c518598892a3" },
      { severity: "info" as Severity, ts: "06:24:54", text: "fetching snapshot → complete (2.3 MB, 260ms)" },
      { severity: "info" as Severity, ts: "06:24:54", text: "modified file: server/src/app.ts (3161b → 3282b)" },
      { severity: "info" as Severity, ts: "06:24:54", text: "unpacking archive → complete (4.8 MB, 44ms)" },
    ],
  },
  {
    id: "setup",
    title: "setup",
    badge: null,
    defaultOpen: true,
    entries: [
      { severity: "info"  as Severity, ts: "06:24:55", text: "using build driver nixpacks-v1.41.0" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "╔══════════════════════════════ Nixpacks v1.41.0 ══════════════════════════════╗" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║ setup      │ nodejs_24, npm-9_x, openssl                                     ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║────────────────────────────────────────────────────────────────────────────║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║ install    │ npm ci                                                          ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║────────────────────────────────────────────────────────────────────────────║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║ build      │ npm install --include=dev && npm run build --workspace=server   ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║            │ && node_modules/.bin/prisma migrate deploy                      ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║            │ --schema=server/prisma/schema.prisma                            ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║────────────────────────────────────────────────────────────────────────────║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "║ start      │ cd server && node dist/index.js                                 ║" },
      { severity: "step"  as Severity, ts: "06:24:55", text: "╚══════════════════════════════════════════════════════════════════════════════╝" },
    ],
  },
  {
    id: "lint",
    title: "dockerfile lint",
    badge: { count: 21, color: "yellow" as const },
    defaultOpen: false,
    entries: WARN_ENTRIES,
  },
  {
    id: "install",
    title: "install",
    badge: null,
    defaultOpen: false,
    entries: [
      { severity: "muted" as Severity, ts: "06:25:32", text: "[stage-0  5/10] COPY . /app/." },
      { severity: "muted" as Severity, ts: "06:25:32", text: "[stage-0  6/10] RUN npm ci" },
      { severity: "info"  as Severity, ts: "06:25:37", text: "npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead" },
      { severity: "info"  as Severity, ts: "06:25:37", text: "npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported" },
      { severity: "info"  as Severity, ts: "06:25:38", text: "npm warn deprecated glob@10.5.0: Old versions of glob are not supported, and contain widely publicized security vulnerabilities" },
      { severity: "success" as Severity, ts: "06:25:45", text: "added 527 packages, and audited 530 packages in 11s" },
      { severity: "info"  as Severity, ts: "06:25:45", text: "173 packages are looking for funding  (run `npm fund` for details)" },
      { severity: "warn"  as Severity, ts: "06:25:45", text: "7 vulnerabilities (2 moderate, 5 high) — run `npm audit fix` to address issues" },
      { severity: "muted" as Severity, ts: "06:25:51", text: "[stage-0  6/10] RUN npm ci  ✓ cached" },
    ],
  },
  {
    id: "build",
    title: "build",
    badge: null,
    defaultOpen: false,
    entries: [
      { severity: "muted"   as Severity, ts: "06:25:54", text: "[stage-0  7/10] COPY . /app/." },
      { severity: "muted"   as Severity, ts: "06:25:54", text: "[stage-0  8/10] RUN npm install --include=dev && npm run build --workspace=server && ..." },
      { severity: "info"    as Severity, ts: "06:26:28", text: "added 232 packages, and audited 761 packages in 32s" },
      { severity: "warn"    as Severity, ts: "06:26:28", text: "9 vulnerabilities (4 moderate, 5 high) — run `npm audit fix` to address issues" },
      { severity: "step"    as Severity, ts: "06:26:29", text: "> shipdesk-server@1.0.0 build" },
      { severity: "step"    as Severity, ts: "06:26:29", text: "> npx prisma generate && npx tsc --project tsconfig.json" },
      { severity: "info"    as Severity, ts: "06:26:30", text: "Prisma schema loaded from prisma/schema.prisma" },
      { severity: "success" as Severity, ts: "06:26:32", text: "✔ Generated Prisma Client (v5.22.0) to ./../node_modules/@prisma/client in 605ms" },
      { severity: "info"    as Severity, ts: "06:26:36", text: 'Prisma schema loaded from server/prisma/schema.prisma' },
      { severity: "info"    as Severity, ts: "06:26:36", text: 'Datasource "db": PostgreSQL database "neondb", schema "public" at ep-jolly-voice-aq6ilf1i-pooler.c-8.us-east-1.aws.neon.tech' },
      { severity: "info"    as Severity, ts: "06:26:38", text: "1 migration found in prisma/migrations" },
      { severity: "success" as Severity, ts: "06:26:39", text: "No pending migrations to apply." },
      { severity: "muted"   as Severity, ts: "06:26:41", text: "[stage-0  8/10] RUN build  ✓ done (47s)" },
      { severity: "muted"   as Severity, ts: "06:26:41", text: "[stage-0  9/10] RUN printf 'PATH=/app/node_modules/.bin:$PATH' >> /root/.profile" },
      { severity: "muted"   as Severity, ts: "06:26:43", text: "[stage-0 10/10] COPY . /app" },
    ],
  },
  {
    id: "push",
    title: "export & push",
    badge: null,
    defaultOpen: false,
    entries: [
      { severity: "info"    as Severity, ts: "06:26:47", text: "exporting to docker image format..." },
      { severity: "success" as Severity, ts: "06:27:01", text: "export complete (14s)" },
      { severity: "info"    as Severity, ts: "06:27:17", text: "containerimage.digest: sha256:12a7ed0370dd0be03cdf92084bd5d1d888057bbc6f0691c830680b6ef1656caa" },
      { severity: "info"    as Severity, ts: "06:27:29", text: "image push → complete" },
    ],
  },
  {
    id: "healthcheck",
    title: "healthcheck",
    badge: { count: 0, color: "green" as const },
    defaultOpen: true,
    entries: [
      { severity: "step"    as Severity, ts: "06:27:36", text: "==================== Starting Healthcheck ====================" },
      { severity: "info"    as Severity, ts: "06:27:36", text: "Path: /health" },
      { severity: "info"    as Severity, ts: "06:27:36", text: "Retry window: 1m0s" },
      { severity: "success" as Severity, ts: "06:27:36", text: "[1/1] Healthcheck succeeded!" },
    ],
  },
  {
    id: "runtime",
    title: "runtime — application failed",
    badge: { count: 1, color: "red" as const },
    defaultOpen: true,
    entries: [
      { severity: "info"  as Severity, ts: "06:27:38", text: "ShipDesk server running on port 3000" },
      { severity: "info"  as Severity, ts: "06:27:38", text: "Environment: production" },
      { severity: "info"  as Severity, ts: "06:27:38", text: "Schedulers started — reports: Fridays 09:00 UTC, overdue check: daily 00:00 UTC" },
      { severity: "error" as Severity, ts: "06:27:41", text: "GET /health → upstream connect error or disconnect/reset before headers" },
      { severity: "error" as Severity, ts: "06:27:41", text: "Railway: Application failed to respond  (request-id: 1LBA3rOGSEGTf0eFac17Nw)" },
      { severity: "error" as Severity, ts: "06:27:41", text: "Root cause: build command included `npm run build --workspace=client` — Vite requires VITE_CLERK_PUBLISHABLE_KEY which is not set on Railway (Vercel-only). Client build fails, breaking the && chain, so server/dist/index.js was never created. Start command exits immediately with MODULE_NOT_FOUND." },
      { severity: "info"  as Severity, ts: "06:27:41", text: "Fix applied: railway.json updated — client build removed. Only npm run build --workspace=server runs on Railway." },
    ],
  },
];

function LogRow({ entry, lineNo }: { entry: LogEntry; lineNo: number }) {
  const isWarn    = entry.severity === "warn";
  const isError   = entry.severity === "error";
  const isSuccess = entry.severity === "success";
  const isStep    = entry.severity === "step";
  const isMuted   = entry.severity === "muted";

  return (
    <div
      className={`flex gap-0 group ${
        isWarn  ? "bg-yellow-400/10 border-l-2 border-yellow-400/60" :
        isError ? "bg-red-500/10 border-l-2 border-red-500/60" :
                  "border-l-2 border-transparent"
      }`}
      data-testid={`log-row-${lineNo}`}
    >
      <span className="text-zinc-700 select-none font-mono text-xs w-7 text-right flex-shrink-0 px-1 py-0.5 leading-5">
        {lineNo}
      </span>
      {entry.ts && (
        <span className="text-zinc-600 select-none font-mono text-xs flex-shrink-0 px-2 py-0.5 leading-5 w-16">
          {entry.ts}
        </span>
      )}
      <span
        className={`font-mono text-xs leading-5 py-0.5 px-2 flex-1 break-all ${
          isWarn    ? "text-yellow-300 font-medium" :
          isError   ? "text-red-400 font-medium" :
          isSuccess ? "text-emerald-400" :
          isStep    ? "text-sky-300" :
          isMuted   ? "text-zinc-600" :
                      "text-zinc-400"
        }`}
      >
        {isWarn  && <span className="text-yellow-500/80 mr-1.5">[warn]</span>}
        {isError && <span className="text-red-500/80 mr-1.5">[error]</span>}
        {entry.text}
      </span>
    </div>
  );
}

function SectionBadge({ badge }: { badge: { count: number; color: "yellow" | "red" | "green" } | null }) {
  if (!badge) return null;
  if (badge.color === "green") {
    return (
      <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded px-2 py-0.5 flex items-center gap-1">
        <CheckCircle className="h-3 w-3" /> passed
      </span>
    );
  }
  if (badge.color === "red") {
    return (
      <span className="text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/25 rounded px-2 py-0.5 flex items-center gap-1">
        <XCircle className="h-3 w-3" /> {badge.count} error
      </span>
    );
  }
  return (
    <span className="text-xs font-mono bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 rounded px-2 py-0.5">
      {badge.count} warnings
    </span>
  );
}

function Section({
  id, title, entries, defaultOpen, badge,
}: {
  id: string;
  title: string;
  entries: LogEntry[];
  defaultOpen: boolean;
  badge: { count: number; color: "yellow" | "red" | "green" } | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isError = badge?.color === "red";

  return (
    <div className={`rounded-lg overflow-hidden border ${isError ? "border-red-500/40" : "border-zinc-700/60"}`}>
      <button
        className={`w-full flex items-center gap-2 px-3 py-2 transition-colors text-left ${
          isError ? "bg-red-950/60 hover:bg-red-950/80" : "bg-zinc-800 hover:bg-zinc-800/80"
        }`}
        onClick={() => setOpen((v) => !v)}
        data-testid={`section-toggle-${id}`}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        )}
        <span className={`font-mono text-sm font-medium flex-1 ${isError ? "text-red-300" : "text-zinc-200"}`}>
          {title}
        </span>
        <SectionBadge badge={badge} />
      </button>
      {open && (
        <div className="bg-zinc-950">
          {entries.map((entry, i) => (
            <LogRow key={i} entry={entry} lineNo={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BuildLogsDemo() {
  const totalWarns = WARN_ENTRIES.length;
  const [showError, setShowError] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 rounded-lg p-2">
              <Terminal className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-zinc-100 font-semibold text-base">Build Logs</h1>
              <p className="text-zinc-500 text-xs font-mono">
                shipdesk-server — Railway · deployment cb2e35be · 2026-05-22 06:24
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 rounded-full px-3 py-1">
              <AlertTriangle className="h-3 w-3" />
              {totalWarns} warnings
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full px-3 py-1">
              <CheckCircle className="h-3 w-3" />
              build passed
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-red-500/10 text-red-400 border border-red-500/25 rounded-full px-3 py-1">
              <XCircle className="h-3 w-3" />
              runtime failed
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-zinc-700/40 text-zinc-400 border border-zinc-600/30 rounded-full px-3 py-1">
              <Clock className="h-3 w-3" />
              2m 44s
            </span>
          </div>
        </div>

        {/* Runtime error banner */}
        <div className="rounded-lg border border-red-500/30 bg-red-500/8 px-4 py-3 flex items-start gap-3">
          <XCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-red-300 text-sm font-medium">Application failed to respond</p>
            <p className="text-red-300/70 text-xs mt-0.5 leading-relaxed">
              The build and healthcheck both passed, but the server crashed at runtime. Root cause: the previous
              <span className="font-mono bg-red-500/15 px-1 rounded mx-1">railway.json</span>
              included <span className="font-mono bg-red-500/15 px-1 rounded">npm run build --workspace=client</span> —
              Vite requires <span className="font-mono bg-red-500/15 px-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</span> which
              is only set in Vercel, not Railway. The client build failed, breaking the <span className="font-mono bg-red-500/15 px-1 rounded">&&</span> chain,
              so <span className="font-mono bg-red-500/15 px-1 rounded">server/dist/index.js</span> was never created and the start command exited immediately.
            </p>
            <button
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline underline-offset-2 font-mono transition-colors"
              onClick={() => setShowError((v) => !v)}
              data-testid="toggle-error-screenshot"
            >
              {showError ? "hide error screenshot ↑" : "show error screenshot ↓"}
            </button>
          </div>
        </div>

        {/* Railway error screenshot */}
        {showError && (
          <div className="rounded-lg overflow-hidden border border-red-500/30 shadow-lg shadow-red-950/40">
            <div className="bg-zinc-800 px-3 py-2 flex items-center gap-2 border-b border-zinc-700/60">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/70" />
                <span className="w-3 h-3 rounded-full bg-yellow-400/50" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/40" />
              </div>
              <span className="font-mono text-xs text-zinc-400 flex-1 text-center">
                shipdesk-server-production.up.railway.app/health
              </span>
            </div>
            <img
              src={railwayErrorImg}
              alt="Railway: Application failed to respond"
              className="w-full block"
              data-testid="railway-error-screenshot"
            />
          </div>
        )}

        {/* Warning banner */}
        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/8 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">Dockerfile security warnings detected</p>
            <p className="text-yellow-300/70 text-xs mt-0.5">
              {totalWarns} sensitive environment variables exposed via ARG/ENV in the generated Dockerfile.
              These are warnings only — the build succeeded.
            </p>
          </div>
        </div>

        {/* Log sections */}
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <Section
              key={s.id}
              id={s.id}
              title={s.title}
              entries={s.entries}
              defaultOpen={s.defaultOpen}
              badge={s.badge}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2">
          <Info className="h-3.5 w-3.5 text-zinc-600" />
          <p className="text-zinc-600 text-xs font-mono">
            Dockerfile warnings are generated by Nixpacks linting and do not affect build success.
          </p>
        </div>
      </div>
    </div>
  );
}
