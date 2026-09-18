import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { byId } from '../main-dom.ts';

test('typed game IDs match the actual HTML tags and every static main lookup exists', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const tags = new Map([...html.matchAll(/<([a-z][a-z0-9]*)\b[^>]*\sid="([^"]+)"/g)]
    .filter(([, tag]) => tag !== 'svg').map(([, tag, id]) => [id, tag]));
  const text = fs.readFileSync(new URL('../main-dom.ts', import.meta.url), 'utf8');
  const source = ts.createSourceFile('main-dom.ts', text, ts.ScriptTarget.Latest, true);
  const contract = source.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === 'GameElementTags');
  const typed = new Map(contract.members.map(member => [member.name.text, member.type.literal.text]));
  assert.deepEqual(typed, tags);
  const main = fs.readFileSync(new URL('../main.ts', import.meta.url), 'utf8');
  for (const [, id] of main.matchAll(/\bbyId\('([^']+)'\)/g)) assert.ok(tags.has(id), `Missing ${id}`);
});

test('DOM lookup returns the owned element and reports an absent template node', t => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const canvas = { id: 'battle' };
  Object.defineProperty(globalThis, 'document', { configurable: true,
    value: { getElementById: id => id === 'battle' ? canvas : null } });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else delete globalThis.document;
  });
  assert.equal(byId('battle'), canvas);
  assert.throws(() => byId('army-map'), /Missing game element: army-map/);
});
