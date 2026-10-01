// The universality matrix of spec 6: one fixture per ecosystem cell. A cell the checks cover mechanically
// is listed in src/vocabulary.ts MATRIX as such, and this test proves it with a true and a stale line.
import { describe, expect, it } from 'vitest';
import { checkFiles, spanOf } from './helpers.ts';

const fence = (...lines: string[]) => `# Doc\n\n\`\`\`bash\n${lines.join('\n')}\n\`\`\`\n`;
const items = (...lines: string[]) => `# Doc\n\n${lines.map((l) => `- ${l}`).join('\n')}\n`;

describe('Node', () => {
  it('scripts, workspaces, npx, versions, definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('npm run build', 'yarn workspace web run dev', 'npx tsc --noEmit', 'npm run vanished')}\n${items('Node 22+ is required.', '`createApp()` builds the app.')}`,
      'package.json': JSON.stringify({ name: 'root', private: true, workspaces: ['web'], scripts: { build: 'tsc' }, engines: { node: '>=22' }, devDependencies: { typescript: '5' } }),
      'web/package.json': JSON.stringify({ name: 'web', scripts: { dev: 'vite' } }),
      'src/app.ts': 'export function createApp() {}\n',
    });
    for (const t of ['npm run build', 'yarn workspace web run dev', 'npx tsc --noEmit', 'Node 22+', 'createApp()']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'npm run vanished').status).toBe('STALE');
  });
});

describe('Python', () => {
  it('pyproject scripts, tox, nox, python -m, manage.py, requires-python, definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('uv run serve', 'tox -e lint', 'nox -s tests', 'python -m app.cli', 'python manage.py migrate', 'tox -e vanished')}\n${items('Python 3.11+.', '`build_index` builds it.')}`,
      'pyproject.toml': '[project]\nname = "app"\nrequires-python = ">=3.11"\n[project.scripts]\nserve = "app.cli:main"\n',
      'tox.ini': '[tox]\nenvlist = py311\n[testenv:lint]\ncommands = ruff check\n',
      'noxfile.py': 'import nox\n\n@nox.session\ndef tests(session):\n    pass\n',
      'app/__init__.py': '',
      'app/cli.py': 'def main():\n    pass\n\ndef build_index():\n    pass\n',
      'manage.py': 'print(1)\n',
    });
    for (const t of ['uv run serve', 'tox -e lint', 'nox -s tests', 'python -m app.cli', 'python manage.py migrate', 'Python 3.11+', 'build_index']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'tox -e vanished').status).toBe('STALE');
  });
});

describe('Go', () => {
  it('go run and test on package paths, go.mod version, definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('go run ./cmd/server', 'go test ./...', 'go run ./cmd/vanished')}\n${items('Go 1.24.', '`server.Start` starts it.')}`,
      'go.mod': 'module example.com/app\n\ngo 1.24\n',
      'cmd/server/main.go': 'package main\n\nfunc main() {}\n',
      'server/server.go': 'package server\n\nfunc Start() {}\n',
    });
    for (const t of ['go run ./cmd/server', 'go test ./...', 'Go 1.24', 'server.Start']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'go run ./cmd/vanished').status).toBe('STALE');
  });
});

describe('Rust', () => {
  it('cargo aliases and crates, rust-toolchain, definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('cargo xtask', 'cargo test -p core', 'cargo test -p vanished')}\n${items('Rust 1.80.', '`parse_config` reads it.')}`,
      'Cargo.toml': '[workspace]\nmembers = ["core"]\n',
      'core/Cargo.toml': '[package]\nname = "core"\nversion = "0.1.0"\nrust-version = "1.80"\n',
      'core/src/lib.rs': 'pub fn parse_config() {}\n',
      '.cargo/config.toml': '[alias]\nxtask = "run -p xtask --"\n',
      'rust-toolchain.toml': '[toolchain]\nchannel = "1.80"\n',
    });
    for (const t of ['cargo xtask', 'cargo test -p core', 'Rust 1.80', 'parse_config']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'cargo test -p vanished').status).toBe('STALE');
  });
});

