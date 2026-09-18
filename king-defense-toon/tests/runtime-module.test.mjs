import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { loadRuntimeModule } from '../scripts/runtime-module.mjs';

test('CLI loaders prefer current TS modules and retain historical JS checkout support', async t => {
  const temporaryRoot = path.resolve(os.tmpdir());
  const fixture = await mkdtemp(path.join(temporaryRoot, 'brotd-runtime-module-'));
  t.after(async () => {
    const target = path.resolve(fixture);
    assert.ok(target.startsWith(`${temporaryRoot}${path.sep}`) && path.basename(target).startsWith('brotd-runtime-module-'));
    await rm(target, { recursive: true, force: true });
  });
  await writeFile(path.join(fixture, 'package.json'), '{"type":"module"}');
  await writeFile(path.join(fixture, 'current.ts'), 'export const version: string = "typed";');
  await writeFile(path.join(fixture, 'current.mjs'), 'throw new Error("stale bridge must not be loaded");');
  await writeFile(path.join(fixture, 'historical.mjs'), 'export const version = "legacy";');
  assert.equal((await loadRuntimeModule(fixture, 'current')).version, 'typed');
  assert.equal((await loadRuntimeModule(fixture, 'historical')).version, 'legacy');
  await assert.rejects(loadRuntimeModule(fixture, 'missing'), { code: 'ERR_MODULE_NOT_FOUND' });
});
