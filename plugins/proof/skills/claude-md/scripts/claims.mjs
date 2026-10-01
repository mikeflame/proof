// src/cli.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join as join3 } from "node:path";
import { parseArgs } from "node:util";

// src/report.ts
import { spawnSync as spawnSync2 } from "node:child_process";
import { existsSync as existsSync3, readFileSync as readFileSync2, realpathSync } from "node:fs";
import { relative as relative2, resolve } from "node:path";

// src/check.ts
import { spawnSync } from "node:child_process";
import { existsSync, globSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
var IGNORED_DIR = /(^|\/)(node_modules|\.git|dist|\.next|\.proof)(\/|$)/;
var skipIgnored = (p) => IGNORED_DIR.test(typeof p === "string" ? p : String(p?.name ?? ""));
function createContext(root, docFile) {
  const files = globSync(["package.json", "*/package.json", "*/*/package.json"], { cwd: root, exclude: skipIgnored }).sort();
  const packages = files.map((file) => {
    const json = JSON.parse(readFileSync(join(root, file), "utf8"));
    return {
      dir: dirname(file),
      file,
      scripts: json.scripts ?? {},
      deps: { ...json.peerDependencies, ...json.devDependencies, ...json.dependencies },
      engines: json.engines ?? {}
    };
  });
  return {
    root,
    docFile,
    isGit: existsSync(join(root, ".git")),
    packages,
    projectDirs: packages.map((p) => p.dir).filter((d) => d !== ".")
  };
}
var ok = (span, evidence) => ({ ...span, status: "VERIFIED", evidence });
var stale = (span, evidence) => ({ ...span, status: "STALE", evidence });
var unconfirmed = (span, evidence) => ({ ...span, status: "UNCONFIRMED", evidence });
var skipped = (span, evidence) => ({ ...span, status: "SKIPPED", evidence });
function expandPattern(p) {
  const withStars = p.replace(/<[^>/]+>/g, "*").replace(/\[[A-Za-z][\w-]*\]/g, "*");
  const alt = withStars.match(/\{([^}]+)\}/);
  if (!alt) return [withStars];
  return (alt[1] ?? "").split(/[|,]/).flatMap((choice) => expandPattern(withStars.replace(alt[0], choice.trim())));
}
function findPath(ctx, pattern) {
  const wantDir = pattern.endsWith("/");
  const clean = pattern.replace(/^\.\//, "").replace(/\/$/, "");
  if (/[*?]/.test(clean)) {
    return globSync(clean, { cwd: ctx.root, exclude: skipIgnored }).filter((m) => !wantDir || statSync(join(ctx.root, m)).isDirectory()).sort();
  }
  const abs = join(ctx.root, clean);
  if (!existsSync(abs)) return [];
  if (wantDir && !statSync(abs).isDirectory()) return [];
  return [clean];
}
function literalPrefix(pattern) {
  const cut = pattern.search(/[*?]/);
  const head = cut < 0 ? pattern : pattern.slice(0, cut);
  return head.replace(/\/[^/]*$/, "").replace(/\/$/, "") || head.replace(/\/$/, "");
}
function isIgnored(ctx, path) {
  if (!ctx.isGit || !path) return false;
  return spawnSync("git", ["check-ignore", "-q", path], { cwd: ctx.root }).status === 0;
}
function repoFiles(ctx) {
  if (!ctx.files) {
    const res = ctx.isGit ? spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: ctx.root, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }) : null;
    ctx.files = res?.status === 0 ? res.stdout.split("\n").filter(Boolean) : globSync("**/*", { cwd: ctx.root, exclude: skipIgnored });
  }
  return ctx.files;
}
function findAnywhere(ctx, pattern) {
  const clean = pattern.replace(/^\.\//, "").replace(/\/$/, "");
  const body = clean.split("*").map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join("[^/]*");
  const re = new RegExp(`(^|/)${body}(/|$)`);
  const hits = /* @__PURE__ */ new Set();
  for (const f of repoFiles(ctx)) {
    const m = f.match(re);
    if (m && m.index !== void 0) hits.add(f.slice(0, m.index + m[0].length).replace(/\/$/, ""));
  }
  return [...hits].sort();
}
function checkPath(ctx, span) {
  const t = span.text;
  if (t.startsWith("/") || t.startsWith("~")) return skipped(span, "outside the repository");
  const patterns = expandPattern(t);
  const prefix = literalPrefix(patterns[0]?.replace(/^\.\//, "") ?? "");
  if (isIgnored(ctx, prefix)) return skipped(span, `inside ${prefix}/, which git ignores: generated output, not committed files`);
  const docDir = relative(ctx.root, dirname(join(ctx.root, ctx.docFile)));
  const bases = ["", ...docDir ? [docDir] : [], ...ctx.projectDirs];
  for (const base of bases) {
    const found = patterns.map((p) => findPath(ctx, base ? `${base}/${p}` : p));
    if (found.every((f) => f.length > 0)) {
      const all = found.flat();
      const shown = all.slice(0, 3).join(", ");
      const more = all.length > 3 ? ` and ${all.length - 3} more` : "";
      return ok(span, base ? `found under ${base}/: ${shown}${more}` : `${shown}${more}`);
    }
  }
  const missing = patterns.filter((p) => findPath(ctx, p).length === 0).join(", ");
  if (span.kind === "link") return stale(span, `broken link: ${missing}`);
  const segments = t.replace(/^\.\//, "").replace(/\/$/, "").split("/");
  const first = segments[0] ?? "";
  if (segments.length === 1 && !t.endsWith("/")) {
    const anywhere = patterns.flatMap((p) => findAnywhere(ctx, p));
    return anywhere.length ? ok(span, `found at ${anywhere.slice(0, 3).join(", ")}${anywhere.length > 3 ? ` and ${anywhere.length - 3} more` : ""}`) : unconfirmed(span, `no file named ${first} in the repository`);
  }
  const elsewhere = patterns.flatMap((p) => findAnywhere(ctx, p));
  if (elsewhere.length) return ok(span, `found at ${elsewhere.slice(0, 3).join(", ")}, not relative to ${ctx.docFile}`);
  const anchored = segments.length === 1 || bases.some((b) => existsSync(join(ctx.root, b, first)));
  if (anchored) return stale(span, `not found: ${missing}`);
  if (/^@?[a-z][\w-]*\/[a-z][\w-]*$/.test(t)) return skipped(span, `reads as "${t.replace("/", " or ")}" or a rule id, not a path`);
  return unconfirmed(span, `no ${first}/ in this repository; fine if it names a folder somewhere else`);
}
var YARN_BUILTINS = /* @__PURE__ */ new Set([
  "install",
  "add",
  "remove",
  "upgrade",
  "up",
  "init",
  "dlx",
  "why",
  "info",
  "workspace",
  "workspaces",
  "global",
  "cache",
  "config",
  "set",
  "exec",
  "node",
  "bin",
  "pack",
  "publish",
  "link",
  "unlink",
  "audit",
  "outdated",
  "create",
  "import"
]);
function scriptOwners(ctx, script) {
  return ctx.packages.filter((p) => script in p.scripts).map((p) => p.file);
}
function checkCommand(ctx, span) {
  const tokens = span.text.split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ""));
  const [bin, ...args] = tokens;
  if (!bin) return skipped(span, "empty command");
  if (/<[^>]+>/.test(span.text)) return skipped(span, "a template with placeholders, not a command to run");
  if (bin === "yarn" || bin === "pnpm" || bin === "bun" || bin === "npm" && (args[0] === "run" || args[0] === "test")) {
    let script = args[0] === "run" ? args[1] : args[0];
    if (bin === "npm" && args[0] === "test") script = "test";
    if (!script) return skipped(span, `plain \`${bin}\` installs dependencies`);
    if (bin !== "npm" && YARN_BUILTINS.has(script)) return skipped(span, `\`${bin} ${script}\` is a built-in command`);
    const owners = scriptOwners(ctx, script);
    return owners.length ? ok(span, `script "${script}" in ${owners.join(", ")}`) : stale(span, `no package.json defines a "${script}" script`);
  }
  if (bin === "npm") return skipped(span, `\`npm ${args[0] ?? ""}\` is a built-in command`);
  const shellScript = bin === "bash" || bin === "sh" ? args[0] : bin.startsWith("./") ? bin : void 0;
  if (shellScript) {
    const sub = bin === "bash" || bin === "sh" ? args[1] : args[0];
    const file = join(ctx.root, shellScript.replace(/^\.\//, ""));
    if (!existsSync(file)) return stale(span, `${shellScript} does not exist`);
    if (!sub || sub.startsWith("-")) return ok(span, `${shellScript} exists`);
    const lines = readFileSync(file, "utf8").split("\n");
    const name = sub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const end = "(?![\\w-])";
    const def = new RegExp(`^\\s*(function\\s+${name}${end}|${name}\\s*\\(\\)|["']?${name}["']?${end}(\\s*\\|[^)]*)?\\))`);
    const at = lines.findIndex((l) => def.test(l));
    return at >= 0 ? ok(span, `${shellScript}:${at + 1} ${lines[at]?.trim()}`) : stale(span, `${shellScript} defines no "${sub}" subcommand`);
  }
  if (bin === "make") {
    const target = args[0];
    const makefile = join(ctx.root, "Makefile");
    if (!existsSync(makefile)) return stale(span, "no Makefile");
    if (!target) return ok(span, "Makefile exists");
    const lines = readFileSync(makefile, "utf8").split("\n");
    const at = lines.findIndex((l) => l.startsWith(`${target}:`));
    return at >= 0 ? ok(span, `Makefile:${at + 1}`) : stale(span, `Makefile has no "${target}" target`);
  }
  if (bin === "node" && args[0]) return checkPath(ctx, { kind: "path", text: args[0] });
  return skipped(span, `external command \`${bin}\``);
}
function gitGrep(ctx, args) {
  const res = spawnSync("git", ["grep", "-I", "--untracked", "-F", ...args, "--", ".", ":(exclude,glob)**/*.md", ":(exclude,glob)**/*.mdx"], {
    cwd: ctx.root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024
  });
  if (res.status === 0) return { status: "match", stdout: res.stdout };
  if (res.status === 1) return { status: "miss" };
  return { status: "error", message: (res.stderr || res.error?.message || `git grep exited ${res.status}`).split("\n")[0] ?? "git grep failed" };
}
function grepFirst(ctx, needle, word) {
  const res = gitGrep(ctx, ["-n", ...word ? ["-w"] : [], "-e", needle]);
  if (res.status === "error") return { error: res.message };
  if (res.status === "miss") return { miss: true };
  const first = res.stdout.split("\n").find(Boolean) ?? "";
  const [file, line, ...rest] = first.split(":");
  return { hit: `${file}:${line} ${rest.join(":").trim().slice(0, 80)}` };
}
function fileNamesWith(ctx, needle) {
  return repoFiles(ctx).filter((f) => f.split("/").pop()?.includes(needle));
}
function checkSymbol(ctx, span) {
  if (!ctx.isGit) return skipped(span, "identifier lookups need a git repository");
  const call = span.text.endsWith("()");
  const name = call ? span.text.slice(0, -2) : span.text;
  const needles = [call ? `${name}(` : name];
  const last = name.split(".").pop() ?? name;
  if (name.includes(".") && last.length >= 5) needles.push(call ? `${last}(` : last);
  for (const needle of needles) {
    const res = grepFirst(ctx, needle, !call && !needle.includes("."));
    if ("error" in res) return skipped(span, `lookup failed: ${res.error}`);
    if ("hit" in res) return ok(span, res.hit);
  }
  const files = fileNamesWith(ctx, name);
  if (files.length) return ok(span, `in file names: ${files.slice(0, 2).join(", ")}${files.length > 2 ? ` and ${files.length - 2} more` : ""}`);
  return unconfirmed(span, `"${needles[0]}" appears in no code file or file name`);
}
function checkEnv(ctx, span) {
  if (!ctx.isGit) return skipped(span, "lookups need a git repository");
  const [key, value] = span.text.split("=");
  if (!key || !value) return skipped(span, "not an assignment");
  const res = gitGrep(ctx, ["-l", "-w", "-e", key]);
  if (res.status === "error") return skipped(span, `lookup failed: ${res.message}`);
  if (res.status === "miss") return unconfirmed(span, `${key} appears in no code file`);
  const files = res.stdout.split("\n").filter(Boolean);
  const withValue = files.find((f) => readFileSync(join(ctx.root, f), "utf8").includes(value));
  return withValue ? ok(span, `${key} and "${value}" in ${withValue}`) : unconfirmed(span, `${key} is used in ${files.slice(0, 2).join(", ")} but "${value}" never appears with it`);
}
var PACKAGES = {
  "next.js": "next",
  react: "react",
  mui: "@mui/material",
  "material ui": "@mui/material",
  typescript: "typescript",
  express: "express",
  "express.js": "express",
  recoil: "recoil",
  bullmq: "bullmq",
  knex: "knex",
  sequelize: "sequelize",
  cypress: "cypress",
  jest: "jest",
  vitest: "vitest",
  vite: "vite",
  vue: "vue",
  tailwind: "tailwindcss",
  tailwindcss: "tailwindcss",
  prisma: "prisma",
  playwright: "@playwright/test",
  eslint: "eslint"
};
var IMAGES = {
  postgresql: /image:\s*["']?(?:[\w.-]+\/)?(?:postgres|postgis|postgresql)[\w/-]*:(\d+)/gi,
  postgres: /image:\s*["']?(?:[\w.-]+\/)?(?:postgres|postgis|postgresql)[\w/-]*:(\d+)/gi,
  redis: /image:\s*["']?(?:[\w.-]+\/)?(?:redis|valkey)[\w/-]*:(\d+)/gi
};
function majorOf(range) {
  const m = range.match(/(\d+)/);
  return m ? Number(m[1]) : null;
}
function composeFiles(ctx) {
  return globSync(["*compose*.y*ml", "*/*compose*.y*ml", "**/Dockerfile*"], { cwd: ctx.root, exclude: skipIgnored });
}
function checkVersion(ctx, span) {
  const m = span.text.match(/^(.+?)\s+v?(\d+)(\+)?$/);
  if (!m) return skipped(span, "not a version");
  const tech = (m[1] ?? "").toLowerCase();
  const claimed = Number(m[2]);
  const atLeast = Boolean(m[3]);
  if (tech === "node" || tech === "node.js") {
    const engines = ctx.packages.filter((p) => p.engines.node).map((p) => ({ where: `${p.file} engines.node "${p.engines.node}"`, major: majorOf(p.engines.node ?? "") }));
    const docker = composeFiles(ctx).flatMap(
      (f) => [...readFileSync(join(ctx.root, f), "utf8").matchAll(/FROM\s+(?:[\w.-]+\/)?node:(\d+)/gi)].map((x) => ({ where: `${f} FROM node:${x[1]}`, major: Number(x[1]) }))
    );
    const nvm = [".nvmrc", ".node-version"].filter((f) => existsSync(join(ctx.root, f))).map((f) => {
      const v = readFileSync(join(ctx.root, f), "utf8").trim();
      return { where: `${f} ${v}`, major: majorOf(v) };
    });
    const found = [...engines, ...nvm, ...docker].filter((x) => x.major !== null);
    if (!found.length) return unconfirmed(span, "no engines.node, .nvmrc or node Docker image to compare with");
    const floors = [...engines, ...nvm].filter((x) => x.major !== null);
    const required = Math.max(...(floors.length ? floors : found).map((x) => x.major ?? 0));
    const list = found.map((x) => x.where).join("; ");
    if (atLeast) {
      if (required === claimed) return ok(span, list);
      const needs = floors.filter((x) => x.major === required).map((x) => x.where).join("; ");
      return stale(span, `the repository requires Node ${required}: ${needs || list}`);
    }
    return found.some((x) => x.major === claimed) ? ok(span, list) : stale(span, `repository uses ${list}`);
  }
  const image = IMAGES[tech];
  if (image) {
    const found = composeFiles(ctx).flatMap((f) => [...readFileSync(join(ctx.root, f), "utf8").matchAll(image)].map((x) => ({ where: `${f} ${x[0].replace(/^image:\s*/i, "")}`, major: Number(x[1]) })));
    if (!found.length) return unconfirmed(span, `no ${tech} image in compose or Dockerfiles`);
    const match = found.filter((x) => atLeast ? x.major >= claimed : x.major === claimed);
    return match.length === found.length ? ok(span, found.map((x) => x.where).join("; ")) : stale(span, `images: ${found.map((x) => x.where).join("; ")}`);
  }
  const pkg = PACKAGES[tech];
  if (!pkg) return skipped(span, `no rule for ${m[1]}`);
  const users = ctx.packages.filter((p) => p.deps[pkg]).map((p) => ({ where: `${p.file} ${pkg} "${p.deps[pkg]}"`, major: majorOf(p.deps[pkg] ?? "") }));
  if (!users.length) return unconfirmed(span, `no package.json depends on ${pkg}`);
  const bad = users.filter((u) => u.major !== null && (atLeast ? u.major < claimed : u.major !== claimed));
  return bad.length ? stale(span, bad.map((u) => u.where).join("; ")) : ok(span, users.map((u) => u.where).join("; "));
}
function checkSpan(ctx, span) {
  switch (span.kind) {
    case "path":
    case "link":
      return checkPath(ctx, span);
    case "command":
      return checkCommand(ctx, span);
    case "symbol":
      return checkSymbol(ctx, span);
    case "env":
      return checkEnv(ctx, span);
    case "version":
      return checkVersion(ctx, span);
  }
}

// src/git.ts
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync as existsSync2, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join as join2 } from "node:path";
var PROOF_DIR = ".proof";
var git = (cwd, args, env) => execFileSync("git", args, { cwd, env: env ?? process.env, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
function repoRoot(cwd) {
  try {
    return git(cwd, ["rev-parse", "--show-toplevel"]);
  } catch {
    return null;
  }
}
function workingTreeHash(root) {
  const gitDir = git(root, ["rev-parse", "--absolute-git-dir"]);
  const tmp = mkdtempSync(join2(tmpdir(), "proof-index-"));
  const index = join2(tmp, "index");
  try {
    const realIndex = join2(gitDir, "index");
    if (existsSync2(realIndex)) copyFileSync(realIndex, index);
    const env = { ...process.env, GIT_INDEX_FILE: index };
    git(root, ["add", "--all", "--", "."], env);
    git(root, ["rm", "-r", "--cached", "--quiet", "--ignore-unmatch", "--", PROOF_DIR], env);
    return git(root, ["write-tree"], env);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}
function headCommit(root) {
  try {
    return git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]);
  } catch {
    return null;
  }
}
function branchInfo(root) {
  const safe = (args) => {
    try {
      return git(root, args) || null;
    } catch {
      return null;
    }
  };
  const branch = safe(["rev-parse", "--abbrev-ref", "HEAD"]);
  const upstream = safe(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{upstream}"]) ?? safe(["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  const behind = upstream ? Number(safe(["rev-list", "--count", `HEAD..${upstream}`]) ?? "NaN") : Number.NaN;
  return { branch: branch === "HEAD" ? null : branch, upstream, behind: Number.isFinite(behind) ? behind : null };
}
function gitState(cwd) {
  const root = repoRoot(cwd);
  if (!root) return null;
  return { root, tree: workingTreeHash(root), head: headCommit(root) };
}

// src/parse.ts
var SHELL_LANGS = /* @__PURE__ */ new Set(["", "bash", "sh", "shell", "zsh", "console", "terminal"]);
var SCRIPT_LANGS = /* @__PURE__ */ new Set(["ts", "tsx", "typescript", "js", "jsx", "javascript", "mjs"]);
var RUNNERS = /^(yarn|npm|pnpm|bun|bash|sh|make|node|\.\/[\w.-]+\.sh)\b/;
var FILE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|md|mdx|ya?ml|sh|toml|sql|env|example|mjml|css|scss|lock|txt|py|go|rs|html)$/i;
var STOP = /* @__PURE__ */ new Set([
  "true",
  "false",
  "null",
  "undefined",
  "void",
  "any",
  "unknown",
  "never",
  "string",
  "number",
  "boolean",
  "object",
  "button",
  "main",
  "master",
  "origin",
  "test",
  "build",
  "dev",
  "yarn",
  "npm",
  "node",
  "docker",
  "git",
  "async",
  "await"
]);
var VERSION_RE = /\b(Node(?:\.js)?|Next\.js|React|MUI|Material UI|PostgreSQL|Postgres|Redis|TypeScript|Express(?:\.js)?|Recoil|BullMQ|Knex|Sequelize|Cypress|Jest|Vitest|Vite|Vue|Tailwind(?:CSS)?|Prisma|Playwright|ESLint)\s+v?(\d+)(\+)?/g;
var BARE_EXTENSION = /^\.(ts|tsx|js|jsx|mjs|cjs|json|md|mdx|ya?ml|sh|css|scss|html|py|go|rs|sql|txt|png|svg|jpg)$/i;
function isPathLike(t) {
  if (/\s/.test(t) || /^[a-z]+:\/\//i.test(t) || t.startsWith("@") || BARE_EXTENSION.test(t)) return false;
  if (!t.includes("/") && /^[A-Za-z_$][\w$]*\.env$/.test(t)) return false;
  if (t.includes("/")) return /^[\w.~<>[\]{}|*()-]+(\/[\w.~<>[\]{}|*()-]*)*\/?$/.test(t) || t.startsWith("/");
  return FILE_EXT.test(t) || /^\.[\w.-]+$/.test(t);
}
function classifyCode(code) {
  const t = code.trim().replace(/^\$\s+/, "");
  if (!t) return null;
  if (/\s/.test(t)) return RUNNERS.test(t) ? { kind: "command", text: t } : null;
  if (/^[A-Z][A-Z0-9_]*=\S+$/.test(t)) return { kind: "env", text: t };
  if (isPathLike(t)) return { kind: "path", text: t };
  if (t.length < 4 || STOP.has(t.toLowerCase())) return null;
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*(\(\))?$/.test(t)) return { kind: "symbol", text: t };
  return null;
}
function pathArgs(command) {
  return command.split(/\s+/).slice(1).map((tok) => tok.replace(/^["']|["']$/g, "")).filter((tok) => tok.includes("/") && !tok.startsWith("-") && !tok.startsWith("/") && !tok.startsWith("~") && isPathLike(tok)).map((tok) => ({ kind: "path", text: tok }));
}
function spansOf(text) {
  const spans = [];
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const code = (m[1] ?? "").replace(/<([^<>]*)>/g, (_, inner) => `<${inner.trim().replace(/\s+/g, "-")}>`);
    const s = classifyCode(code);
    if (s) spans.push(s, ...s.kind === "command" ? pathArgs(s.text) : []);
    else if (/\s/.test(code.trim())) spans.push(...pathArgs(code.trim()));
  }
  for (const m of text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
    const target = (m[1] ?? "").split("#")[0] ?? "";
    if (target && !/^[a-z]+:/i.test(target)) spans.push({ kind: "link", text: target });
  }
  const prose = text.replace(/`[^`]*`/g, " ").replace(/"[^"]*"|“[^”]*”/g, " ");
  for (const m of prose.matchAll(VERSION_RE)) spans.push({ kind: "version", text: m[0] });
  return spans;
}
var splitSentences = (text) => text.split(/(?<=[.!?])\s+(?=[A-Z`*"(])/).map((s) => s.trim()).filter(Boolean);
function stripComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "#" && (i === 0 || /\s/.test(line[i - 1] ?? ""))) return line.slice(0, i).trimEnd();
  }
  return line.trimEnd();
}
function parseStatements(markdown) {
  const lines = markdown.split(/\r?\n/);
  const out = [];
  let section = "";
  let fence = null;
  let para = null;
  let item = null;
  const emit = (line, text) => {
    const t = text.trim();
    if (!t || /:\**$/.test(t)) return;
    out.push({ line, section, text: t, source: "prose", spans: spansOf(t) });
  };
  const flushPara = () => {
    if (!para) return;
    const whole = para.text.trim();
    const sentences = /^\*\*[^*]+\*\*$/.test(whole) ? [whole.slice(2, -2)] : splitSentences(whole);
    for (const sentence of sentences) emit(para.line, sentence);
    para = null;
  };
  const flushItem = () => {
    if (!item) return;
    emit(item.line, item.text);
    item = null;
  };
  const flush = () => {
    flushPara();
    flushItem();
  };
  let ignoring = false;
  let ignoreNext = false;
  const ignoredLines = /* @__PURE__ */ new Set();
  lines.forEach((raw, i) => {
    const n = i + 1;
    if (/<!--\s*proof:ignore-start\s*-->/.test(raw)) {
      flush();
      ignoring = true;
      return;
    }
    if (/<!--\s*proof:ignore-end\s*-->/.test(raw)) {
      ignoring = false;
      return;
    }
    if (ignoring) return;
    if (/<!--\s*proof:ignore\s*-->/.test(raw)) {
      flush();
      ignoreNext = true;
      return;
    }
    if (ignoreNext && raw.trim()) {
      ignoredLines.add(n);
      ignoreNext = false;
    }
    const fenceMatch = raw.match(/^\s*(```|~~~)\s*([\w+-]*)/);
    if (fenceMatch) {
      flush();
      fence = fence ? null : { lang: (fenceMatch[2] ?? "").toLowerCase() };
      return;
    }
    if (fence) {
      const code = raw.trim();
      if (SHELL_LANGS.has(fence.lang)) {
        const cmd = stripComment(code.replace(/^\$\s+/, ""));
        const isCommand = fence.lang !== "" || RUNNERS.test(cmd);
        if (cmd && !cmd.startsWith("#") && isCommand) {
          out.push({ line: n, section, text: cmd, source: "code", spans: [{ kind: "command", text: cmd }, ...pathArgs(cmd)] });
        }
      } else if (SCRIPT_LANGS.has(fence.lang)) {
        const m = code.match(/^\/\/\s*(\S+\.(?:ts|tsx|js|jsx|mjs|cjs))\s*$/);
        if (m?.[1]) out.push({ line: n, section, text: code, source: "code", spans: [{ kind: "path", text: m[1] }] });
      }
      return;
    }
    const heading = raw.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      section = (heading[1] ?? "").trim();
      return;
    }
    if (!raw.trim() || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) {
      flush();
      return;
    }
    if (/^\s*\|/.test(raw)) {
      flush();
      const next = lines[i + 1] ?? "";
      if (/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(raw) || /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(next)) return;
      const cells = raw.split("|").map((c) => c.trim()).filter(Boolean).join(" \xB7 ");
      out.push({ line: n, section, text: cells, source: "prose", spans: spansOf(raw) });
      return;
    }
    const listItem = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      flush();
      item = { line: n, text: listItem[1] ?? "" };
      return;
    }
    const text = raw.replace(/^\s*>\s?/, "").trim();
    if (item && /^\s+\S/.test(raw)) item.text += ` ${text}`;
    else {
      flushItem();
      if (para) para.text += ` ${text}`;
      else para = { line: n, text };
    }
  });
  flush();
  return out.filter((st) => !ignoredLines.has(st.line));
}

// src/version.ts
var VERSION = "0.1.0";

// src/report.ts
function statusOf(results) {
  const checked = results.filter((r) => r.status !== "SKIPPED");
  if (checked.some((r) => r.status === "STALE")) return "STALE";
  if (!checked.length) return results.length ? "SKIPPED" : "UNCHECKED";
  if (checked.some((r) => r.status === "UNCONFIRMED")) return "UNCONFIRMED";
  return "VERIFIED";
}
function verdictOf(statements) {
  if (statements.some((s) => s.status === "STALE")) return "NOT PROVEN";
  if (statements.some((s) => s.status === "UNCONFIRMED" || s.status === "UNCHECKED")) return "PARTLY PROVEN";
  return statements.some((s) => s.status === "VERIFIED") ? "PROVEN" : "PARTLY PROVEN";
}
function proveFile(file, cwd) {
  const state = gitState(cwd);
  const root = state?.root ?? resolve(cwd);
  const abs = resolve(cwd, file);
  const rel = relative2(root, abs) || file;
  const git2 = state ? { ...state, ...branchInfo(root) } : null;
  const counts = { STALE: 0, UNCONFIRMED: 0, UNCHECKED: 0, VERIFIED: 0, SKIPPED: 0 };
  const base = { file: rel, counts, git: git2, createdAt: (/* @__PURE__ */ new Date()).toISOString(), version: VERSION };
  if (!existsSync3(abs)) return { ...base, verdict: "UNTESTED", reason: `${rel} does not exist`, statements: [] };
  const ctx = createContext(root, rel);
  const statements = parseStatements(readFileSync2(abs, "utf8")).map((s) => {
    const results = s.spans.map((span) => checkSpan(ctx, span));
    return { ...s, results, status: statusOf(results) };
  });
  for (const s of statements) counts[s.status] += 1;
  return { ...base, verdict: verdictOf(statements), statements };
}
function discover(cwd) {
  const res = spawnSync2("git", ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*CLAUDE.md", "*AGENTS.md"], { cwd, encoding: "utf8" });
  const found = res.status === 0 ? res.stdout.split("\n").filter(Boolean) : ["CLAUDE.md", "AGENTS.md"].filter((f) => existsSync3(resolve(cwd, f)));
  const sorted = [...new Set(found)].sort((a, b) => a.split("/").length - b.split("/").length || a.localeCompare(b));
  const seen = /* @__PURE__ */ new Set();
  return sorted.filter((f) => {
    const real = existsSync3(resolve(cwd, f)) ? realpathSync(resolve(cwd, f)) : f;
    if (seen.has(real)) return false;
    seen.add(real);
    return true;
  });
}
var clip = (t, n = 160) => t.length > n ? `${t.slice(0, n - 1)}\u2026` : t;
var MARK = { VERIFIED: "\u2713", STALE: "\u2717", UNCONFIRMED: "?", SKIPPED: "\xB7" };
function toMarkdown(r) {
  const c = r.counts;
  const lines = [`# ${r.file}: ${r.verdict}`, ""];
  if (r.reason) return `${[...lines, r.reason].join("\n")}
`;
  lines.push(`${c.STALE} stale \xB7 ${c.UNCONFIRMED} unconfirmed \xB7 ${c.UNCHECKED} need judgment \xB7 ${c.VERIFIED} verified \xB7 ${c.SKIPPED} not checked`, "");
  if (r.git) {
    lines.push(`branch \`${r.git.branch ?? "detached"}\` \xB7 head \`${r.git.head?.slice(0, 12) ?? "none"}\` \xB7 tree \`${r.git.tree.slice(0, 12)}\` \xB7 ${r.createdAt} \xB7 proof ${r.version}`, "");
    if (r.git.behind) lines.push(`> **This checkout is ${r.git.behind} commits behind ${r.git.upstream}.** The file and the code were read as they are here; check the branch people actually work on.`, "");
  }
  const block = (title, hint, status, withEvidence) => {
    const rows = r.statements.filter((s) => s.status === status);
    if (!rows.length) return;
    lines.push(`## ${title} (${rows.length})`, "", hint, "");
    for (const s of rows) {
      lines.push(`- **L${s.line}** ${clip(s.text)}${s.section ? ` _(${s.section})_` : ""}`);
      if (!withEvidence) continue;
      for (const x of s.results.filter((y) => status === "SKIPPED" || y.status !== "SKIPPED")) lines.push(`  - ${MARK[x.status] ?? "?"} \`${x.text}\` \u2014 ${x.evidence}`);
    }
    lines.push("");
  };
  block("Stale", "The repository contradicts these. Fix the line or the code.", "STALE", true);
  block("Unconfirmed", "Nothing contradicts these, but part of each has no evidence in code.", "UNCONFIRMED", true);
  block("Needs judgment", "Nothing here can be checked mechanically. Sort each into a rule (keep) or a fact (prove it with file:line).", "UNCHECKED", false);
  block("Verified", "The names in these exist. Re-read any that state status, counts or purpose.", "VERIFIED", true);
  block("Not checked", "Outside the repository: system files and external tools.", "SKIPPED", true);
  return `${lines.join("\n").trimEnd()}
`;
}

// src/cli.ts
var HELP = `proof ${VERSION}: is your CLAUDE.md still true?

Usage: node claims.mjs [file...] [--json] [--out <dir>]

Checks every statement in CLAUDE.md / AGENTS.md against the repository and prints a
markdown report. With no files, checks every CLAUDE.md and AGENTS.md git knows about.

  --json        Print JSON instead of markdown
  --out <dir>   Also write <name>.md and <name>.json reports into <dir>

Exit codes: 0 PROVEN or PARTLY PROVEN, 1 NOT PROVEN (something is stale), 2 a file is missing or usage error.`;
var EXIT = { PROVEN: 0, "PARTLY PROVEN": 0, "NOT PROVEN": 1, UNTESTED: 2 };
function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: { json: { type: "boolean" }, out: { type: "string" }, help: { type: "boolean", short: "h" }, version: { type: "boolean", short: "v" } }
  });
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values.version) {
    console.log(VERSION);
    return 0;
  }
  const cwd = process.cwd();
  const files = positionals.length ? positionals : discover(cwd);
  if (!files.length) {
    console.error("No CLAUDE.md or AGENTS.md found. Pass a file: node claims.mjs path/to/CLAUDE.md");
    return 2;
  }
  const reports = files.map((f) => proveFile(f, cwd));
  if (values.out) {
    mkdirSync(values.out, { recursive: true });
    for (const r of reports) {
      const name = r.file.replace(/[^a-z0-9._-]+/gi, "-").toLowerCase();
      writeFileSync(join3(values.out, `${name}.md`), toMarkdown(r));
      writeFileSync(join3(values.out, `${name}.json`), `${JSON.stringify(r, null, 2)}
`);
    }
  }
  if (values.json) console.log(JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  else console.log(reports.map(toMarkdown).join("\n---\n\n"));
  return Math.max(...reports.map((r) => EXIT[r.verdict]));
}
try {
  process.exitCode = main(process.argv.slice(2));
} catch (err) {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 2;
}
