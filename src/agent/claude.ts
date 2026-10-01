import { spawn, spawnSync } from 'node:child_process';

export interface ClaudeCall {
  cwd: string;
  prompt: string;
  schema: object;
  model: string;
  effort: string;
  budgetUsd: number;
  /** Tools the verifier may use; everything else is denied. */
  tools: string[];
  allowedTools: string[];
  timeoutMs: number;
}

export interface ClaudeResult {
  ok: boolean;
  structured: unknown;
  costUsd: number;
  /** `success`, `error_max_budget_usd`, `error_max_turns`, `timeout`, `spawn`, `parse`… */
  subtype: string;
  error: string | null;
}

/** The headless Claude Code binary: `PROOF_CLAUDE`, or `claude` on PATH. */
export function claudeBinary(): string {
  return process.env.PROOF_CLAUDE ?? 'claude';
}

/** Version string of the binary, or null when it does not run. */
export function claudeVersion(bin = claudeBinary()): string | null {
  const res = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 20_000 });
  return res.status === 0 ? res.stdout.trim() : null;
}

/**
 * One headless call. The repository's own CLAUDE.md and rules are kept out of the verifier's context
 * (`--setting-sources user`): it judges them and must not take them as instructions. No MCP servers, no
 * session saved, a hard budget and a read-only tool set.
 */
export function runClaude(call: ClaudeCall): Promise<ClaudeResult> {
  const args = [
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(call.schema),
    '--model', call.model,
    '--effort', call.effort,
    '--max-budget-usd', call.budgetUsd.toFixed(2),
    '--setting-sources', 'user',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--permission-mode', 'dontAsk',
    '--tools', call.tools.join(','),
    '--allowedTools', call.allowedTools.join(' '),
    '--disallowedTools', 'Edit Write NotebookEdit WebFetch WebSearch',
  ];
  return new Promise((resolve) => {
    let out = '';
    let err = '';
    let settled = false;
    const finish = (r: ClaudeResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };
    const child = spawn(claudeBinary(), args, { cwd: call.cwd, env: { ...process.env, CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      finish({ ok: false, structured: null, costUsd: 0, subtype: 'timeout', error: `no answer within ${Math.round(call.timeoutMs / 1000)} s` });
    }, call.timeoutMs);
    child.stdout.on('data', (d: Buffer) => {
      out += d.toString();
    });
    child.stderr.on('data', (d: Buffer) => {
      err += d.toString();
    });
    child.on('error', (e) => {
      clearTimeout(timer);
      finish({ ok: false, structured: null, costUsd: 0, subtype: 'spawn', error: `${claudeBinary()} did not start: ${e.message}` });
    });
    child.on('close', () => {
      clearTimeout(timer);
      try {
        const json = JSON.parse(out) as { subtype?: string; is_error?: boolean; structured_output?: unknown; total_cost_usd?: number; result?: string };
        const subtype = json.subtype ?? 'unknown';
        const ok = subtype === 'success' && !json.is_error && json.structured_output !== undefined;
        finish({ ok, structured: json.structured_output ?? null, costUsd: Number(json.total_cost_usd ?? 0), subtype, error: ok ? null : (json.result ?? subtype).slice(0, 300) });
      } catch {
        finish({ ok: false, structured: null, costUsd: 0, subtype: 'parse', error: (err || out || 'no output').trim().split('\n')[0]?.slice(0, 300) ?? 'no output' });
      }
    });
    child.stdin.end(call.prompt);
  });
}
