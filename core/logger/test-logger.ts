import fs from "node:fs/promises";
import path from "node:path";
import type { TestInfo } from "@playwright/test";

export type LogLevel = "info" | "warn" | "error";

export type TestLogger = {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  attachText: (name: string, body: string) => Promise<void>;
  flush: () => Promise<void>;
};

type LogLine = {
  ts: string;
  level: LogLevel;
  message: string;
};

const nowIso = () => new Date().toISOString();

let cachedRunLogPath: string | undefined;

async function resolveRunLogPath(): Promise<string> {
  if (cachedRunLogPath) return cachedRunLogPath;
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });
  const idFile = path.join(logsDir, ".current-run-id");
  try {
    const runId = (await fs.readFile(idFile, "utf8")).trim();
    cachedRunLogPath = path.join(logsDir, `run-${runId}.log`);
  } catch {
    const fallback = `${new Date().toISOString().replace(/[:.]/g, "-")}-pid${process.pid}`;
    cachedRunLogPath = path.join(logsDir, `run-${fallback}.log`);
  }
  return cachedRunLogPath;
}

export function createTestLogger(testInfo: TestInfo): TestLogger {
  const lines: LogLine[] = [];

  const write = (level: LogLevel, message: string) => {
    const line: LogLine = { ts: nowIso(), level, message };
    lines.push(line);

    const prefix = `[${level.toUpperCase()}]`;
    // Keep console output for local debugging and CI logs.
    if (level === "error") console.error(prefix, message);
    else if (level === "warn") console.warn(prefix, message);
    else console.log(prefix, message);
  };

  const attachText = async (name: string, body: string) => {
    await testInfo.attach(name, { body, contentType: "text/plain" });
  };

  const flush = async () => {
    if (lines.length === 0) return;
    const body = lines
      .map((l) => `${l.ts} [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    await attachText("test-log", body);

    const runLogPath = await resolveRunLogPath();
    const header =
      `\n${"=".repeat(72)}\n` +
      `${nowIso()}  worker=${testInfo.workerIndex}  ${testInfo.title}\n` +
      (testInfo.file ? `File: ${testInfo.file}\n` : "") +
      `${"=".repeat(72)}\n`;
    await fs.appendFile(runLogPath, header + body + "\n", "utf8");
  };

  return {
    info: (m) => write("info", m),
    warn: (m) => write("warn", m),
    error: (m) => write("error", m),
    attachText,
    flush,
  };
}

