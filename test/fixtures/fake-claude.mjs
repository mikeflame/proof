#!/usr/bin/env node
// A stand-in for the claude CLI in tests: answers the verifier prompt from a plan file, records each call.
import { appendFileSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
if (args.includes('--version')) {
  console.log('9.9.9 (fake)');
  process.exit(0);
}
let prompt = '';
for await (const chunk of process.stdin) prompt += chunk;
const plan = process.env.FAKE_CLAUDE_PLAN ? JSON.parse(readFileSync(process.env.FAKE_CLAUDE_PLAN, 'utf8')) : {};
if (process.env.FAKE_CLAUDE_LOG) appendFileSync(process.env.FAKE_CLAUDE_LOG, `${JSON.stringify({ args, prompt })}\n`);
if (prompt.startsWith('You look for what the instruction file')) {
  console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, total_cost_usd: plan.cost ?? 0.01, structured_output: { proposals: plan.gaps ?? [] } }));
  process.exit(0);
}
const items = JSON.parse(prompt.split('<statements>')[1]?.split('</statements>')[0] ?? '[]');
const cost = plan.cost ?? 0.01;
if (plan.mode === 'garbage') {
  console.log('this is not json');
  process.exit(0);
}
if (plan.mode === 'crash') {
  console.error('fake crash');
  process.exit(1);
}
if (plan.mode === 'budget') {
  console.log(JSON.stringify({ type: 'result', subtype: 'error_max_budget_usd', is_error: true, total_cost_usd: cost }));
  process.exit(0);
}
// The fixer: answer from plan.fixes by statement text.
if (prompt.startsWith('You correct stale statements')) {
  // `nth` picks an answer for the n-th fixer call of the test, for multi-round runs.
  const nth = process.env.FAKE_CLAUDE_LOG ? readFileSync(process.env.FAKE_CLAUDE_LOG, 'utf8').split('\n').filter((l) => l.includes('You correct stale statements')).length : 1;
  const edits = [];
  for (const it of items) {
    const fix = (plan.fixes ?? []).find((f) => it.source.includes(f.match) && (f.nth === undefined || f.nth === nth));
    if (!fix) continue;
    const { match, nth: _nth, ...rest } = fix;
    edits.push({ statement_id: it.statement_id, tier: 'A', action: 'replace', evidence: [], reason: 'fixture', ...rest });
  }
  console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, total_cost_usd: cost, structured_output: { edits } }));
  process.exit(0);
}
const results = [];
for (const it of items) {
  const answer = (plan.answers ?? []).find((a) => it.text.includes(a.match));
  if (answer?.omit) continue;
  const { match, omit, ...rest } = answer ?? { verdict: 'unverified_with_reason', evidence: [], reason: 'nothing to cite', action: 'needs-decision' };
  results.push({ statement_id: it.statement_id, action: 'no-op', evidence: [], ...rest });
}
console.log(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, total_cost_usd: cost, structured_output: { results } }));
