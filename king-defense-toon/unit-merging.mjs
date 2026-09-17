import { RECRUIT_LEVEL_CAP } from './recruitment.mjs';
import { UNIT_TYPE_BY_ID } from './units.mjs';

const isId = value => Number.isSafeInteger(value) && value > 0;
const isFighter = fighter => fighter && typeof fighter === 'object'
  && isId(fighter.id) && typeof fighter.type === 'string'
  && Object.hasOwn(UNIT_TYPE_BY_ID, fighter.type)
  && Number.isInteger(fighter.level) && fighter.level >= 1 && fighter.level <= RECRUIT_LEVEL_CAP;

export function getMergeResult(units, reserve, source, targetId) {
  const fail = reason => ({ ok: false, reason, units, reserve });
  if (!Array.isArray(units) || !Array.isArray(reserve)) return fail('invalid-state');
  const fighters = [...units, ...reserve];
  if (!fighters.every(isFighter) || new Set(fighters.map(fighter => fighter.id)).size !== fighters.length) {
    return fail('invalid-state');
  }
  if (!source || !['army', 'reserve'].includes(source.location) || !isId(source.id)) {
    return fail('invalid-source');
  }
  const sourceFighter = (source.location === 'army' ? units : reserve).find(fighter => fighter.id === source.id);
  if (!sourceFighter) return fail('source-missing');
  if (!isId(targetId)) return fail('target-missing');
  const target = units.find(fighter => fighter.id === targetId);
  if (!target) return fail('target-missing');
  if (sourceFighter.id === target.id) return fail('same-unit');
  if (sourceFighter.type !== target.type) return fail('different-type');
  const level = sourceFighter.level + target.level;
  // Reject overflow instead of consuming a fighter while silently discarding earned levels.
  if (level > RECRUIT_LEVEL_CAP) return fail('level-cap');

  const mergedTarget = { ...target, level };
  return {
    ok: true,
    reason: null,
    units: units.filter(fighter => source.location !== 'army' || fighter.id !== sourceFighter.id)
      .map(fighter => fighter.id === target.id ? mergedTarget : { ...fighter }),
    reserve: reserve.filter(fighter => source.location !== 'reserve' || fighter.id !== sourceFighter.id)
      .map(fighter => ({ ...fighter })),
    source: sourceFighter,
    target: mergedTarget,
  };
}
