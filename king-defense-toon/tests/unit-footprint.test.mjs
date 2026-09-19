import assert from 'node:assert/strict';
import test from 'node:test';
import { FIELD, positionForCell } from '../field.ts';
import { UNIT_TYPES } from '../units.ts';
import { canPlaceUnit, getUnitAtCell, getUnitCells, getUnitCellWidth, getUnitCellHeight,
  getUnitCellCount, getUnitPosition, planFormationMove, reconcileUnitFootprints } from '../unit-footprint.ts';
const allCells = Array.from({ length: FIELD.rows }, (_, row) =>
  Array.from({ length: FIELD.columns }, (_, col) => `${col}:${row}`)).flat();
const fighter = (id, type, col, row = 0, level = 1) => ({ id, type, col, row, level });
const rider = (id, col, row = 0, level = 1) => fighter(id, 'pantherRider', col, row, level);
const guard = (id, col, row = 0) => fighter(id, 'swordsman', col, row);

test('rider uses vertical cells, unicorn stays horizontal and edges are never clipped', () => {
  for (const { id: type } of UNIT_TYPES) {
    assert.equal(getUnitCellWidth(type), type === 'unicorn' ? 2 : 1);
    assert.equal(getUnitCellHeight(type), type === 'pantherRider' ? 2 : 1);
    assert.equal(getUnitCellCount(type), ['pantherRider','unicorn'].includes(type) ? 2 : 1);
    assert.deepEqual(getUnitCells({type,col:2,row:1}), type === 'pantherRider' ? ['2:1','2:2']
      : type === 'unicorn' ? ['2:1','3:1'] : ['2:1']);
  }
  assert.deepEqual(getUnitCells(rider(1,4,2)), ['4:2','4:3']);
  assert.deepEqual(getUnitCells(rider(1,-1)), ['-1:0','-1:1']);
});

test('both vertical cells select the rider and position is centered vertically', () => {
  const unit=rider(1,1,1), footman=guard(2,3,1), army=[unit,footman];
  assert.strictEqual(getUnitAtCell(army,1,1),unit);
  assert.strictEqual(getUnitAtCell(army,1,2),unit);
  assert.strictEqual(getUnitAtCell(army,3,1),footman);
  for(const [col,row] of [[0,1],[2,1],[1,0],[5,1],[1.5,1],[1,3]]) assert.equal(getUnitAtCell(army,col,row),undefined);
  assert.deepEqual(getUnitPosition(footman),positionForCell(3,1));
  assert.deepEqual(getUnitPosition(unit),{x:positionForCell(1,1).x,y:positionForCell(1,1).y+FIELD.cellHeight/2});
});

test('placement requires both unlocked cells, integer bounds and a known unit', () => {
  assert.equal(canPlaceUnit(rider(1,4,1),[],allCells),true);
  assert.equal(canPlaceUnit(guard(1,4,2),[],allCells),true);
  for(const cell of ['1:1','1:2']) assert.equal(canPlaceUnit(rider(1,1,1),[],allCells.filter(c=>c!==cell)),false);
  for(const [col,row] of [[0,2],[5,0],[-1,0],[0,-1],[0,3],[.5,0],[0,.5],[NaN,0],[Infinity,0],['1',0]])
    assert.equal(canPlaceUnit(rider(1,col,row),[],allCells),false,`${col}:${row}`);
  for(const type of ['missing','toString']) assert.equal(canPlaceUnit({type,col:0,row:0},[],allCells),false);
});

test('overlap checks both cells and ignores only explicitly identified units', () => {
  const unit=rider(1,1);
  for(const other of [guard(2,1),guard(2,1,1),rider(2,1,1)]) assert.equal(canPlaceUnit(other,[unit],allCells),false);
  assert.equal(canPlaceUnit(rider(2,2),[unit],allCells),true);
  assert.equal(canPlaceUnit(rider(1,1,1),[unit],allCells,[1]),true);
  assert.equal(canPlaceUnit(rider(1,1,1),[unit],allCells,['1']),false);
  assert.equal(canPlaceUnit(rider(1,1,1),[unit,{type:'healer',col:1,row:2}],allCells,[1]),false);
});

