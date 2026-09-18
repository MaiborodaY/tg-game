import assert from 'node:assert/strict';
import ts from 'typescript';

/** Add a test-only guard before a declaration's body in either raw TS or transformed JS. */
export function prependFunctionBody(source, name, statement) {
  const parsed = ts.createSourceFile('instrumented.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const matches = parsed.statements.filter(node => ts.isFunctionDeclaration(node) && node.name?.text === name && node.body);
  assert.equal(matches.length, 1, `Expected one ${name} implementation for browser instrumentation`);
  const insertion = matches[0].body.getStart(parsed) + 1;
  return `${source.slice(0, insertion)}\n${statement}\n${source.slice(insertion)}`;
}

/** A distinct development URL avoids recursive interception and preserves all other exports. */
export function observedCombatModule(originalUrl) {
  const moduleUrl = JSON.stringify(originalUrl);
  return `export * from ${moduleUrl};
    import { createBattle as createBattleObserved, updateBattle as updateBattleObserved } from ${moduleUrl};
    export function createBattle(...args) { return globalThis.__heroTestBattle = createBattleObserved(...args); }
    export function updateBattle(...args) {
      if (globalThis.__heroTestHold) return [];
      const events = [];
      for (let index = 0; index < (globalThis.__heroTestFast ? 40 : 1); index++) events.push(...updateBattleObserved(...args));
      return events;
    }
  `;
}
