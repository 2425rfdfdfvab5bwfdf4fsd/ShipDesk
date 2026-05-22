import { Terminal, ChevronDown, ChevronRight, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useState } from "react";

type Severity = "warn" | "error" | "info" | "success" | "step";

interface LogEntry {
  severity: Severity;
  text: string;
  sub?: string;
}

const WARN_LINES: LogEntry[] = [
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "AES_ENCRYPTION_KEY") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLERK_SECRET_KEY") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLERK_WEBHOOK_SECRET") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLOUDINARY_API_KEY") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "CLOUDINARY_API_SECRET") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GEMINI_API_KEY") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GITHUB_CLIENT_SECRET") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "GITHUB_WEBHOOK_SECRET") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "RESEND_API_KEY") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG "SESSION_SECRET") (line 11)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "AES_ENCRYPTION_KEY") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLERK_SECRET_KEY") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLERK_WEBHOOK_SECRET") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLOUDINARY_API_KEY") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "CLOUDINARY_API_SECRET") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GEMINI_API_KEY") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GITHUB_CLIENT_SECRET") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "GITHUB_WEBHOOK_SECRET") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "RESEND_API_KEY") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: 'SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV "SESSION_SECRET") (line 12)',
    sub: "Sensitive data should not be used in the ARG or ENV commands",
  },
  {
    severity: "warn",
    text: "UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)",
    sub: "Variables should be defined before their use",
  },
];

const SECTIONS = [
  {
    id: "setup",
    title: "setup",
    defaultOpen: false,
    entries: [
      { severity: "info" as Severity, text: "using build driver nixpacks-v1.41.0" },
      { severity: "step" as Severity, text: "╔══════════════════════════════ Nixpacks v1.41.0 ══════════════════════════════╗" },
      { severity: "step" as Severity, text: "║ setup      │ nodejs_24, npm-9_x, openssl                                     ║" },
      { severity: "step" as Severity, text: "║ install    │ npm ci                                                           ║" },
      { severity: "step" as Severity, text: "║ build      │ npm install --include=dev && npm run build --workspace=client    ║" },
      { severity: "step" as Severity, text: "║            │ && npm run build --workspace=server                             ║" },
      { severity: "step" as Severity, text: "║            │ && node_modules/.bin/prisma migrate deploy                      ║" },
      { severity: "step" as Severity, text: "║ start      │ cd server && node dist/index.js                                 ║" },
      { severity: "step" as Severity, text: "╚══════════════════════════════════════════════════════════════════════════════╝" },
    ],
  },
  {
    id: "lint",
    title: "dockerfile lint",
    defaultOpen: true,
    entries: WARN_LINES,
  },
  {
    id: "install",
    title: "install",
    defaultOpen: false,
    entries: [
      { severity: "step" as Severity, text: "[stage-0  6/10] RUN npm ci" },
      { severity: "info" as Severity, text: "npm warn deprecated node-domexception@1.0.0" },
      { severity: "info" as Severity, text: "npm warn deprecated uuid@8.3.2" },
      { severity: "info" as Severity, text: "npm warn deprecated glob@10.5.0" },
      { severity: "success" as Severity, text: "added 527 packages, and audited 530 packages in 9s" },
      { severity: "info" as Severity, text: "7 vulnerabilities (2 moderate, 5 high)" },
    ],
  },
  {
    id: "build",
    title: "build",
    defaultOpen: false,
    entries: [
      { severity: "step" as Severity, text: "> shipdesk-server@1.0.0 build" },
      { severity: "step" as Severity, text: "> npx prisma generate && npx tsc --project tsconfig.json" },
      { severity: "success" as Severity, text: "✔ Generated Prisma Client (v5.22.0) in 378ms" },
      { severity: "info" as Severity, text: 'Datasource "db": PostgreSQL database "neondb", schema "public"' },
      { severity: "success" as Severity, text: "1 migration found in prisma/migrations" },
      { severity: "success" as Severity, text: "No pending migrations to apply." },
    ],
  },
  {
    id: "healthcheck",
    title: "healthcheck",
    defaultOpen: false,
    entries: [
      { severity: "step" as Severity, text: "====================" },
      { severity: "step" as Severity, text: "Starting Healthcheck" },
      { severity: "step" as Severity, text: "====================" },
      { severity: "info" as Severity, text: "Path: /health" },
      { severity: "info" as Severity, text: "Retry window: 1m0s" },
      { severity: "success" as Severity, text: "[1/1] Healthcheck succeeded!" },
    ],
  },
];

