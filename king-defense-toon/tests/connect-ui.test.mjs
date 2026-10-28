import assert from 'node:assert/strict';
import test from 'node:test';
import { renderConnectPanel } from '../connect-ui.ts';

function view(overrides = {}) {
  return { recipient: { id: 1, type: 'swordsman', level: 4 }, location: 'army', sourceTab: 'reserve',
    donors: [], selectedIds: new Set(), selectedCount: 0, addedLevels: 0, previewLevel: 4,
    hp: '69', effect: '6.9', effectLabel: 'Attack', message: 'Choose matching fighters.', canApply: false,
    art: () => undefined, ...overrides };
}

test('Connect renders recipient-first preview, exact identity and selection across both source tabs', () => {
  const donor = Object.freeze({ id: 2, type: 'swordsman', level: 3 });
  const input = Object.freeze(view({ donors: Object.freeze([donor]), selectedIds: new Set([2, 7]),
    selectedCount: 2, addedLevels: 8, previewLevel: 12, hp: '69 → 93', effect: '6.9 → 9.3', canApply: true }));
  const html = renderConnectPanel(input);
  assert.match(html, /data-connect-recipient-id="1" data-connect-recipient-location="army"/);
  assert.match(html, /data-connect-preview-level="12"/);
  assert.match(html, /aria-label="Level 4 to level 12"/);
  assert.ok(html.indexOf('connect-recipient') < html.indexOf('connect-tabs'));
  assert.match(html, /data-connect-location="reserve" aria-pressed="true"/);
  assert.match(html, /data-connect-location="army" aria-pressed="false"/);
  assert.match(html, /data-connect-donor-id="2" aria-pressed="true"/);
  assert.match(html, /2 selected across Army &amp; Barracks/);
  const apply = html.match(/<button[^>]+data-connect-action="apply"[^>]*>/)[0];
  assert.doesNotMatch(apply, /disabled/);
  assert.match(html, /Connect · \+8 Lv/);
  assert.equal(input.recipient.level, 4);
  assert.equal(donor.level, 3);
  assert.deepEqual([...input.selectedIds], [2, 7]);
});

test('empty and invalid donor sets do not expose self or a different unit type', () => {
  const html = renderConnectPanel(view({ sourceTab: 'army', location: 'reserve',
    donors: [{ id: 1, type: 'swordsman', level: 4 }, { id: 2, type: 'archer', level: 9 }] }));
  assert.doesNotMatch(html, /data-connect-donor-id/);
  assert.match(html, /No other Swordsman in your Army/);
  assert.match(html, /data-connect-action="apply" disabled/);
  assert.match(html, /data-connect-action="cancel">Cancel/);
  assert.match(html, /data-connect-recipient-location="reserve"/);
  assert.doesNotMatch(html, /src="undefined"/);
});

test('huge levels keep exact accessible values and supplied strings cannot become markup', () => {
  const level = Number.MAX_SAFE_INTEGER;
  const html = renderConnectPanel(view({ recipient: { id: 1, type: 'healer', level: level - 1 },
    donors: [{ id: 2, type: 'healer', level: 1 }], selectedIds: new Set([2]),
    selectedCount: 1, addedLevels: 1, previewLevel: level, canApply: true,
    hp: '<200>', effect: '1 & 2', effectLabel: 'Heal "power"', message: '<script>alert(1)</script>',
    art: () => '/portrait.png?name=" onerror="alert(1)' }));
  assert.match(html, new RegExp(`data-connect-preview-level="${level}"`));
  assert.ok(html.includes(`aria-label="Level ${level - 1} to level ${level}"`));
  assert.ok(html.includes(`title="Lv. ${level - 1} → Lv. ${level}"`));
  assert.match(html, /aria-label="Healer, level 1"/);
  assert.match(html, /&lt;200&gt;/);
  assert.match(html, /1 &amp; 2/);
  assert.match(html, /Heal &quot;power&quot;/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /src="\/portrait.png\?name=&quot; onerror=&quot;alert\(1\)"/);
  assert.doesNotMatch(html, /<script>| onerror="/);
});

test('inline connections omit source tabs and the duplicate recipient and hide Apply until selection', () => {
  const html = renderConnectPanel(view({ inline: true, donors: [
    { id: 2, type: 'swordsman', level: 3 }, { id: 3, type: 'archer', level: 7 },
  ] }));
  assert.match(html, /Available connections/);
  assert.match(html, /data-connect-action="select-all" aria-label="Select all matching fighters in Barracks"/);
  assert.match(html, /data-connect-donor-id="2"/);
  assert.doesNotMatch(html, /data-connect-donor-id="3"|class="connect-recipient"|data-connect-action="apply"|data-connect-preview-level/);
  assert.doesNotMatch(html, /connect-tabs|data-connect-location|Choose fighters from/);
  const empty = renderConnectPanel(view({ inline: true }));
  assert.match(empty, /data-connect-action="select-all" disabled/);
  assert.match(empty, /No other Swordsman in Barracks/);
});

test('inline selection shows the preview, Clear and one atomic Connect action', () => {
  const html = renderConnectPanel(view({ inline: true, selectedCount: 2, selectedIds: new Set([2, 3]),
    addedLevels: 5, previewLevel: 9, hp: '69 → 84', effect: '6.9 → 8.4', canApply: true,
    donors: [{ id: 2, type: 'swordsman', level: 2 }, { id: 3, type: 'swordsman', level: 3 }] }));
  assert.match(html, /data-connect-preview-level="9"/);
  assert.match(html, /HP.*69 → 84/);
  assert.match(html, /data-connect-action="cancel">Clear/);
  assert.match(html, /Connect · \+5 Lv/);
  assert.match(html, /2 selected from Barracks/);
  assert.doesNotMatch(html, /across Army|data-connect-location/);
  assert.doesNotMatch(html, /data-connect-action="apply" disabled/);
});
