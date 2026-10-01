import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { EvidenceLevel } from '../model.ts';
import type { RepoContext } from './repo.ts';

/* Minimal shapes of the web-tree-sitter API this module uses. */
interface TSPoint {
  row: number;
  column: number;
}
export interface TSNode {
  id: number;
  type: string;
  text: string;
  startPosition: TSPoint;
  endPosition: TSPoint;
  startIndex: number;
  endIndex: number;
  parent: TSNode | null;
  namedChildren: TSNode[];
  childForFieldName(name: string): TSNode | null;
  childrenForFieldName(name: string): TSNode[];
  descendantForPosition(start: TSPoint, end?: TSPoint): TSNode;
  descendantsOfType(type: string | string[]): TSNode[];
}
interface TSTree {
  rootNode: TSNode;
}
interface TSParser {
  setLanguage(lang: unknown): void;
  parse(src: string): TSTree | null;
}
interface TSModule {
  Parser: { init(opts: { locateFile: (f: string) => string }): Promise<void>; new (): TSParser };
  Language: { load(path: string): Promise<unknown> };
}

const GRAMMAR_OF: [RegExp, string][] = [
  [/\.go$/, 'go'],
  [/\.(ts|mts|cts)$/, 'typescript'],
  [/\.tsx$/, 'tsx'],
  [/\.(js|mjs|cjs|jsx)$/, 'javascript'],
  [/\.pyi?$/, 'python'],
  [/\.rs$/, 'rust'],
  [/\.java$/, 'java'],
  [/(\.rb|\.rake|(^|\/)(Rakefile|Gemfile))$/, 'ruby'],
  [/\.php$/, 'php'],
  [/\.cs$/, 'c-sharp'],
  [/\.(c|h|cc|cpp|cxx|hpp|hh)$/, 'cpp'],
  [/(\.(sh|bash|zsh)|(^|\/)(\.bashrc|\.zshrc|\.profile))$/, 'bash'],
];

/** Grammar names the build copies next to the bundle. */
export const GRAMMARS = [...new Set(GRAMMAR_OF.map(([, g]) => g))];

/** Languages present in a repository that have no grammar, so their definitions are matched by pattern. */
export const NO_GRAMMAR: [RegExp, string][] = [
  [/\.kts?$/, 'Kotlin'],
  [/\.swift$/, 'Swift'],
  [/\.scala$/, 'Scala'],
  [/\.(ex|exs)$/, 'Elixir'],
  [/\.dart$/, 'Dart'],
  [/\.lua$/, 'Lua'],
  [/\.(fs|fsx)$/, 'F#'],
  [/\.(clj|cljs)$/, 'Clojure'],
  [/\.(hs)$/, 'Haskell'],
  [/\.(zig)$/, 'Zig'],
];

export function grammarFor(file: string, text?: string | null): string | null {
  for (const [re, lang] of GRAMMAR_OF) if (re.test(file)) return lang;
  if (text && /^#!.*\b(ba|z)?sh\b/.test(text)) return 'bash';
  return null;
}

/**
 * The runtime ships as CommonJS. Next to the bundle it is renamed to .cjs, because a package.json with
 * "type": "module" above it would make Node load a .js file as ESM, where it cannot find itself.
 */
function runtimeIn(dir: string): string | null {
  for (const name of ['tree-sitter.cjs', 'tree-sitter.js']) if (existsSync(join(dir, name))) return join(dir, name);
  return null;
}

function grammarDir(): string | null {
  const candidates: string[] = [];
  if (process.env.PROOF_GRAMMARS) candidates.push(process.env.PROOF_GRAMMARS);
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    candidates.push(join(here, 'grammars'));
    candidates.push(join(here, '..', '..', 'node_modules', '@vscode', 'tree-sitter-wasm', 'wasm'));
  } catch {
    // import.meta.url unavailable: fall through to require resolution
  }
  try {
    const req = createRequire(import.meta.url);
    candidates.push(join(dirname(req.resolve('@vscode/tree-sitter-wasm/package.json')), 'wasm'));
  } catch {
    // not installed as a package: the bundled grammars folder must exist
  }
  return candidates.find((d) => runtimeIn(d) !== null) ?? null;
}

