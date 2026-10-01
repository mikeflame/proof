import { createHash } from 'node:crypto';
import type { Code, Heading, List, ListItem, Nodes, Paragraph, PhrasingContent, Root, RootContent, Table, TableRow } from 'mdast';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter';
import { gfmFromMarkdown } from 'mdast-util-gfm';
import { frontmatter } from 'micromark-extension-frontmatter';
import { gfm } from 'micromark-extension-gfm';
import { parse as parseYaml } from 'yaml';
import type { Override, Span, Statement, StatementKind } from '../model.ts';
import { classifyCode, commandSpans, dependencySpans, KNOWN_TOOLS, versionSpans } from './classify.ts';

const SHELL_LANGS = new Set(['bash', 'sh', 'shell', 'zsh', 'console', 'terminal', 'shell-session', 'shellsession', 'fish', 'ps1', 'powershell']);
const SCRIPT_LANGS = new Set(['ts', 'tsx', 'typescript', 'js', 'jsx', 'javascript', 'mjs', 'cjs', 'go', 'py', 'python', 'rust', 'rs']);

export interface ImportRef {
  /** The path as written after `@`, unescaped. */
  path: string;
  line: number;
}

export interface ParsedDocument {
  statements: Statement[];
  imports: ImportRef[];
  /** `paths:` globs of a rule file, when its frontmatter has them. */
  paths: string[] | null;
  /** YAML frontmatter that did not parse: rules with broken frontmatter load unconditionally. */
  frontmatterError: string | null;
}

/** Whitespace collapsed and emphasis markers dropped, so reformatting a line keeps its decisions. */
export function normalizeText(text: string): string {
  return text
    .replace(/(\*\*|__|~~)/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.;:]+$/, '');
}

export const statementId = (text: string): string => createHash('sha1').update(normalizeText(text)).digest('hex');

/** Inline content rendered back to markdown-ish text: code in backticks, links as [text](url), emphasis dropped. */
function renderInline(nodes: PhrasingContent[]): string {
  return nodes
    .map((n): string => {
      switch (n.type) {
        case 'text':
          return n.value;
        case 'inlineCode':
          return `\`${n.value}\``;
        case 'emphasis':
        case 'strong':
        case 'delete':
          return renderInline(n.children);
        case 'link':
          return `[${renderInline(n.children)}](${n.url})`;
        case 'break':
          return ' ';
        default:
          return 'children' in n ? renderInline((n as { children: PhrasingContent[] }).children) : '';
      }
    })
    .join('');
}

/** Rendered text with inline code and link targets removed: where imports and prose claims live. */
export function proseOfText(text: string): string {
  return text.replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']').replace(/[[\]]/g, ' ');
}

const safeDecode = (s: string): string => {
  try {
    return decodeURI(s);
  } catch {
    return s;
  }
};

const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });

/** A line of an unlabelled fence that runs a known tool, a script path or an env-prefixed command. */
function runsSomething(line: string): boolean {
  const words = line.split(/\s+/).filter((w) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(w) && w !== 'sudo');
  const first = words[0] ?? '';
  return KNOWN_TOOLS.has(first) || /^\.{0,2}\/[\w./-]+$/.test(first);
}

/**
 * Sentences by the platform segmenter, with code spans and link targets protected from splitting, and
 * the line offset of each within `text`. Soft line breaks are spaces: the segmenter would end a sentence there.
 */
