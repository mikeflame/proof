import { describe, expect, it } from 'vitest';
import { commandSpans } from '../src/parse/classify.ts';
import { splitShell } from '../src/parse/shell.ts';

const argv = (line: string) => splitShell(line).map((c) => c.argv);

describe('splitShell', () => {
  it('follows `cd x &&` into the next command', () => {
    expect(splitShell('cd api && yarn start').map((c) => [c.argv.join(' '), c.cwd])).toEqual([
      ['cd api', ''],
      ['yarn start', 'api'],
    ]);
  });

  it('scopes a cd to its subshell', () => {
    expect(splitShell('(cd web && make build); make test').map((c) => [c.argv.join(' '), c.cwd])).toEqual([
      ['cd web', ''],
      ['make build', 'web'],
      ['make test', ''],
    ]);
  });

  it('strips env prefixes and wrappers, keeping the env', () => {
    const [npm, tee] = splitShell('FOO=1 sudo -E npm run build | tee log');
    expect(npm?.argv).toEqual(['npm', 'run', 'build']);
    expect(npm?.env).toEqual({ FOO: '1' });
    expect(tee?.argv).toEqual(['tee', 'log']);
    expect(argv('time env X=1 node script.js')).toEqual([['node', 'script.js']]);
  });

  it('keeps quoted operators, $() and comments out of the split', () => {
    expect(argv('echo "a && b"')).toEqual([['echo', 'a && b']]);
    expect(argv('kill $(lsof -t -i:3000)')).toEqual([['kill', '$(lsof -t -i:3000)']]);
    expect(argv('make build # builds')).toEqual([['make', 'build']]);
  });

  it('keeps a documentation placeholder as a word', () => {
    expect(argv('make <target>')).toEqual([['make', '<target>']]);
  });

  it('drops redirection targets, including 2>&1', () => {
    expect(argv('node x.js > out.log 2>&1')).toEqual([['node', 'x.js']]);
    expect(argv('make 2>> err.log')).toEqual([['make']]);
  });
});

describe('commandSpans', () => {
  it('turns every simple command into a span and a cd into a folder claim', () => {
    expect(commandSpans('cd api && yarn start').map((s) => [s.kind, s.text, s.cwd ?? ''])).toEqual([
      ['path', 'api/', ''],
      ['command', 'yarn start', 'api'],
    ]);
  });

  it('never claims an output path exists before the command runs', () => {
    const spans = commandSpans('go build -o ./bin/tool ./cmd/tool');
    expect(spans.map((s) => s.text)).toEqual(['go build -o ./bin/tool ./cmd/tool', './cmd/tool']);
  });
});