/** Parses files with tree-sitter on demand; one instance per run. */
export class Syntax {
  private mod: TSModule | null = null;
  private dir: string | null = null;
  private failed: string | null = null;
  private languages = new Map<string, unknown | null>();
  private trees = new Map<string, TSTree | null>();
  private parser: TSParser | null = null;
  private readonly repo: RepoContext;

  constructor(repo: RepoContext) {
    this.repo = repo;
  }

  private async init(): Promise<boolean> {
    if (this.mod) return true;
    if (this.failed) return false;
    this.dir = grammarDir();
    if (!this.dir) {
      this.failed = 'tree-sitter grammars not found; definitions are matched by line patterns';
      this.repo.degrade('syntax', this.failed);
      return false;
    }
    try {
      const req = createRequire(import.meta.url);
      const mod = req(runtimeIn(this.dir) ?? join(this.dir, 'tree-sitter.js')) as TSModule;
      const dir = this.dir;
      await mod.Parser.init({ locateFile: (f: string) => join(dir, f) });
      this.mod = mod;
      this.parser = new mod.Parser();
      return true;
    } catch (err) {
      this.failed = `tree-sitter failed to start (${err instanceof Error ? err.message : String(err)}); definitions are matched by line patterns`;
      this.repo.degrade('syntax', this.failed);
      return false;
    }
  }

  private async language(name: string): Promise<unknown | null> {
    if (this.languages.has(name)) return this.languages.get(name) ?? null;
    let lang: unknown | null = null;
    try {
      if (this.mod && this.dir) lang = await this.mod.Language.load(join(this.dir, `tree-sitter-${name}.wasm`));
    } catch (err) {
      this.repo.degrade(`grammar ${name}`, `failed to load (${err instanceof Error ? err.message : String(err)}); ${name} files are matched by line patterns`);
    }
    this.languages.set(name, lang);
    return lang;
  }

  /** Parse tree of a repository file, or null when no grammar covers it. */
  async tree(file: string): Promise<TSTree | null> {
    if (this.trees.has(file)) return this.trees.get(file) ?? null;
    const text = this.repo.read(file);
    const name = grammarFor(file, text);
    let tree: TSTree | null = null;
    if (text !== null && name && text.length < 2_000_000 && (await this.init())) {
      const lang = await this.language(name);
      if (lang && this.parser) {
        this.parser.setLanguage(lang);
        tree = this.parser.parse(text);
      }
    }
    this.trees.set(file, tree);
    return tree;
  }
}

