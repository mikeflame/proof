import { describe, expect, it } from 'vitest';
import { classifyCode, qualifiedName } from '../src/parse/classify.ts';

const kinds = (code: string) => classifyCode(code).map((s) => `${s.kind}:${s.text}`);

describe('classifyCode', () => {
  it('reads a Go qualified name as a symbol, not a path', () => {
    expect(kinds('internal/testgit.RealGit')).toEqual(['symbol:internal/testgit.RealGit']);
    expect(qualifiedName('internal/testgit.RealGit')).toEqual({ scope: 'internal/testgit', name: 'RealGit' });
    expect(qualifiedName('src/index.ts')).toBeNull();
  });

  it('types paths, env assignments and dotted names', () => {
    expect(kinds('src/index.ts')).toEqual(['path:src/index.ts']);
    expect(kinds('MODE=queue')).toEqual(['env:MODE=queue']);
    expect(kinds('req.sessionId')).toEqual(['symbol:req.sessionId']);
  });

  it('splits flags and drops placeholders', () => {
    expect(kinds('--recover --keep-local')).toEqual(['symbol:--recover', 'symbol:--keep-local']);
    expect(kinds('--run <id>')).toEqual(['symbol:--run']);
  });

  it('reads a list of names as names', () => {
    expect(kinds('(repo, branch, question_id)')).toEqual(['symbol:repo', 'symbol:branch', 'symbol:question_id']);
  });

  it('reads a call as a claim about its callee', () => {
    expect(kinds('reviewqa.Dir(sctx.EvidenceDir)')).toEqual(['symbol:reviewqa.Dir()']);
  });

  it('reads a code snippet as the functions it calls, never as shell commands', () => {
    expect(kinds('export default [checkSchema(schema), wrap(endpoint)]')).toEqual(['symbol:checkSchema()', 'symbol:wrap()']);
  });

  it('reads a scoped package specifier as a dependency', () => {
    expect(kinds('@mui/material/styles')).toEqual(['dependency:@mui/material']);
    expect(kinds('@material-ui/*')).toEqual(['dependency:@material-ui/*']);
  });

  it('types kebab names, refs, templates and Go subtests as names', () => {
    expect(kinds('no-surface')).toEqual(['symbol:no-surface']);
    expect(kinds('refs/tool/recover/<run>')).toEqual(['symbol:refs/tool/recover/<run>']);
    expect(kinds('question-<id>')).toEqual(['symbol:question-<id>']);
    expect(kinds('TestReview/conversation_off')).toEqual(['symbol:TestReview/conversation_off']);
  });

  it('reads an external tool named alone as a command', () => {
    expect(kinds('gh')).toEqual(['command:gh']);
  });

  it('splits shell lines into commands', () => {
    expect(kinds('yarn dev && yarn test')).toEqual(['command:yarn dev', 'command:yarn test']);
  });

  it('never discards what it cannot type', () => {
    expect(kinds('base..head')).toEqual(['unknown:base..head']);
  });
});
