/** A piece of a statement that can be checked against the repository. */
export type SpanKind = 'path' | 'command' | 'symbol' | 'env' | 'version' | 'link';

export interface Span {
  kind: SpanKind;
  text: string;
}

/** One claim an instruction file makes: a list item, a table row, a sentence or a command line. */
export interface Statement {
  /** 1-based line where the statement starts. */
  line: number;
  /** Nearest heading above the statement. */
  section: string;
  text: string;
  source: 'prose' | 'code';
  spans: Span[];
}

const SHELL_LANGS = new Set(['', 'bash', 'sh', 'shell', 'zsh', 'console', 'terminal']);
const SCRIPT_LANGS = new Set(['ts', 'tsx', 'typescript', 'js', 'jsx', 'javascript', 'mjs']);
const RUNNERS = /^(yarn|npm|pnpm|bun|bash|sh|make|node|\.\/[\w.-]+\.sh)\b/;
const FILE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|jsonc|md|mdx|ya?ml|sh|toml|sql|env|example|mjml|css|scss|lock|txt|py|go|rs|html)$/i;
/** Code-formatted words that are vocabulary, not identifiers to look up. */
const STOP = new Set([
  'true', 'false', 'null', 'undefined', 'void', 'any', 'unknown', 'never', 'string', 'number', 'boolean', 'object',
  'button', 'main', 'master', 'origin', 'test', 'build', 'dev', 'yarn', 'npm', 'node', 'docker', 'git', 'async', 'await',
]);
const VERSION_RE =
  /\b(Node(?:\.js)?|Next\.js|React|MUI|Material UI|PostgreSQL|Postgres|Redis|TypeScript|Express(?:\.js)?|Recoil|BullMQ|Knex|Sequelize|Cypress|Jest|Vitest|Vite|Vue|Tailwind(?:CSS)?|Prisma|Playwright|ESLint)\s+v?(\d+)(\+)?/g;

/** `.ts`, `.md`: a file type mentioned in prose, not a file. */
const BARE_EXTENSION = /^\.(ts|tsx|js|jsx|mjs|cjs|json|md|mdx|ya?ml|sh|css|scss|html|py|go|rs|sql|txt|png|svg|jpg)$/i;

export function isPathLike(t: string): boolean {
  if (/\s/.test(t) || /^[a-z]+:\/\//i.test(t) || t.startsWith('@') || BARE_EXTENSION.test(t)) return false;
  // `process.env` is a member expression; env files start with a dot (`.env`, `backend/.env.local`).
  if (!t.includes('/') && /^[A-Za-z_$][\w$]*\.env$/.test(t)) return false;
  if (t.includes('/')) return /^[\w.~<>[\]{}|*()-]+(\/[\w.~<>[\]{}|*()-]*)*\/?$/.test(t) || t.startsWith('/');
  return FILE_EXT.test(t) || /^\.[\w.-]+$/.test(t);
}

/** Classify an inline `code` span, or return null when it is not something to check. */
export function classifyCode(code: string): Span | null {
  const t = code.trim().replace(/^\$\s+/, '');
  if (!t) return null;
  if (/\s/.test(t)) return RUNNERS.test(t) ? { kind: 'command', text: t } : null;
  if (/^[A-Z][A-Z0-9_]*=\S+$/.test(t)) return { kind: 'env', text: t };
  if (isPathLike(t)) return { kind: 'path', text: t };
  if (t.length < 4 || STOP.has(t.toLowerCase())) return null;
  if (/^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)*(\(\))?$/.test(t)) return { kind: 'symbol', text: t };
  return null;
}