const COMMENT = /comment/;
const STRING = /^(string|string_fragment|string_content|template_string|interpreted_string_literal|raw_string_literal|string_literal|char_literal|encapsed_string|heredoc_body|heredoc_content|raw_string|interpolated_string_expression|verbatim_string_literal|string_value)$/;
const DEFINITION_PARENT = /declaration|definition|declarator|_spec$|signature|_item$|^method|^function|^class|^interface|^enum|^struct|^type_alias|^module$|^namespace|^trait|^impl|^field_declaration|^property_signature|^public_field_definition|^pair$|^variable_assignment$|^assignment$|^decorated_definition$|^macro_definition$|^singleton_method$/;
const NAME_TYPES = /identifier$|^word$|^name$|^constant$|^variable_name$|^property_identifier$|^type_identifier$|^field_identifier$|^package_identifier$|^shorthand_property_identifier$|^namespace_identifier$/;
const ENV_READ = /(getenv|environ|env\[|ENV\[|env::var|GetEnvironmentVariable|process\.env|os\.Getenv|LookupEnv|System\.getenv|import\.meta\.env)/;

/** Is `node` the name a declaration introduces? Checks the `name` field up to two levels up, and assignment targets. */
function isDefinitionName(node: TSNode): boolean {
  for (let anc = node.parent, depth = 0; anc && depth < 3; anc = anc.parent, depth++) {
    if (!DEFINITION_PARENT.test(anc.type)) continue;
    const names = [...anc.childrenForFieldName('name'), ...anc.childrenForFieldName('left'), ...anc.childrenForFieldName('key')];
    if (names.some((n) => n.startPosition.row === node.startPosition.row && n.startPosition.column === node.startPosition.column)) return true;
    // `const x = …` keeps the name inside a declarator child.
    const declarators = anc.namedChildren.filter((c) => /declarator|_spec$/.test(c.type));
    if (declarators.some((d) => d.childForFieldName('name')?.startPosition.column === node.startPosition.column && d.startPosition.row === node.startPosition.row)) return true;
  }
  return false;
}

/** Classify the occurrence of `name` at a 1-based line and column of `file`. */
export async function classifyOccurrence(syntax: Syntax, repo: RepoContext, file: string, line: number, column: number, name: string): Promise<EvidenceLevel> {
  const tree = await syntax.tree(file);
  const lines = repo.lines(file);
  const lineText = lines[line - 1] ?? '';
  if (!tree) return classifyByPattern(file, lineText, name, { lines, index: line - 1 });
  const row = line - 1;
  const col = Math.max(0, column - 1);
  let node: TSNode | null = tree.rootNode.descendantForPosition({ row, column: col }, { row, column: col + name.length });
  // Climb from the smallest node to the one spelling exactly the name (or a dotted access that ends with it).
  while (node && node.text !== name && node.parent && node.parent.text.length <= name.length + 2) node = node.parent;
  if (!node) return 'none';
  for (let anc: TSNode | null = node; anc; anc = anc.parent) {
    if (COMMENT.test(anc.type)) return 'comment';
    if (STRING.test(anc.type)) {
      let str = anc;
      while (str.parent && STRING.test(str.parent.type)) str = str.parent;
      return stringLevel(lineText, name, column, unquote(str.text), declaresValue(str));
    }
  }
  if (NAME_TYPES.test(node.type) && isDefinitionName(node)) return 'definition';
  return 'reference';
}

const esc = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const unquote = (t: string) => t.replace(/^[rbfuRBFU@$]*("{3}|'{3}|["'`])/, '').replace(/("{3}|'{3}|["'`])$/, '');
const SQL_TYPES = '(?:INTEGER|INT|BIGINT|SMALLINT|TINYINT|TEXT|VARCHAR|CHAR|CHARACTER|BOOLEAN|BOOL|REAL|DOUBLE|FLOAT|NUMERIC|DECIMAL|DATE|TIME|TIMESTAMP|TIMESTAMPTZ|DATETIME|INTERVAL|JSON|JSONB|UUID|BLOB|BYTEA|SERIAL|BIGSERIAL|CITEXT|INET|MONEY)';
const SQL_STRONG = /\b(?:SELECT|UPDATE|INSERT INTO|DELETE FROM|WHERE|SET|JOIN|ORDER BY|GROUP BY|RETURNING|VALUES|ON CONFLICT|COALESCE|IS NOT NULL|IS NULL)\b/;
const SQL_WEAK = /\b(?:AND|OR|THEN|WHEN|CASE|ELSE|END|AS|FROM|LIMIT|DESC|ASC|IN|NOT)\b/g;
const looksLikeSql = (line: string) => SQL_STRONG.test(line) || (line.match(SQL_WEAK) ?? []).length >= 2;
const VALUE_HOLDER = /^(const_spec|var_spec|const_declaration|var_declaration|variable_declarator|lexical_declaration|enum_assignment|enum_member|enum_variant|enumerator|assignment|field_declaration|property_declaration|static_item|const_item|let_declaration|public_field_definition|property_signature|class_constant|const_element)$/;

/** A string that is the value of a constant, enum member or field, or a map key: it declares that value. */
function declaresValue(str: TSNode): boolean {
  for (let anc = str.parent, depth = 0; anc && depth < 3; anc = anc.parent, depth++) {
    if (/^(pair|keyed_element|dictionary_entry|key_value_pair|map_entry|element_value_pair)$/.test(anc.type)) {
      const key = anc.childForFieldName('key') ?? anc.namedChildren[0];
      return Boolean(key && key.startIndex <= str.startIndex && key.endIndex >= str.endIndex);
    }
    if (VALUE_HOLDER.test(anc.type)) return true;
    if (/call|argument|binary|comparison|return|if_|case|switch|match/.test(anc.type)) return false;
  }
  return false;
}

/**
 * Evidence level of a name found inside a string. Strings are where data names live, so a few shapes are
 * real evidence: an exact literal (`"untested"`), a serialization tag (`json:"closed_last"`), SQL that
 * declares or uses a column. A name merely inside longer text stays `substring`. Spec 4.2.
 */
export function stringLevel(lineText: string, name: string, column: number, content: string | null, declares: boolean): EvidenceLevel {
  const n = esc(name);
  const q = '["`\\[]?';
  if (/^[A-Z][A-Z0-9_]*$/.test(name) && ENV_READ.test(lineText)) return 'definition';
  if (content !== null && content === name) return declares ? 'declaration' : 'reference';
  const declaresSql = [
    new RegExp(`\\bCREATE\\s+(?:OR\\s+REPLACE\\s+)?(?:TEMP(?:ORARY)?\\s+|UNIQUE\\s+)?(?:TABLE|VIEW|INDEX|TYPE|SEQUENCE|MATERIALIZED\\s+VIEW)\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:\\w+\\.)?${q}${n}\\b`, 'i'),
    new RegExp(`\\bADD\\s+(?:COLUMN\\s+)?(?:IF\\s+NOT\\s+EXISTS\\s+)?${q}${n}${q}\\s+\\w`, 'i'),
    new RegExp(`^\\s*\\(?\\s*${q}${n}${q}\\s+${SQL_TYPES}\\b`, 'i'),
    new RegExp(`\\bRENAME\\s+(?:COLUMN\\s+)?\\w+\\s+TO\\s+${q}${n}\\b`, 'i'),
  ];
  if (declaresSql.some((re) => re.test(lineText))) return 'declaration';
  if (new RegExp(`\\b(?:json|yaml|toml|db|xml|bson|mapstructure|form|query|msgpack|koanf|env|hcl|gorm|protobuf)\\s*:\\s*"(?:[^"]*;)?(?:column:|name=)?${n}[,;"]`).test(lineText)) return 'declaration';
  if (new RegExp(`\\b(?:rename|alias|serialization_alias|validation_alias|db_column|column_name|serialize|deserialize)\\s*=\\s*["']${n}["']`).test(lineText)) return 'declaration';
  const at = column - 1;
  const before = lineText[at - 1] ?? '';
  const after = lineText[at + name.length] ?? '';
  const bounded = !/[\w$-]/.test(before) && !/[\w$-]/.test(after);
  if (bounded && looksLikeSql(lineText) && /^[a-z_][a-z0-9_]*$/.test(name)) return 'reference';
  // A host, a ref or a kebab-case name lives in strings, but only a string that is one token (a URL, a
  // path, a prefix) holds it as data; a sentence in an error or help message mentions it, like a comment.
  if (bounded && /[-./:]/.test(name) && content !== null && !/\s/.test(content.trim())) return 'reference';
  return 'substring';
}

/** The quoted text around a 1-based column of a line, or null when the column is not inside quotes. */
export function quotedAround(lineText: string, column: number): string | null {
  const at = column - 1;
  for (let start = at - 1; start >= 0; start--) {
    const q = lineText[start] ?? '';
    if (!/["'`]/.test(q)) continue;
    const end = lineText.indexOf(q, at);
    if (end < 0) return null;
    // An odd number of the same quote before `start` means it closes an earlier string.
    const before = lineText.slice(0, start).split(q).length - 1;
    return before % 2 === 0 ? lineText.slice(start + 1, end) : null;
  }
  return null;
}

const OWNER_TYPES = /^(class_declaration|class_definition|class_specifier|struct_specifier|class|abstract_class_declaration|interface_declaration|trait_declaration|enum_declaration|record_declaration|struct_declaration|object_declaration|type_spec|type_alias_declaration|struct_item|enum_item|trait_item|impl_item|union_item|module|module_declaration|internal_module|namespace_declaration|protocol_declaration)$/;

/** `*Executor`, `Foo<T>`, `pkg.Type[T]`: the bare type name. */
const bareType = (t: string): string | null => t.replace(/<.*$|\[.*$/s, '').replace(/^[\s*&(]+|[\s)]+$/g, '').split(/[.:]+/).pop()?.match(/^[A-Za-z_]\w*/)?.[0] ?? null;

/**
 * The type that owns the definition of `name` at a 1-based line and column: the receiver of a Go method,
 * or the class, struct, interface, trait or impl around a method or field. Null when it cannot be read.
 */
export async function ownerOf(syntax: Syntax, file: string, line: number, column: number, name: string): Promise<string | null> {
  const tree = await syntax.tree(file);
  if (!tree) return null;
  const row = line - 1;
  const col = Math.max(0, column - 1);
  let node: TSNode | null = tree.rootNode.descendantForPosition({ row, column: col }, { row, column: col + name.length });
  while (node && node.text !== name && node.parent && node.parent.text.length <= name.length + 2) node = node.parent;
  for (let anc = node?.parent ?? null; anc; anc = anc.parent) {
    if (anc.type === 'method_declaration') {
      const receiver = anc.childForFieldName('receiver');
      if (receiver) {
        const param = receiver.namedChildren.find((c) => c.type === 'parameter_declaration');
        const type = param?.childForFieldName('type')?.text;
        if (type) return bareType(type);
      }
    }
    // C++ out-of-line `void Type::method()`.
    if (anc.type === 'qualified_identifier' && anc.parent?.type === 'function_declarator') {
      const scope = anc.childForFieldName('scope')?.text;
      if (scope) return bareType(scope);
    }
    if (OWNER_TYPES.test(anc.type)) {
      const named = anc.childForFieldName('name') ?? (anc.type === 'impl_item' ? anc.childForFieldName('type') : null);
      if (named) return bareType(named.text);
    }
  }
  return null;
}

const SHELL_KEYS = /^\s*-?\s*(?:run|script|command|cmd|entrypoint|args|before_script|after_script|exec)\s*:/;

/**
 * A name inside a YAML value: a shell command (`run:`) uses it; prose (a `description:` or a folded
 * block of text) only mentions it.
 */
function yamlValueLevel(lines: string[], index: number): EvidenceLevel {
  const line = lines[index] ?? '';
  const single = line.match(/^\s*-?\s*[\w.-]+\s*:\s*(.+)$/);
  if (single && !/^[|>][-+]?\s*$/.test(single[1] ?? '')) {
    if (SHELL_KEYS.test(line)) return 'reference';
    return /\s/.test((single[1] ?? '').trim().replace(/^["']|["']$/g, '')) ? 'substring' : 'reference';
  }
  const indent = line.search(/\S/);
  for (let i = index - 1; i >= 0; i--) {
    const parent = lines[i] ?? '';
    if (!parent.trim() || parent.search(/\S/) >= indent) continue;
    if (/[|>][-+]?\s*$/.test(parent)) return SHELL_KEYS.test(parent) ? 'reference' : 'substring';
    return 'reference';
  }
  return 'reference';
}

/** Best-effort classification for files with no grammar. */
export function classifyByPattern(file: string, lineText: string, name: string, context?: { lines: string[]; index: number }): EvidenceLevel {
  const t = lineText.trim();
  const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (/^(\/\/|#(?!!)|\*|\/\*|--|;|<!--|%|')/.test(t) && !/^#\s*(define|include)\b/.test(t)) return 'comment';
  const inQuotes = new RegExp(`(["'\`])[^"'\`]*\\b${esc}\\b[^"'\`]*\\1`).test(lineText);
  if (/\.(ya?ml|toml|ini|env|properties|json|jsonc|json5)$/.test(file) || /(^|\/)\.env/.test(file)) {
    if (new RegExp(`^\\s*-?\\s*["']?${esc}["']?\\s*[:=]`).test(lineText)) return 'declaration';
    // A scalar that is exactly the name (`- name`, `key: name`) uses it; inside a longer value it is text.
    if (new RegExp(`^\\s*(?:-\\s+|[\\w.-]+\\s*[:=]\\s*)["']?${esc}["']?\\s*,?\\s*(?:#.*)?$`).test(lineText)) return 'reference';
    if (/\.ya?ml$/.test(file) && context) return yamlValueLevel(context.lines, context.index);
    if (/\.json5?c?$/.test(file) && /^\s*"[^"]*"\s*:\s*"[^"]*\s[^"]*"/.test(lineText)) return 'substring';
  }
  if (/\.sql$/i.test(file)) {
    const level = stringLevel(lineText, name, lineText.indexOf(name) + 1, null, false);
    return level === 'substring' ? 'reference' : level;
  }
  if (new RegExp(`\\b(func|function|def|class|interface|type|struct|enum|trait|impl|module|const|let|var|val|fun|fn|sub|macro|alias|object|record|protocol|extension)\\s+(\\([^)]*\\)\\s*)?${esc}\\b`).test(lineText)) return 'definition';
  if (new RegExp(`^\\s*(export\\s+)?${esc}\\s*(\\(\\)\\s*\\{|=)`).test(lineText)) return 'definition';
  if (inQuotes) {
    const exact = new RegExp(`(["'\`])${esc}\\1`).exec(lineText);
    if (exact) return /(?:^|[^=!<>])=\s*$|:=\s*$|=>\s*$|:\s*$|^\s*$/.test(lineText.slice(0, exact.index)) ? 'declaration' : 'reference';
    const col = lineText.indexOf(name) + 1;
    return stringLevel(lineText, name, col, quotedAround(lineText, col), false);
  }
  return 'reference';
}

export interface ShellEntry {
  line: number;
  kind: 'function' | 'case';
}

/** Functions and `case` labels a shell script defines, read from its syntax tree. */
export async function shellEntries(syntax: Syntax, repo: RepoContext, file: string): Promise<Map<string, ShellEntry> | null> {
  const text = repo.read(file);
  if (text === null) return null;
  const tree = await syntax.tree(file);
  const out = new Map<string, ShellEntry>();
  if (tree && grammarFor(file, text) === 'bash') {
    for (const fn of tree.rootNode.descendantsOfType('function_definition')) {
      const name = fn.childForFieldName('name')?.text;
      if (name && !out.has(name)) out.set(name, { line: fn.startPosition.row + 1, kind: 'function' });
    }
    for (const item of tree.rootNode.descendantsOfType('case_item')) {
      for (const value of item.childrenForFieldName('value')) {
        const label = value.text.replace(/^["']|["']$/g, '');
        if (label && label !== '*' && !out.has(label)) out.set(label, { line: item.startPosition.row + 1, kind: 'case' });
      }
    }
    return out;
  }
  // No grammar loaded: fall back to line patterns, still exact on names.
  text.split('\n').forEach((l, i) => {
    const fn = l.match(/^\s*(?:function\s+([\w:.-]+)|([\w:.-]+)\s*\(\)\s*\{?)/);
    const name = fn?.[1] ?? fn?.[2];
    if (name && !out.has(name)) out.set(name, { line: i + 1, kind: 'function' });
    const cs = l.match(/^\s*([\w:.|"'-]+)\)/);
    if (cs?.[1]) for (const label of cs[1].split('|').map((x) => x.replace(/^["']|["']$/g, ''))) if (label && label !== '*' && !out.has(label)) out.set(label, { line: i + 1, kind: 'case' });
  });
  return out;
}
