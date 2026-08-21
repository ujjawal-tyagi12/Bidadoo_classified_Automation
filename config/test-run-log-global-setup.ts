import fs from "node:fs/promises";
import path from "node:path";


export default async function globalSetup(): Promise<void> {
  const logsDir = path.join(process.cwd(), "logs");
  await fs.mkdir(logsDir, { recursive: true });
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const idFile = path.join(logsDir, ".current-run-id");
  const logFile = path.join(logsDir, `run-${runId}.log`);
  await fs.writeFile(idFile, runId, "utf8");
  await fs.writeFile(
    logFile,
    `${new Date().toISOString()} [INFO] Test run started (run id: ${runId})\n\n`,
    "utf8",
  );
}