/** Repository paths mentioned as arguments of a command line (`sops backend/secrets/x`). */
function pathArgs(command: string): Span[] {
  return command
    .split(/\s+/)
    .slice(1)
    .map((tok) => tok.replace(/^["']|["']$/g, ''))
    .filter((tok) => tok.includes('/') && !tok.startsWith('-') && !tok.startsWith('/') && !tok.startsWith('~') && isPathLike(tok))
    .map((tok) => ({ kind: 'path' as const, text: tok }));
}

export function spansOf(text: string): Span[] {
  const spans: Span[] = [];
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    // `<working-tree hash>` is one placeholder; keep its words together.
    const code = (m[1] ?? '').replace(/<([^<>]*)>/g, (_, inner: string) => `<${inner.trim().replace(/\s+/g, '-')}>`);
    const s = classifyCode(code);
    if (s) spans.push(s, ...(s.kind === 'command' ? pathArgs(s.text) : []));
    // `sops backend/secrets/x`: the tool is external, but the path it names is a claim.
    else if (/\s/.test(code.trim())) spans.push(...pathArgs(code.trim()));
  }
  for (const m of text.matchAll(/\[[^\]]+\]\(([^)\s]+)\)/g)) {
    const target = (m[1] ?? '').split('#')[0] ?? '';
    if (target && !/^[a-z]+:/i.test(target)) spans.push({ kind: 'link', text: target });
  }
  // A version in quotes is being mentioned ("Node 24+" is stale when…), not claimed.
  const prose = text.replace(/`[^`]*`/g, ' ').replace(/"[^"]*"|“[^”]*”/g, ' ');
  for (const m of prose.matchAll(VERSION_RE)) spans.push({ kind: 'version', text: m[0] });
  return spans;
}

const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=[.!?])\s+(?=[A-Z`*"(])/)
    .map((s) => s.trim())
    .filter(Boolean);

/** Strip a trailing shell comment (`cmd   # explains cmd`) outside quotes. */
function stripComment(line: string): string {
  let quote: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === '#' && (i === 0 || /\s/.test(line[i - 1] ?? ''))) return line.slice(0, i).trimEnd();
  }
  return line.trimEnd();
}

/** Split a markdown instruction file into statements with the spans each one claims. */
export function parseStatements(markdown: string): Statement[] {
  const lines = markdown.split(/\r?\n/);
  const out: Statement[] = [];
  let section = '';
  let fence: { lang: string } | null = null;
  let para: { line: number; text: string } | null = null;
  let item: { line: number; text: string } | null = null;

  const emit = (line: number, text: string) => {
    const t = text.trim();
    // "When editing existing code:" introduces the list below it; it claims nothing itself.
    if (!t || /:\**$/.test(t)) return;
    out.push({ line, section, text: t, source: 'prose', spans: spansOf(t) });
  };
  const flushPara = () => {
    if (!para) return;
    const whole = para.text.trim();
    // A fully bold paragraph is one tagline, not several sentences.
    const sentences = /^\*\*[^*]+\*\*$/.test(whole) ? [whole.slice(2, -2)] : splitSentences(whole);
    // Sentences of one paragraph share its first line, which is enough to find them.
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

  // <!-- proof:ignore --> skips the next statement; proof:ignore-start / -end skip a block,
  // for example tables that quote claims as illustrations.
  let ignoring = false;
  let ignoreNext = false;
  const ignoredLines = new Set<number>();

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
      fence = fence ? null : { lang: (fenceMatch[2] ?? '').toLowerCase() };
      return;
    }
    if (fence) {
      const code = raw.trim();
      if (SHELL_LANGS.has(fence.lang)) {
        const cmd = stripComment(code.replace(/^\$\s+/, ''));
        // An unlabelled fence may hold a template or plain text; only lines that run a tool are claims.
        const isCommand = fence.lang !== '' || RUNNERS.test(cmd);
        if (cmd && !cmd.startsWith('#') && isCommand) {
          out.push({ line: n, section, text: cmd, source: 'code', spans: [{ kind: 'command' as const, text: cmd }, ...pathArgs(cmd)] });
        }
      } else if (SCRIPT_LANGS.has(fence.lang)) {
        // Example code is illustrative; only a file-path comment on its own line is a claim.
        const m = code.match(/^\/\/\s*(\S+\.(?:ts|tsx|js|jsx|mjs|cjs))\s*$/);
        if (m?.[1]) out.push({ line: n, section, text: code, source: 'code', spans: [{ kind: 'path', text: m[1] }] });
      }
      return;
    }
    const heading = raw.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      flush();
      section = (heading[1] ?? '').trim();
      return;
    }
    if (!raw.trim() || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(raw)) {
      flush();
      return;
    }
    if (/^\s*\|/.test(raw)) {
      flush();
      const next = lines[i + 1] ?? '';
      if (/^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(raw) || /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(next)) return; // separator or header row
      const cells = raw.split('|').map((c) => c.trim()).filter(Boolean).join(' · ');
      out.push({ line: n, section, text: cells, source: 'prose', spans: spansOf(raw) });
      return;
    }
    const listItem = raw.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (listItem) {
      flush();
      item = { line: n, text: listItem[1] ?? '' };
      return;
    }
    const text = raw.replace(/^\s*>\s?/, '').trim();
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
