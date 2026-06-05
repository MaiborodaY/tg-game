import { MELEE_RANGE, type ActionId } from "./combat";

export interface ActionWheelSlot {
  actionId: ActionId;
  offsetX: number;
  offsetY: number;
  caption: string;
}

const openDistanceSlots: ActionWheelSlot[] = [
  { actionId: "forward", offsetX: 0, offsetY: -96, caption: "Step" },
  { actionId: "back", offsetX: -70, offsetY: -38, caption: "Back" },
  { actionId: "lunge", offsetX: 70, offsetY: -38, caption: "Dash" },
  { actionId: "rest", offsetX: 0, offsetY: 22, caption: "Rest" },
];

const clinchSlots: ActionWheelSlot[] = [
  { actionId: "light", offsetX: 0, offsetY: -98, caption: "Slash" },
  { actionId: "back", offsetX: -74, offsetY: -42, caption: "Back" },
  { actionId: "heavy", offsetX: 74, offsetY: -42, caption: "Bonk" },
  { actionId: "taunt", offsetX: -48, offsetY: 20, caption: "Taunt" },
  { actionId: "rest", offsetX: 48, offsetY: 20, caption: "Rest" },
];

export function getActionWheelSlots(distance: number): ActionWheelSlot[] {
  return distance <= MELEE_RANGE ? clinchSlots : openDistanceSlots;
}