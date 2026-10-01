import type { CheckedStatement, SpanResult } from '../src/model.ts';
import { type FileReport, Run } from '../src/pipeline.ts';
import { makeRepo } from './fixtures/edge.ts';

/** Check one instruction file in a throwaway repository built from `files`. */
export async function checkFiles(files: Record<string, string>, doc = 'CLAUDE.md'): Promise<FileReport> {
  const fixture = makeRepo(files);
  try {
    return await new Run(fixture.repo).checkFile(doc);
  } finally {
    fixture.cleanup();
  }
}

/** The first span result spelled `text`; throws so a missing span fails loudly. */
export function spanOf(report: FileReport, text: string): SpanResult {
  for (const s of report.statements) for (const r of s.results) if (r.text === text) return r;
  throw new Error(`no span "${text}" in ${report.statements.flatMap((s) => s.results.map((r) => r.text)).join(' | ')}`);
}

/** The first statement whose text contains `part`. */
export function statementWith(report: FileReport, part: string): CheckedStatement {
  const st = report.statements.find((s) => s.text.includes(part));
  if (!st) throw new Error(`no statement containing "${part}"`);
  return st;
}
