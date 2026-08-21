import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ASSETS_DIR = path.join(PROJECT_ROOT, "data", "testdata", "assets");

export function resolveTestAssetPath(filename: string): string {
  return path.join(ASSETS_DIR, filename);
}

/**
 * Picks a random image file (.png, .jpg, .jpeg, .webp) from `data/testdata/assets/`
 * and returns its absolute path.
 */
export function pickRandomTestImage(): string {
  const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
  const files = fs.readdirSync(ASSETS_DIR).filter((f) =>
    imageExtensions.has(path.extname(f).toLowerCase()),
  );
  if (files.length === 0) {
    throw new Error(`No image files found in ${ASSETS_DIR}`);
  }
  const picked = files[Math.floor(Math.random() * files.length)];
  return path.join(ASSETS_DIR, picked);
}
