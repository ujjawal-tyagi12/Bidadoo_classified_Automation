import { readFileSync } from "fs";
import { join } from "path";

export function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(process.cwd(), relativePath), "utf-8"));
}

/**
 * Resolve a relative path to a data file. Uses env override when provided.
 * @param defaultDir - Default directory (relative to cwd), e.g. "data/testdata"
 * @param filename - File name, e.g. "google-search.json"
 * @param envKey - Optional env var to override the directory (e.g. "TESTDATA_PATH")
 * @returns Relative path suitable for loadJson()
 */
export function resolveDataPath(
  defaultDir: string,
  filename: string,
  envKey?: string
): string {
  const dir = envKey && process.env[envKey] ? process.env[envKey]! : defaultDir;
  return join(dir, filename);
}