test('moving over own second cell requires the new complete vertical footprint', () => {
  const army=[rider(1,0,0,37),guard(2,4,2)],before=structuredClone(army);
  const moved=planFormationMove(army,1,0,1,allCells);
  assert.equal(moved.ok,true); assert.deepEqual(moved.units,[{...army[0],row:1},army[1]]);
  assert.deepEqual(army,before); moved.units.forEach((u,i)=>assert.notStrictEqual(u,army[i]));
  assert.equal(planFormationMove(army,1,0,1,allCells.filter(c=>c!=='0:2')).ok,false);
  assert.equal(planFormationMove(army,1,0,2,allCells).ok,false);
  assert.equal(planFormationMove(army,1,0,0,allCells).ok,true);
});

test('ordinary, vertical and horizontal swaps preserve identity, levels and extra fields', () => {
  for(const first of ['swordsman','pantherRider','unicorn']) for(const second of ['swordsman','pantherRider','unicorn']) {
    const army=[{...fighter('source',first,0,0,137),tag:'retained'},fighter('target',second,3,0,54)],before=structuredClone(army);
    const moved=planFormationMove(army,'source',3,0,allCells);
    assert.equal(moved.ok,true,`${first}/${second}`);
    assert.deepEqual(moved.units,[{...army[0],col:3},{...army[1],col:0}]); assert.deepEqual(army,before);
  }
  const army=[guard(1,0),rider(2,3)];
  assert.deepEqual(planFormationMove(army,1,3,1,allCells).units,[{...army[0],col:3,row:1},{...army[1],col:0}]);
});

test('invalid moves and incomplete swaps leave the formation unchanged', () => {
  const cases=[
    {army:[rider(1,0),guard(2,2),guard(3,2,1)],col:2},
    {army:[guard(1,4,2),rider(2,0)],col:0},
    {army:[guard(1,0),guard(3,0,1),rider(2,3)],col:3},
    {army:[rider(1,0),guard(2,3)],col:3,owned:allCells.filter(c=>c!=='3:1')},
    {army:[rider(1,0)],col:2.5},{army:[rider(1,0)],col:NaN},{army:[rider(1,0)],col:2,id:99},
    {army:[guard(1,0),guard(1,3)],col:2},
  ];
  for(const {army,col,id=1,owned=allCells} of cases) {
    const before=structuredClone(army),moved=planFormationMove(army,id,col,0,owned);
    assert.equal(moved.ok,false,JSON.stringify(before)); assert.deepEqual(moved.units,before);
    assert.deepEqual(army,before); assert.notStrictEqual(moved.units,army);
  }
});

test('reconciliation preserves ordinary anchors and returns conflicting, locked or edge riders intact', () => {
  const army=[rider(7,1,0,135),guard(8,1,1),rider(9,3,1,80),rider(10,0,2,501),rider(11,3,0,102),rider(12,4,0,52)];
  const reserve=[{id:20,type:'healer',level:6}],owned=allCells.filter(c=>c!=='4:1'),before=structuredClone({army,reserve});
  const result=reconcileUnitFootprints(army,reserve,owned);
  assert.deepEqual(result.units,[army[1],army[2]]);
  assert.deepEqual(result.reserve,[reserve[0],...[army[0],army[3],army[4],army[5]].map(({col,row,...u})=>u)]);
  assert.equal(result.movedCount,4); assert.deepEqual({army,reserve},before);
  assert.notStrictEqual(result.reserve[0],reserve[0]);
  assert.equal(new Set([...result.units,...result.reserve].map(u=>u.id)).size,army.length+reserve.length);
  assert.deepEqual(reconcileUnitFootprints(result.units,result.reserve,owned),{...result,movedCount:0});
});
