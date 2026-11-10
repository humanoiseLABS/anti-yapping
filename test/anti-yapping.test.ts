import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../src/build.ts';
import { buildCodeGraph } from '../src/graph.ts';
import { HARNESS_SPECS } from '../src/harnesses.ts';
import { doctor, install, uninstall, update, setupAgentIgnore } from '../src/install.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('anti-yapping builds within strict token budgets with zero warnings', () => {
  for (const profileId of ['anti-yapping', 'terse-id']) {
    const result = build({
      root,
      profileId,
      adapterId: 'claude-code',
      release: true,
      write: false,
    });
    assert.equal(result.warnings.length, 0, `unexpected warnings: ${result.warnings.join(', ')}`);
    assert.equal(result.manifest.budgets.always_on.status, 'ok');
    assert.ok(
      result.manifest.budgets.always_on.tokens <= 580,
      `always_on tokens ${result.manifest.budgets.always_on.tokens} exceeded 580`,
    );
    assert.equal(result.manifest.budgets.skill_body.status, 'ok');
    assert.equal(result.manifest.budgets.references.status, 'ok');
  }
});

test('always-on block and skill body carry surgical diff and +62 terse rules', () => {
  const result = build({
    root,
    profileId: 'anti-yapping',
    adapterId: 'claude-code',
    write: false,
  });
  const alwaysOn = result.artifacts.find((a) => a.kind === 'always_on');
  const skillBody = result.artifacts.find((a) => a.kind === 'skill_body');
  assert.ok(alwaysOn, 'missing always_on artifact');
  assert.ok(skillBody, 'missing skill_body artifact');

  assert.match(alwaysOn.content, /lu\/gw/);
  assert.match(alwaysOn.content, /surgical diffs/i);
  assert.match(alwaysOn.content, /Hemat input token/i);
  assert.match(skillBody.content, /Surgical Diffs Over File Dumps/);
  assert.match(skillBody.content, /Zero Ceremonial Boilerplate/);
  assert.match(skillBody.content, /Strict Completeness/);
  assert.match(skillBody.content, /Surgical Tool Discipline/i);
  assert.match(skillBody.content, /Targeted Reading/i);
});

test('every harness adapter installs, passes doctor, updates, and uninstalls cleanly', () => {
  for (const spec of HARNESS_SPECS) {
    const targetRoot = mkdtempSync(join(tmpdir(), `anti-yapping-${spec.id}-`));
    try {
      const installed = install({
        sourceRoot: root,
        targetRoot,
        profileId: 'anti-yapping',
        adapterId: spec.id,
      });
      assert.equal(installed.manifest.profile, 'anti-yapping');
      assert.equal(doctor({ targetRoot }).ok, true, `${spec.id}: doctor failed after install`);

      update({ sourceRoot: root, targetRoot });
      assert.equal(doctor({ targetRoot }).ok, true, `${spec.id}: doctor failed after update`);

      uninstall({ targetRoot });
      assert.equal(
        existsSync(join(targetRoot, '.hahahah/manifest.json')),
        false,
        `${spec.id}: manifest left behind`,
      );
      assert.equal(
        existsSync(join(targetRoot, spec.blockPath)),
        false,
        `${spec.id}: ${spec.blockPath} left behind`,
      );
    } finally {
      rmSync(targetRoot, { recursive: true, force: true });
    }
  }
});

test('setupAgentIgnore generates and appends input token saver ignore rules', () => {
  const target = mkdtempSync(join(tmpdir(), 'anti-yapping-ignore-'));
  try {
    const res1 = setupAgentIgnore(target, 'claude-code');
    assert.equal(res1.created, true);
    assert.equal(existsSync(join(target, '.claudeignore')), true);
    assert.equal(existsSync(join(target, '.agentignore')), true);
    const content = readFileSync(join(target, '.claudeignore'), 'utf8');
    assert.match(content, /node_modules\//);
    assert.match(content, /\*\.keystore/);

    // Idempotent rerun doesn't duplicate
    const res2 = setupAgentIgnore(target, 'claude-code');
    assert.equal(res2.created, false);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});

test('buildCodeGraph generates Obsidian-style INDEX.md with wikilinks, symbols, and persistent memory.md', () => {
  const target = mkdtempSync(join(tmpdir(), 'anti-yapping-graph-'));
  try {
    mkdirSync(join(target, 'src'), { recursive: true });
    writeFileSync(
      join(target, 'src', 'db.ts'),
      'export async function findUser(id: string) {\n  return id;\n}\n',
      'utf8',
    );
    writeFileSync(
      join(target, 'src', 'auth.ts'),
      "import { findUser } from './db.ts';\nexport function loginUser(id: string) {\n  return findUser(id);\n}\n",
      'utf8',
    );
    writeFileSync(
      join(target, 'schema.sql'),
      'CREATE TABLE profiles (id text primary key);\nCREATE VIEW leaderboard AS SELECT id FROM profiles;\n',
      'utf8',
    );

    const res = buildCodeGraph(target);
    assert.equal(res.filesScanned, 3);
    assert.equal(res.nodesEmitted, 3);
    assert.equal(res.edgesCount, 1);

    const indexMd = readFileSync(res.indexPath, 'utf8');
    assert.match(indexMd, /\[\[src\/auth\.ts\]\]/);
    assert.match(indexMd, /➔ \[\[src\/db\.ts\]\]/);
    assert.match(indexMd, /`loginUser`:2/);
    assert.match(indexMd, /table:`profiles`:1/);
    assert.match(indexMd, /view:`leaderboard`:2/);

    // Verify memory.md persists custom user/agent state across graph rebuilds
    writeFileSync(res.memoryPath, '# Custom State\n- P0 patched\n', 'utf8');
    buildCodeGraph(target);
    assert.match(readFileSync(res.memoryPath, 'utf8'), /P0 patched/);
  } finally {
    rmSync(target, { recursive: true, force: true });
  }
});
