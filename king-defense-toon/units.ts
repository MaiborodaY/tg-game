export type UnitType = 'swordsman' | 'archer' | 'healer' | 'lancer';

export interface UnitDefinition {
  readonly id: UnitType;
  readonly name: string;
  readonly cost: number;
  readonly hp: number;
  readonly damage: number;
  readonly heal?: number;
  readonly role: string;
  readonly color: string;
  readonly description: string;
  readonly spriteColumn: number;
}

export const UNIT_TYPES: readonly UnitDefinition[] = Object.freeze([
  Object.freeze({
    id: 'swordsman',
    name: 'Swordsman',
    cost: 25,
    hp: 60,
    damage: 6,
    role: 'Defender',
    color: '#5b91cf',
    description: 'Advances into melee and holds the front line.',
    spriteColumn: 0,
  }),
  Object.freeze({
    id: 'archer',
    name: 'Archer',
    cost: 35,
    hp: 32,
    damage: 8,
    role: 'Ranged',
    color: '#68a05c',
    description: 'Moves into bow range behind your defenders.',
    spriteColumn: 1,
  }),
  Object.freeze({
    id: 'healer',
    name: 'Healer',
    cost: 40,
    hp: 36,
    damage: 0,
    heal: 4,
    role: 'Support',
    color: '#dbb44e',
    description: 'Follows and heals your guard and hero. Cannot heal the castle.',
    spriteColumn: 2,
  }),
  Object.freeze({
    id: 'lancer',
    name: 'Lancer',
    cost: 0,
    hp: 48,
    damage: 7,
    role: 'Reach',
    color: '#5b91cf',
    description: 'Strikes one enemy from behind your front line. Less durable than a swordsman.',
    spriteColumn: 3,
  }),
]);

// The lookup is built from the complete unit catalogue above, with one entry per ID.
export const UNIT_TYPE_BY_ID = Object.freeze(
  Object.fromEntries(UNIT_TYPES.map((unit) => [unit.id, unit])),
) as Readonly<Record<UnitType, UnitDefinition>>;