export function sentenceParts(text: string): { text: string; line: number }[] {
  const kept: string[] = [];
  // Same-length placeholders keep offsets, so each sentence maps back to its source line.
  const protectedText = text.replace(/`[^`]*`|\]\([^)]*\)/g, (m) => {
    kept.push(m);
    const tag = `\u0001${kept.length - 1}\u0001`;
    return tag.padEnd(m.length, '\u0002');
  });
  const restore = (s: string) => s.replace(/\u0001(\d+)\u0001\u0002*/g, (_, i: string) => kept[Number(i)] ?? '');
  const out: { text: string; line: number }[] = [];
  for (const seg of segmenter.segment(protectedText.replace(/\n/g, ' '))) {
    const t = restore(seg.segment).trim();
    if (t) out.push({ text: t, line: (text.slice(0, seg.index + (seg.segment.length - seg.segment.trimStart().length)).match(/\n/g) ?? []).length });
  }
  return out;
}

export const sentences = (text: string): string[] => sentenceParts(text).map((s) => s.text);

/** `@path` imports in prose: not in code, not quoted, not an e-mail, backslash-escaped spaces allowed. */
export function importsIn(prose: string): string[] {
  const out: string[] = [];
  for (const m of prose.matchAll(/(?:^|[\s(])@((?:\\ |[^\s,;)"'])+)/g)) {
    const raw = (m[1] ?? '').replace(/\\ /g, ' ').replace(/[.:]+$/, '');
    if (raw && /[\w~/.]/.test(raw[0] ?? '')) out.push(raw);
  }
  return out;
}

const NEGATION =
  /\b(?:was|were|has been|have been|got|is now|are now|been)\s+(?:deleted|removed|retired|dropped|renamed|replaced|moved)\b|\bno longer (?:exists?|used|present|needed|available|in use|supported)\b|\b(?:is|are) not a (?:project )?dependency\b|\bdoes not exist\b|\bwere?n't kept\b/i;
const NEGATION_ALL = new RegExp(NEGATION.source, 'gi');
const REDIRECT = /\b(?:renamed|moved|replaced|migrated)\s+(?:to|with|by|into)\s+$/i;

/** Clause boundaries outside code spans: sentence ends, semicolons, colons, dashes and parentheses. */
function clauses(text: string): { start: number; end: number }[] {
  const out: { start: number; end: number }[] = [];
  let start = 0;
  let inCode = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '`') inCode = !inCode;
    if (inCode) continue;
    // Parentheses stay inside: "No `x` (it is not a dependency)" negates the name before them.
    const boundary = c === ';' || c === '—' || ((c === '.' || c === ':' || c === '!' || c === '?') && /\s|$/.test(text[i + 1] ?? '')) || (c === '-' && text[i - 1] === ' ' && text[i + 1] === ' ');
    if (boundary) {
      out.push({ start, end: i });
      start = i + 1;
    }
  }
  out.push({ start, end: text.length });
  return out;
}

/**
 * Mark the subjects of a removal as absence checks: the spans before "was deleted" in the same clause.
 * The new name in "renamed `a` to `b`" and names in other clauses stay present.
 */
function applyNegation(text: string, spans: Span[]): boolean {
  let negated = false;
  for (const clause of clauses(text)) {
    const part = text.slice(clause.start, clause.end);
    const m = part.match(NEGATION);
    if (!m || m.index === undefined) continue;
    negated = true;
    const verbAt = clause.start + m.index;
    for (const s of spans) {
      const at = text.indexOf(`\`${s.text}\``, clause.start);
      const pos = at >= 0 ? at : text.indexOf(s.text, clause.start);
      if (pos < clause.start || pos >= clause.end) continue;
      if (pos < verbAt && !REDIRECT.test(text.slice(clause.start, pos))) s.expect = 'absent';
    }
  }
  return negated;
}

const RULE_WORDS = /\b(?:must|never|always|don'?t|do not|avoid|prefer|should|shouldn'?t|required?|forbidden)\b/i;
const STATUS_WORDS = /\b(?:active|legacy|deprecated|canonical|preferred|primary|obsolete|experimental|in-migration|in migration|sole|single source)\b/i;
const QUANTIFIERS = /\b(?:only|every|all|none|each)\b/i;

const STOP_WORDS = new Set(
  'a an the and or but of to in on at for from with by via into onto over under inside within as is are was were be been being it its this that these those there here than then also all any each every see use using run runs running from also only just when where which who what how why if else not no yes do does did done can could should would will may might must here see e.g i.e etc via per vs see'.split(' '),
);

