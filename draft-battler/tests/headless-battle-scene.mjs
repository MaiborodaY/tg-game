import { readFile } from "node:fs/promises";
import { EventEmitter } from "node:events";
import vm from "node:vm";
import ts from "typescript";
import * as game from "../src/game/index.ts";
import * as grounding from "../src/unitArtGrounding.ts";
import * as playback from "../src/rendering/battlePlayback.ts";
import * as armor from "../src/rendering/armorPresentation.ts";
import * as castleAssault from "../src/rendering/castleAssaultPresentation.ts";
import * as fieldLayout from "../src/fieldLayout.ts";
import * as battleLayout from "../src/rendering/battlePresentationLayout.ts";
import * as battleUnitHud from "../src/rendering/battleUnitHud.ts";
import * as backdropLayout from "../src/rendering/backdropLayout.ts";
import { UnitMotionState } from "../src/rendering/unitMotionState.ts";
import { UnitPoseState } from "../src/rendering/unitPoseState.ts";

// Compile the actual scene; only Phaser's DOM-dependent base class is replaced.
const sceneUrl = new URL("../src/rendering/phaserBattleScene.ts", import.meta.url);
export const sceneSource = await readFile(sceneUrl, "utf8");
const parsed = ts.createSourceFile("scene.ts", sceneSource, ts.ScriptTarget.ES2022, true);
const withoutImports = ts.createPrinter().printFile(ts.factory.updateSourceFile(parsed, parsed.statements.filter((node) => !ts.isImportDeclaration(node))));
const compiled = ts.transpileModule(
  withoutImports.replaceAll("import.meta.url", JSON.stringify(sceneUrl.href)) + "\nexport { CastleBattleScene };",
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } },
).outputText;
const context = {
  exports: {}, URL, AbortController: globalThis.AbortController,
  Phaser: {
    Scene: class {
      constructor() {
        const emitter = new EventEmitter();
        const boundListeners = new Map();
        this.scale = {
          width: 390, height: 720,
          on(event, listener, receiver) {
            const bound = listener.bind(receiver);
            boundListeners.set(listener, bound);
            emitter.on(event, bound);
          },
          off(event, listener) { emitter.off(event, boundListeners.get(listener)); boundListeners.delete(listener); },
          emit: (...args) => emitter.emit(...args),
          listenerCount: (event) => emitter.listenerCount(event),
        };
      }
    },
    Scenes: { Events: { SHUTDOWN: "shutdown" } },
    Scale: { Events: { RESIZE: "resize" } },
  },
  ...game, ...grounding, ...playback, ...armor, ...castleAssault, ...fieldLayout, ...battleLayout, ...battleUnitHud, ...backdropLayout,
  UnitMotionState, UnitPoseState,
};
vm.runInNewContext(compiled, context, { filename: "phaserBattleScene.headless.cjs" });
export const HeadlessBattleScene = context.exports.CastleBattleScene;
