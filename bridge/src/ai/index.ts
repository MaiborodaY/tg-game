import type { BridgeAction, ViewerSnapshot } from "../game/index.ts";
import { chooseAiCall } from "./bidding.ts";
import { chooseAiCard } from "./cardPlay.ts";

export * from "./bidding.ts";
export * from "./cardPlay.ts";

export function chooseBotAction(snapshot: ViewerSnapshot): BridgeAction | null {
  if (snapshot.phase === "auction") {
    const call = chooseAiCall(snapshot);
    return call ? Object.freeze({ type: "call", call }) : null;
  }
  if (snapshot.phase === "play") {
    const cardId = chooseAiCard(snapshot);
    return cardId ? Object.freeze({ type: "play_card", cardId }) : null;
  }
  return null;
}
