import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../src/build.ts';
import { HARNESS_SPECS } from '../src/harnesses.ts';
import { doctor, install, uninstall, update } from '../src/install.ts';

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
      result.manifest.budgets.always_on.tokens <= 400,
      `always_on tokens ${result.manifest.budgets.always_on.tokens} exceeded 400`,
    );
    assert.equal(result.manifest.budgets.skill_body.status, 'ok');
    assert.equal(result.manifest.budgets.references.status, 'ok');
  }
});

test('always-on block and skill body carry Ponytail surgical diff and +62 terse rules', () => {
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
  assert.match(alwaysOn.content, /Ponytail/i);
  assert.match(alwaysOn.content, /surgical diffs/i);
  assert.match(skillBody.content, /Surgical Diffs Over Full-File Dumps/);
  assert.match(skillBody.content, /Zero Ceremonial Boilerplate/);
  assert.match(skillBody.content, /Strict Completeness/);
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
