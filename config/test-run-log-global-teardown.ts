import fs from "node:fs/promises";
import path from "node:path";

export default async function globalTeardown(): Promise<void> {
  try {
    await fs.unlink(path.join(process.cwd(), "logs", ".current-run-id"));
  } catch {
    
  }
}