describe('JVM', () => {
  it('maven phases, gradle tasks, java definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('./mvnw verify', './gradlew integrationTest', './gradlew vanishedTask')}\n${items('`OrderService` handles orders.')}`,
      'pom.xml': '<project></project>\n',
      mvnw: '#!/bin/sh\n',
      gradlew: '#!/bin/sh\n',
      'build.gradle.kts': 'tasks.register<Test>("integrationTest") {\n}\n',
      'src/main/java/app/OrderService.java': 'package app;\n\npublic class OrderService {}\n',
    });
    for (const t of ['./mvnw verify', './gradlew integrationTest', 'OrderService']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, './gradlew vanishedTask').status).toBe('UNCONFIRMED');
  });
});

describe('Ruby, PHP, .NET', () => {
  it('rake, composer scripts, dotnet, Gemfile ruby, definitions', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('bundle exec rake spec', 'composer run lint', 'dotnet test', 'composer run vanished')}\n${items('Ruby 3.3.', '`InvoiceMailer` sends invoices.', '`renderInvoice` renders.')}`,
      Rakefile: 'task :spec do\nend\n',
      Gemfile: "source 'https://rubygems.org'\nruby '3.3.0'\n",
      'composer.json': JSON.stringify({ name: 'acme/app', scripts: { lint: 'phpcs' } }),
      'app/invoice_mailer.rb': 'class InvoiceMailer\nend\n',
      'src/invoice.php': '<?php\nfunction renderInvoice() {}\n',
      'App.sln': '\n',
    });
    for (const t of ['bundle exec rake spec', 'composer run lint', 'dotnet test', 'Ruby 3.3', 'InvoiceMailer', 'renderInvoice']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'composer run vanished').status).toBe('STALE');
  });
});

describe('Shell, just, task', () => {
  it('functions and case labels, justfile recipes, Taskfile tasks', async () => {
    const r = await checkFiles({
      'CLAUDE.md': fence('./dev.sh up', 'just fmt', 'task lint', 'just vanished', 'task vanished'),
      'dev.sh': '#!/usr/bin/env bash\nup() { echo up; }\n"$@"\n',
      justfile: 'fmt:\n    cargo fmt\n',
      'Taskfile.yml': 'version: 3\ntasks:\n  lint:\n    cmds: [eslint .]\n',
    });
    for (const t of ['./dev.sh up', 'just fmt', 'task lint']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'just vanished').status).toBe('STALE');
    expect(spanOf(r, 'task vanished').status).toBe('STALE');
  });
});

describe('Containers and CI', () => {
  it('compose services and images, workflow jobs', async () => {
    const r = await checkFiles({
      'CLAUDE.md': `${fence('docker compose up -d db', 'docker compose up vanished')}\n${items('PostgreSQL 16 runs in compose.', 'CI runs the `lint` job.')}`,
      'compose.yml': 'services:\n  db:\n    image: postgres:16\n',
      '.github/workflows/ci.yml': 'on: push\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps: []\n',
    });
    for (const t of ['docker compose up -d db', 'PostgreSQL 16', 'lint']) expect(spanOf(r, t).status, t).toBe('VERIFIED');
    expect(spanOf(r, 'docker compose up vanished').status).toBe('STALE');
  });
});

describe('versions beyond the first matrix', () => {
  it('.NET from global.json and target frameworks, Java from the build, PHP from composer', async () => {
    const r = await checkFiles({
      'CLAUDE.md': '# Doc\n\n- Built on .NET 9.0.\n- Java 21 is required.\n- PHP 8.3 or newer.\n',
      'global.json': JSON.stringify({ sdk: { version: '10.0.100' } }),
      'src/App/App.csproj': '<Project><PropertyGroup><TargetFramework>net10.0</TargetFramework></PropertyGroup></Project>\n',
      'pom.xml': '<project><properties><maven.compiler.release>21</maven.compiler.release></properties></project>\n',
      'composer.json': JSON.stringify({ name: 'acme/x', require: { php: '>=8.3' } }),
    });
    expect(spanOf(r, '.NET 9.0').status).toBe('STALE');
    expect(spanOf(r, 'Java 21').status).toBe('VERIFIED');
    expect(spanOf(r, 'PHP 8.3').status).toBe('VERIFIED');
  });
});
