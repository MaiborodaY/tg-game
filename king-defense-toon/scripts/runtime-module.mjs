import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Current games use TS directly; --root can still select a historical JS checkout.
export function loadRuntimeModule(sourceRoot, name) {
  const typed = path.join(sourceRoot, `${name}.ts`);
  const file = fs.existsSync(typed) ? typed : path.join(sourceRoot, `${name}.mjs`);
  return import(pathToFileURL(file).href);
}