function warnCount(entries: LogEntry[]) {
  return entries.filter((e) => e.severity === "warn").length;
}

function LogRow({ entry, lineNo }: { entry: LogEntry; lineNo: number }) {
  const isWarn = entry.severity === "warn";
  const isError = entry.severity === "error";
  const isSuccess = entry.severity === "success";
  const isStep = entry.severity === "step";

  return (
    <>
      <div
        className={`flex gap-0 group ${isWarn ? "bg-yellow-400/10 border-l-2 border-yellow-400/60" : isError ? "bg-red-500/10 border-l-2 border-red-500/60" : "border-l-2 border-transparent"}`}
        data-testid={`log-row-${lineNo}`}
      >
        <span className="text-zinc-600 select-none font-mono text-xs w-8 text-right flex-shrink-0 px-1 py-0.5 leading-5">
          {lineNo}
        </span>
        <span
          className={`font-mono text-xs leading-5 py-0.5 px-2 flex-1 break-all ${
            isWarn
              ? "text-yellow-300 font-medium"
              : isError
              ? "text-red-400 font-medium"
              : isSuccess
              ? "text-emerald-400"
              : isStep
              ? "text-sky-300"
              : "text-zinc-400"
          }`}
        >
          {isWarn && <span className="text-yellow-500 mr-1">[warn]</span>}
          {isError && <span className="text-red-500 mr-1">[error]</span>}
          {entry.text}
        </span>
      </div>
      {entry.sub && (
        <div className="flex gap-0 bg-yellow-400/5 border-l-2 border-yellow-400/40">
          <span className="w-8 flex-shrink-0" />
          <span className="font-mono text-xs text-yellow-300/70 leading-5 py-0.5 px-2 pl-6 break-all">
            details: {entry.sub}
          </span>
        </div>
      )}
    </>
  );
}

function Section({
  id,
  title,
  entries,
  defaultOpen,
}: {
  id: string;
  title: string;
  entries: LogEntry[];
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const warns = warnCount(entries);

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-700/60">
      <button
        className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-750 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
        data-testid={`section-toggle-${id}`}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        )}
        <span className="font-mono text-sm font-medium text-zinc-200 flex-1">{title}</span>
        {warns > 0 && (
          <span className="text-xs font-mono bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 rounded px-2 py-0.5">
            {warns} warnings
          </span>
        )}
      </button>
      {open && (
        <div className="bg-zinc-900">
          {entries.map((entry, i) => (
            <LogRow key={i} entry={entry} lineNo={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function BuildLogsDemo() {
  const totalWarns = WARN_LINES.length;

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-800 rounded-lg p-2">
              <Terminal className="h-5 w-5 text-zinc-300" />
            </div>
            <div>
              <h1 className="text-zinc-100 font-semibold text-base">Build Logs</h1>
              <p className="text-zinc-500 text-xs font-mono">shipdesk — Railway deployment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-yellow-400/10 text-yellow-300 border border-yellow-400/25 rounded-full px-3 py-1">
              <AlertTriangle className="h-3 w-3" />
              {totalWarns} warnings
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full px-3 py-1">
              <CheckCircle className="h-3 w-3" />
              build passed
            </span>
          </div>
        </div>

        {/* Warning banner */}
        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/8 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-300 text-sm font-medium">Dockerfile security warnings detected</p>
            <p className="text-yellow-300/70 text-xs mt-0.5">
              {totalWarns} sensitive environment variables are exposed via ARG/ENV instructions in the generated Dockerfile.
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
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 pt-2">
          <Info className="h-3.5 w-3.5 text-zinc-600" />
          <p className="text-zinc-600 text-xs font-mono">
            Warnings are generated by Nixpacks/Docker linting. They do not affect build success.
          </p>
        </div>
      </div>
    </div>
  );
}
