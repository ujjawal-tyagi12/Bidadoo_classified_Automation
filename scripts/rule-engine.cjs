#!/usr/bin/env node

/**
 * Framework Rule Engine
 * Validates architectural conventions defined in rules/framework-rules.json.
 *
 * Usage:
 *   node scripts/rule-engine.js                   # Check all source roots
 *   node scripts/rule-engine.js --staged          # Only git-staged files
 *   node scripts/rule-engine.js --changed         # Only changed files
 *   node scripts/rule-engine.js --config=path.json # Custom config
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const args = process.argv.slice(2);
const configArg = args.find((a) => a.startsWith("--config="));
const configPath = configArg
  ? configArg.split("=")[1]
  : "rules/framework-rules.json";
const checkStaged = args.includes("--staged");
const checkChanged = args.includes("--changed");

const repoRoot = process.cwd();
const absoluteConfigPath = path.resolve(repoRoot, configPath);

if (!fs.existsSync(absoluteConfigPath)) {
  console.error(`Rule config not found: ${absoluteConfigPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(absoluteConfigPath, "utf8"));

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function isInsideFolder(filePath, folder) {
  const f = toPosix(filePath);
  const d = toPosix(folder).replace(/\/$/, "");
  return f === d || f.startsWith(`${d}/`);
}

function walk(dirPath, results = []) {
  if (!fs.existsSync(dirPath)) return results;
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".features-gen")
        continue;
      walk(full, results);
    } else if (entry.isFile() && /\.(ts|feature)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

function listGitFiles(cmd) {
  try {
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    if (!out) return [];
    return out
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
      .filter((f) => /\.(ts|feature)$/.test(f))
      .filter((f) => fs.existsSync(path.resolve(repoRoot, f)));
  } catch {
    return [];
  }
}

function collectFiles() {
  if (checkStaged)
    return listGitFiles("git diff --cached --name-only --diff-filter=ACMR");
  if (checkChanged) {
    const changed = listGitFiles(
      "git diff --name-only --diff-filter=ACMR HEAD",
    );
    return changed.length > 0 ? changed : listGitFiles("git ls-files");
  }
  return Array.from(
    new Set(
      (config.sourceRoots || []).flatMap((root) =>
        walk(path.resolve(repoRoot, root)).map((f) =>
          toPosix(path.relative(repoRoot, f)),
        ),
      ),
    ),
  );
}

function firstMatchLine(content, regexText) {
  const m = new RegExp(regexText, "m").exec(content);
  if (!m || typeof m.index !== "number") return 1;
  return content.slice(0, m.index).split("\n").length;
}

function basenameMatches(regexText, filePath) {
  return new RegExp(regexText).test(path.basename(filePath));
}

function checkPlacement(filePath, issues) {
  for (const rule of config.placementRules || []) {
    if (!basenameMatches(rule.fileRegex, filePath)) continue;
    if (!isInsideFolder(filePath, rule.mustBeUnder)) {
      issues.push({
        severity: "error",
        ruleId: rule.id,
        filePath,
        line: 1,
        message: `${rule.message}. Expected folder: ${rule.mustBeUnder}`,
      });
    }
  }
}

function checkFolderNaming(filePath, issues) {
  const fileName = path.basename(filePath);
  for (const rule of config.folderNamingRules || []) {
    if (!isInsideFolder(filePath, rule.folder)) continue;
    const allowed = (rule.allowedFileRegex || []).some((r) =>
      new RegExp(r).test(fileName),
    );
    if (!allowed) {
      issues.push({
        severity: "error",
        ruleId: rule.id,
        filePath,
        line: 1,
        message: `${rule.message}. Found: ${fileName}`,
      });
    }
  }
}

function checkContent(filePath, content, rule, severity, issues) {
  if (!isInsideFolder(filePath, rule.folder)) return;
  if (rule.fileRegex && !basenameMatches(rule.fileRegex, filePath)) return;

  for (const r of rule.requireRegex || []) {
    if (!new RegExp(r, "m").test(content)) {
      issues.push({ severity, ruleId: rule.id, filePath, line: 1, message: rule.message });
    }
  }
  for (const r of rule.forbidRegex || []) {
    if (new RegExp(r, "m").test(content)) {
      issues.push({
        severity,
        ruleId: rule.id,
        filePath,
        line: firstMatchLine(content, r),
        message: rule.message,
      });
    }
  }
}

function run() {
  const files = collectFiles();
  if (files.length === 0) {
    console.log("No files found for rule validation.");
    return { errors: [], warnings: [] };
  }

  const issues = [];

  for (const filePath of files) {
    const abs = path.resolve(repoRoot, filePath);
    const content = fs.readFileSync(abs, "utf8");

    checkPlacement(filePath, issues);
    checkFolderNaming(filePath, issues);

    for (const rule of config.contentRules || [])
      checkContent(filePath, content, rule, "error", issues);
    for (const rule of config.warningRules || [])
      checkContent(filePath, content, rule, "warning", issues);
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  console.log(`\nRule engine checked ${files.length} file(s).\n`);

  for (const e of errors)
    console.error(`ERROR   [${e.ruleId}] ${e.filePath}:${e.line} — ${e.message}`);
  for (const w of warnings)
    console.warn(`WARNING [${w.ruleId}] ${w.filePath}:${w.line} — ${w.message}`);

  if (errors.length === 0) {
    console.log(
      `\n✓ Rule validation passed with ${warnings.length} warning(s).`,
    );
  } else {
    console.error(
      `\n✗ Rule validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`,
    );
  }

  return { errors, warnings };
}

const result = run();
process.exit(result.errors.length > 0 ? 1 : 0);