/** Words of a statement outside its code, links and named products: what a description claims. */
function contentWords(prose: string): string[] {
  return (prose.match(/[A-Za-z][A-Za-z'-]{2,}/g) ?? []).filter((w) => !STOP_WORDS.has(w.toLowerCase()));
}

/** What a mechanical check cannot cover: counts, status words, quantifiers, rule wording and descriptions. */
export function residualOf(text: string): string[] {
  const prose = text.replace(/`[^`]*`/g, ' ').replace(/\]\([^)]*\)/g, ']');
  const out: string[] = [];
  for (const m of prose.matchAll(/(?<![\w.:-])(\d+(?:[.,]\d+)?\+?)\s+(?!px\b|ms\b|s\b|%|kb\b|mb\b|gb\b|lines?\b|minutes?\b|seconds?\b|hours?\b|days?\b|weeks?\b|chars?\b|characters?\b)([a-z][\w-]*(?:\s[a-z][\w-]*)?)/gi)) {
    if (/^(19|20)\d\d$/.test(m[1] ?? '')) continue;
    out.push(`count "${m[1]} ${m[2]}"`);
  }
  const status = prose.match(STATUS_WORDS);
  if (status) out.push(`status "${status[0]}"`);
  const quantifier = prose.match(QUANTIFIERS);
  if (quantifier) out.push(`quantifier "${quantifier[0]}"`);
  const rule = prose.match(RULE_WORDS);
  if (rule) out.push(`rule "${rule[0]}"`);
  // Two or more content words describe something ("route aggregation"); a script cannot check a description.
  const words = contentWords(prose.replace(/\[[^\]]*\]/g, ' ').replace(/@\S+/g, ' '));
  if (words.length >= 2) out.push(`description "${words.slice(0, 6).join(' ')}${words.length > 6 ? ' …' : ''}"`);
  return out;
}

interface MarkerState {
  block: Override | null;
  next: Override | null;
  findings: Statement[];
}

const MARKER = /<!--\s*proof:(ignore(?:-start|-end)?)\b([^>]*)-->/;

function readMarker(html: string): { kind: string; reason: string | null } | null {
  const m = html.match(MARKER);
  if (!m) return null;
  const reason = (m[2] ?? '').match(/reason\s*=\s*"([^"]*)"|reason\s*=\s*'([^']*)'/);
  const text = (reason?.[1] ?? reason?.[2] ?? '').trim();
  return { kind: m[1] ?? 'ignore', reason: text || null };
}

/** The frontmatter field that scopes a rule to files: `paths` (Claude Code), `globs` (Cursor), `applyTo` (Copilot). */
export function scopeField(file: string): string {
  if (/\.mdc$/.test(file)) return 'globs';
  if (/\.instructions\.md$/.test(file)) return 'applyTo';
  return 'paths';
}

/** Split an instruction file into statements with the spans each one claims. */
export function parseDocument(source: string, file: string): ParsedDocument {
  const tree = fromMarkdown(source, {
    extensions: [gfm(), frontmatter(['yaml'])],
    mdastExtensions: [gfmFromMarkdown(), frontmatterFromMarkdown(['yaml'])],
  }) as Root;
  const statements: Statement[] = [];
  const imports: ImportRef[] = [];
  let paths: string[] | null = null;
  let frontmatterError: string | null = null;
  let section = '';
  const markers: MarkerState = { block: null, next: null, findings: [] };

  const lineOf = (n: Nodes) => n.position?.start.line ?? 0;
  const endOf = (n: Nodes) => n.position?.end.line ?? lineOf(n);

  const push = (kind: StatementKind, text: string, line: number, endLine: number, spans: Span[], negatable = true) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    // "When editing existing code:" introduces the list below it; it claims nothing itself.
    if (kind !== 'command' && kind !== 'import' && /:\**$/.test(clean) && !spans.length) return;
    const negated = negatable && applyNegation(clean, spans);
    const st: Statement = {
      id: statementId(clean),
      file,
      line,
      endLine,
      section,
      kind,
      text: clean,
      spans,
      // In "the `x` block was deleted" the removal is what the absence check proves; it is not a description.
      residual: kind === 'command' || kind === 'frontmatter' || kind === 'import' ? [] : residualOf(negated ? clean.replace(NEGATION_ALL, ' ') : clean),
      negated,
    };
    const override = markers.block ?? markers.next;
    if (override) st.override = override;
    markers.next = null;
    statements.push(st);
  };

  /** Spans of rendered text: inline code in backticks, link targets, and imports, versions and products in prose. */
  const spansOf = (text: string, line: number): Span[] => {
    const spans: Span[] = [];
    for (const m of text.matchAll(/`([^`]+)`/g)) spans.push(...classifyCode(m[1] ?? ''));
    for (const m of text.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = safeDecode((m[1] ?? '').split('#')[0] ?? '');
      if (target && !/^[a-z][\w+.-]*:/i.test(target)) spans.push({ kind: 'link', text: target, expect: 'present' });
    }
    const prose = proseOfText(text);
    for (const p of importsIn(prose)) {
      spans.push({ kind: 'import', text: p, expect: 'present' });
      imports.push({ path: p, line });
    }
    spans.push(...versionSpans(prose), ...dependencySpans(prose));
    return spans;
  };

  const paragraph = (p: Paragraph, kind: StatementKind) => {
    const text = renderInline(p.children);
    if (kind === 'item') {
      push('item', text, lineOf(p), endOf(p), spansOf(text, lineOf(p)));
      return;
    }
    // A fully bold paragraph is one tagline, not several sentences.
    const whole = text.trim();
    const parts = /^\*\*[^*]+\*\*$/.test(whole) ? [{ text: whole, line: 0 }] : sentenceParts(text);
    for (const s of parts) push('sentence', s.text, lineOf(p) + s.line, endOf(p), spansOf(s.text, lineOf(p) + s.line));
  };

  const code = (c: Code, hintDirs: string[]) => {
    const lang = (c.lang ?? '').toLowerCase();
    const lines = c.value.split('\n');
    const start = lineOf(c) + 1;
    if (SHELL_LANGS.has(lang) || lang === '' || lang === 'text' || lang === 'txt') {
      // Join backslash continuations into logical lines.
      for (let i = 0; i < lines.length; i++) {
        let logical = lines[i] ?? '';
        const first = i;
        while (/\\\s*$/.test(logical) && i + 1 < lines.length) logical = `${logical.replace(/\\\s*$/, ' ')}${lines[++i] ?? ''}`;
        const cmd = logical.trim().replace(/^\$\s+/, '').replace(/^>\s+/, '');
        if (!cmd || cmd.startsWith('#')) continue;
        // An unlabelled fence may hold a report, a template or plain text; only lines that run something are claims.
        if (!SHELL_LANGS.has(lang) && !runsSomething(cmd)) continue;
        const spans = commandSpans(cmd, hintDirs);
        push('command', cmd, start + first, start + i, spans, false);
      }
      return;
    }
    if (SCRIPT_LANGS.has(lang)) {
      // Example code is illustrative; only a file-path comment on its own line is a claim.
      lines.forEach((l, i) => {
        const m = l.trim().match(/^(?:\/\/|#)\s*(\S+\.(?:ts|tsx|js|jsx|mjs|cjs|go|py|rs))\s*$/);
        if (m?.[1]) push('code-path', l.trim(), start + i, start + i, [{ kind: 'path', text: m[1], expect: 'present' }], false);
      });
    }
  };

  /** Folders named in the paragraph just before a fence ("run inside `api/`") become working-folder hints. */
  const hintsFrom = (prev: RootContent | undefined): string[] => {
    if (!prev || prev.type !== 'paragraph') return [];
    const text = renderInline(prev.children);
    return [...text.matchAll(/`([^`\s]+\/)`/g)].map((m) => (m[1] ?? '').replace(/^\.\//, '').replace(/\/$/, ''));
  };

  const listItem = (item: ListItem) => {
    for (const [i, child] of item.children.entries()) {
      if (child.type === 'paragraph') paragraph(child, 'item');
      else if (child.type === 'list') list(child);
      else if (child.type === 'code') code(child, hintsFrom(item.children[i - 1]));
      else if (child.type === 'table') table(child);
      else if (child.type === 'html') html(child.value, lineOf(child));
      else if (child.type === 'blockquote') blocks(child.children);
    }
  };
  const list = (l: List) => {
    for (const item of l.children) listItem(item);
  };
  const table = (t: Table) => {
    t.children.forEach((row: TableRow, i) => {
      if (i === 0) return; // header row
      const cells = row.children.map((cell) => renderInline(cell.children)).filter((c) => c.trim());
      const text = cells.join(' · ');
      push('row', text, lineOf(row), endOf(row), spansOf(cells.join(' '), lineOf(row)));
    });
  };
  const html = (value: string, line: number) => {
    const marker = readMarker(value);
    if (!marker) return;
    if (marker.kind === 'ignore-end') {
      markers.block = null;
      return;
    }
    if (!marker.reason) {
      // Fail closed: a marker without a reason silences nothing and is itself a finding.
      markers.findings.push({
        id: statementId(`proof:${marker.kind} without a reason at line ${line}`),
        file,
        line,
        endLine: line,
        section,
        kind: 'marker',
        text: `proof:${marker.kind} marker without a reason`,
        spans: [],
        residual: [],
        negated: false,
      });
      return;
    }
    const override: Override = { reason: marker.reason, line };
    if (marker.kind === 'ignore-start') markers.block = override;
    else markers.next = override;
  };

  const blocks = (children: RootContent[]) => {
    children.forEach((node, i) => {
      switch (node.type) {
        case 'heading':
          section = renderInline((node as Heading).children).trim();
          break;
        case 'paragraph':
          paragraph(node, 'sentence');
          break;
        case 'list':
          list(node);
          break;
        case 'table':
          table(node);
          break;
        case 'code':
          code(node, hintsFrom(children[i - 1]));
          break;
        case 'blockquote':
          blocks(node.children);
          break;
        case 'html':
          html(node.value, lineOf(node));
          break;
        case 'yaml': {
          try {
            const data = parseYaml(node.value) as Record<string, unknown> | null;
            const field = scopeField(file);
            const raw = data?.[field];
            const list = Array.isArray(raw) ? raw.map(String) : typeof raw === 'string' ? raw.split(',').map((s) => s.trim()).filter(Boolean) : null;
            if (list?.length) {
              paths = list;
              // One statement: a pattern that matches nothing only kills the rule when its siblings match nothing too.
              push('frontmatter', `${field}: ${list.join(', ')}`, lineOf(node), endOf(node), list.map((glob): Span => ({ kind: 'glob', text: glob, expect: 'present' })), false);
            }
          } catch (err) {
            frontmatterError = err instanceof Error ? err.message.split('\n')[0] ?? 'invalid YAML' : String(err);
          }
          break;
        }
        default:
          break;
      }
    });
  };

  blocks(tree.children);
  return { statements: [...statements, ...markers.findings], imports, paths, frontmatterError };
}
