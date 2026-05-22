import { useState } from "react";
import { ChevronDown, ChevronRight, Terminal } from "lucide-react";

type LogSeverity = "info" | "warn" | "error" | "success" | "step";

interface LogLine {
  severity: LogSeverity;
  message: string;
  indented?: boolean;
}

function classifyLine(raw: string): LogLine {
  const trimmed = raw.trim();

  if (!trimmed) return { severity: "info", message: "" };

  if (/^\[warn\]/i.test(trimmed) || /^warn\b/i.test(trimmed)) {
    return { severity: "warn", message: trimmed };
  }
  if (/^\[error\]/i.test(trimmed) || /^error\b/i.test(trimmed)) {
    return { severity: "error", message: trimmed };
  }

  if (/details:/.test(trimmed)) {
    return { severity: "warn", message: trimmed, indented: true };
  }

  if (
    /✔|✓|success|succeeded|complete|ready|running on port|generated|no pending/i.test(trimmed)
  ) {
    return { severity: "success", message: trimmed };
  }

  if (/^(╔|║|╚|╟|├|└|─|\[stage-|FROM |WORKDIR|COPY |RUN |npm (ci|install)|added \d+|npx |prisma)/.test(trimmed)) {
    return { severity: "step", message: trimmed };
  }

  return { severity: "info", message: trimmed };
}

function lineColor(severity: LogSeverity, indented?: boolean): string {
  switch (severity) {
    case "warn":
      return indented
        ? "text-yellow-300/80"
        : "text-yellow-300 font-medium";
    case "error":
      return "text-red-400 font-medium";
    case "success":
      return "text-emerald-400";
    case "step":
      return "text-sky-300";
    default:
      return "text-zinc-400";
  }
}

function lineBg(severity: LogSeverity): string {
  if (severity === "warn") return "bg-yellow-400/10";
  if (severity === "error") return "bg-red-500/10";
  return "";
}

interface BuildLogsSectionProps {
  title: string;
  lines: string[];
  defaultOpen?: boolean;
}

function BuildLogsSection({ title, lines, defaultOpen = false }: BuildLogsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const warnCount = lines.filter((l) => /^\[warn\]/i.test(l.trim()) || /details:/.test(l)).length;
  const errorCount = lines.filter((l) => /^\[error\]/i.test(l.trim())).length;

  return (
    <div className="border border-zinc-700/60 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
        data-testid={`build-section-toggle-${title}`}
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-500 flex-shrink-0" />
        )}
        <span className="text-sm font-mono font-medium text-zinc-200 flex-1">{title}</span>
        <div className="flex items-center gap-2">
          {warnCount > 0 && (
            <span className="text-xs font-mono bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 rounded px-1.5 py-0.5">
              {warnCount} warn
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/30 rounded px-1.5 py-0.5">
              {errorCount} error
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="divide-y divide-zinc-800/50">
          {lines.map((raw, i) => {
            const { severity, message, indented } = classifyLine(raw);
            if (!message) return <div key={i} className="h-1" />;
            return (
              <div
                key={i}
                className={`flex gap-3 px-4 py-0.5 font-mono text-xs leading-5 ${lineBg(severity)}`}
                data-testid={`log-line-${i}`}
              >
                <span className="text-zinc-600 select-none w-6 text-right flex-shrink-0">{i + 1}</span>
                <span className={`${lineColor(severity, indented)} ${indented ? "pl-4" : ""} break-all`}>
                  {message}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const SAMPLE_SECTIONS: { title: string; lines: string[]; defaultOpen?: boolean }[] = [
  {
    title: "setup",
    lines: [
      "[info] using build driver nixpacks-v1.41.0",
      "[info] ╔══════════════════════════════ Nixpacks v1.41.0 ══════════════════════════════╗",
      "[info] ║ setup      │ nodejs_24, npm-9_x, openssl                                     ║",
      "[info] ║ install    │ npm ci                                                           ║",
      "[info] ║ build      │ npm install --include=dev && npm run build --workspace=server    ║",
      "[info] ║            │ && node_modules/.bin/prisma migrate deploy                       ║",
      "[info] ║ start      │ cd server && node dist/index.js                                  ║",
      "[info] ╚══════════════════════════════════════════════════════════════════════════════╝",
    ],
    defaultOpen: true,
  },
  {
    title: "dockerfile lint",
    lines: [
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"AES_ENCRYPTION_KEY\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"CLERK_SECRET_KEY\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"CLERK_WEBHOOK_SECRET\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"CLOUDINARY_API_KEY\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"CLOUDINARY_API_SECRET\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"GEMINI_API_KEY\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"GITHUB_CLIENT_SECRET\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"GITHUB_WEBHOOK_SECRET\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"RESEND_API_KEY\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ARG \"SESSION_SECRET\") (line 11)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"AES_ENCRYPTION_KEY\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"CLERK_SECRET_KEY\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"CLERK_WEBHOOK_SECRET\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"CLOUDINARY_API_KEY\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"CLOUDINARY_API_SECRET\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"GEMINI_API_KEY\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"GITHUB_CLIENT_SECRET\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"GITHUB_WEBHOOK_SECRET\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"RESEND_API_KEY\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] SecretsUsedInArgOrEnv: Do not use ARG or ENV instructions for sensitive data (ENV \"SESSION_SECRET\") (line 12)(https://docs.docker.com/go/dockerfile/rule/secrets-used-in-arg-or-env/)",
      " details: Sensitive data should not be used in the ARG or ENV commands",
      "[warn] UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 18)(https://docs.docker.com/go/dockerfile/rule/undefined-var/)",
      " details: Variables should be defined before their use",
    ],
    defaultOpen: true,
  },
  {
    title: "install",
    lines: [
      "[info] [stage-0  6/10] RUN npm ci",
      "[info] npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead",
      "[info] npm warn deprecated uuid@8.3.2: uuid@10 and below is no longer supported.",
      "[info] npm warn deprecated glob@10.5.0: Old versions of glob are not supported.",
      "[info] added 527 packages, and audited 530 packages in 9s",
      "[info] 173 packages are looking for funding",
      "[info] 7 vulnerabilities (2 moderate, 5 high)",
    ],
  },
  {
    title: "build",
    lines: [
      "[info] > shipdesk-server@1.0.0 build",
      "[info] > npx prisma generate && npx tsc --project tsconfig.json",
      "[info] Prisma schema loaded from prisma/schema.prisma",
      "[info] ✔ Generated Prisma Client (v5.22.0) to ./../node_modules/@prisma/client in 378ms",
      "[info] Prisma schema loaded from server/prisma/schema.prisma",
      "[info] Datasource \"db\": PostgreSQL database \"neondb\", schema \"public\"",
      "[info] 1 migration found in prisma/migrations",
      "[info] No pending migrations to apply.",
    ],
  },
  {
    title: "healthcheck",
    lines: [
      "[info] ====================",
      "[info] Starting Healthcheck",
      "[info] ====================",
      "[info] Path: /health",
      "[info] Retry window: 1m0s",
      "[info] [1/1] Healthcheck succeeded!",
    ],
  },
];

interface BuildLogsViewerProps {
  sections?: typeof SAMPLE_SECTIONS;
}

export function BuildLogsViewer({ sections = SAMPLE_SECTIONS }: BuildLogsViewerProps) {
  const totalWarns = sections.reduce(
    (acc, s) => acc + s.lines.filter((l) => /^\[warn\]/i.test(l.trim()) || /details:/.test(l)).length,
    0
  );
  const totalErrors = sections.reduce(
    (acc, s) => acc + s.lines.filter((l) => /^\[error\]/i.test(l.trim())).length,
    0
  );

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900 text-zinc-100 font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-800/90 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-200">Build Logs</span>
        </div>
        <div className="flex items-center gap-2">
          {totalWarns > 0 && (
            <span
              className="text-xs font-mono bg-yellow-400/15 text-yellow-300 border border-yellow-400/30 rounded-full px-2.5 py-0.5"
              data-testid="warn-count-badge"
            >
              {totalWarns} warnings
            </span>
          )}
          {totalErrors > 0 && (
            <span
              className="text-xs font-mono bg-red-500/15 text-red-400 border border-red-500/30 rounded-full px-2.5 py-0.5"
              data-testid="error-count-badge"
            >
              {totalErrors} errors
            </span>
          )}
          {totalErrors === 0 && (
            <span className="text-xs font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-2.5 py-0.5">
              build passed
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="p-3 space-y-2">
        {sections.map((section) => (
          <BuildLogsSection
            key={section.title}
            title={section.title}
            lines={section.lines}
            defaultOpen={section.defaultOpen}
          />
        ))}
      </div>
    </div>
  );
}
