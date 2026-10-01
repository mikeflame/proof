import { posix } from 'node:path';

/** One simple command out of a shell line, with the folder a preceding `cd` selected. */
export interface SimpleCommand {
  argv: string[];
  env: Record<string, string>;
  /** Working folder relative to where the line runs; undefined when a `cd` went somewhere unknowable (`cd -`, `cd $X`). */
  cwd: string | undefined;
  /** True after `cd` to a folder this splitter cannot resolve; the command's folder is then unknown. */
  cwdUnknown: boolean;
  /** Display form: env prefix and arguments joined by spaces. */
  text: string;
}

type Token = { word: string } | { op: string };

// Longest first: `2>&1` is one redirection, not `2>`, `&` and a word.
const OPERATORS = ['2>&', '&>>', '2>>', '&&', '||', '|&', ';;', '>>', '>&', '&>', '2>', '|', ';', '&', '(', ')', '>', '<'];
/** Commands that only wrap the real one: `sudo make install` runs `make`. */
const WRAPPERS = new Set(['sudo', 'time', 'nohup', 'exec', 'command', 'builtin', 'env', 'nice', 'doas']);
const WRAPPER_FLAGS_WITH_VALUE: Record<string, Set<string>> = { sudo: new Set(['-u', '-g', '-C', '-D']), nice: new Set(['-n']) };

/** Split a shell line into words and operators, honouring quotes, escapes, `$(…)`, backticks and comments. */
export function tokenize(line: string): Token[] {
  const out: Token[] = [];
  let word = '';
  let inWord = false;
  const flush = () => {
    if (inWord) out.push({ word });
    word = '';
    inWord = false;
  };
  for (let i = 0; i < line.length; i++) {
    const c = line[i] ?? '';
    if (c === '\\') {
      word += line[i + 1] ?? '';
      inWord = true;
      i++;
      continue;
    }
    if (c === "'") {
      const end = line.indexOf("'", i + 1);
      word += end < 0 ? line.slice(i + 1) : line.slice(i + 1, end);
      inWord = true;
      i = end < 0 ? line.length : end;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      for (; j < line.length && line[j] !== '"'; j++) {
        if (line[j] === '\\' && j + 1 < line.length) {
          word += line[j + 1];
          j++;
        } else word += line[j];
      }
      inWord = true;
      i = j;
      continue;
    }
    // `make <target>`: a documentation placeholder is a word, not two redirections.
    const placeholder = c === '<' ? /^<[A-Za-z][\w.-]*>/.exec(line.slice(i))?.[0] : undefined;
    if (placeholder) {
      word += placeholder;
      inWord = true;
      i += placeholder.length - 1;
      continue;
    }
    if (c === '$' && line[i + 1] === '(') {
      // Command substitution stays inside the word it belongs to.
      let depth = 0;
      let j = i + 1;
      for (; j < line.length; j++) {
        if (line[j] === '(') depth++;
        else if (line[j] === ')' && --depth === 0) break;
      }
      word += line.slice(i, j + 1);
      inWord = true;
      i = j;
      continue;
    }
    if (c === '`') {
      const end = line.indexOf('`', i + 1);
      word += line.slice(i, end < 0 ? line.length : end + 1);
      inWord = true;
      i = end < 0 ? line.length : end;
      continue;
    }
    if (c === '#' && !inWord) break;
    if (/\s/.test(c)) {
      flush();
      continue;
    }
    const op = OPERATORS.find((o) => line.startsWith(o, i));
    if (op) {
      // `2>` only counts as a redirection at the start of a word.
      if (op.startsWith('2') && inWord) {
        word += c;
        continue;
      }
      flush();
      out.push({ op });
      i += op.length - 1;
      continue;
    }
    word += c;
    inWord = true;
  }
  flush();
  return out;
}

const isAssignment = (w: string) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(w);

/** Strip wrappers and env prefixes: `FOO=1 sudo -E make x` gives argv [make, x] and env {FOO: 1}. */
function unwrap(words: string[]): { argv: string[]; env: Record<string, string> } {
  const env: Record<string, string> = {};
  let i = 0;
  for (;;) {
    while (i < words.length && isAssignment(words[i] ?? '')) {
      const w = words[i] ?? '';
      const eq = w.indexOf('=');
      env[w.slice(0, eq)] = w.slice(eq + 1);
      i++;
    }
    const head = words[i];
    if (!head || !WRAPPERS.has(head)) break;
    i++;
    const withValue = WRAPPER_FLAGS_WITH_VALUE[head] ?? new Set<string>();
    while (i < words.length && (words[i] ?? '').startsWith('-')) {
      if (withValue.has(words[i] ?? '')) i++;
      i++;
    }
  }
  return { argv: words.slice(i), env };
}

const REDIRECTS = new Set(['>', '>>', '<', '&>', '&>>', '2>', '2>>', '2>&', '>&']);

/**
 * Split a shell line into simple commands. `cd x && yarn start` gives a `cd x` command and a
 * `yarn start` command whose cwd is `x`. A `cd` inside parentheses ends with the subshell.
 */
export function splitShell(line: string, startCwd = ''): SimpleCommand[] {
  const tokens = tokenize(line);
  const commands: SimpleCommand[] = [];
  const stack: { cwd: string | undefined; unknown: boolean }[] = [];
  let cwd: string | undefined = startCwd;
  let cwdUnknown = false;
  let words: string[] = [];

  const end = () => {
    if (!words.length) return;
    const { argv, env } = unwrap(words);
    words = [];
    if (!argv.length) return;
    const prefix = Object.entries(env).map(([k, v]) => `${k}=${v}`);
    commands.push({ argv, env, cwd, cwdUnknown, text: [...prefix, ...argv].join(' ') });
    if (argv[0] === 'cd' || argv[0] === 'pushd') {
      const target = argv[1];
      if (!target || target === '-' || target.startsWith('~') || target.includes('$') || target.startsWith('/')) {
        cwd = undefined;
        cwdUnknown = true;
      } else if (cwd !== undefined) {
        cwd = posix.normalize(posix.join(cwd, target)).replace(/^\.$/, '').replace(/\/$/, '');
      }
    }
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (!t) continue;
    if ('word' in t) {
      words.push(t.word);
      continue;
    }
    if (REDIRECTS.has(t.op)) {
      i++; // the redirection target is a file name, not an argument
      continue;
    }
    end();
    if (t.op === '(') stack.push({ cwd, unknown: cwdUnknown });
    else if (t.op === ')') {
      const outer = stack.pop();
      if (outer) {
        cwd = outer.cwd;
        cwdUnknown = outer.unknown;
      }
    }
  }
  end();
  return commands;
}
