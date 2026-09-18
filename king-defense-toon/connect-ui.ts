import { UNIT_TYPE_BY_ID } from './units.ts';
import type { Fighter } from './unit-merging.ts';

export interface ConnectView {
  inline?: boolean;
  recipient: Fighter;
  location: 'army' | 'reserve';
  sourceTab: 'army' | 'reserve';
  donors: readonly Fighter[];
  selectedIds: ReadonlySet<number>;
  selectedCount: number;
  addedLevels: number;
  previewLevel: number;
  hp: string;
  effect: string;
  effectLabel: string;
  message: string;
  canApply: boolean;
  art: (fighter: Fighter) => string | undefined;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1, useGrouping: false });
const levelText = (level: number): string => level < 10000 ? String(level) : compact.format(level);
const escape = (text: string): string => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');

function portrait(fighter: Fighter, art: ConnectView['art']): string {
  const source = art(fighter);
  return source ? `<img src="${escape(source)}" alt="" draggable="false" />`
    : '<svg class="connect-fallback" viewBox="0 0 32 40" aria-hidden="true"><circle cx="16" cy="11" r="7"/><path d="M5 37v-9c0-8 22-8 22 0v9Z"/></svg>';
}

export function renderConnectPanel(view: ConnectView): string {
  const { recipient, location, sourceTab } = view;
  const name = UNIT_TYPE_BY_ID[recipient.type].name;
  // The counter comes from the complete selection, not only the currently visible tab.
  const selected = `${view.selectedCount} selected across Army & Barracks`;
  const donors = view.donors.filter(fighter => fighter.type === recipient.type && fighter.id !== recipient.id);
  const donorMarkup = donors.map(fighter => {
    const pressed = view.selectedIds.has(fighter.id);
    return `<button class="connect-donor" type="button" data-connect-donor-id="${fighter.id}" aria-pressed="${pressed}"`
      + ` aria-label="${escape(`${name}, level ${fighter.level}`)}" title="${escape(`${name} · Lv. ${fighter.level}`)}">`
      + portrait(fighter, view.art)
      + `<span class="connect-donor-level" aria-hidden="true">Lv. ${levelText(fighter.level)}</span>`
      + `<span class="connect-check" aria-hidden="true">${pressed ? '✓' : ''}</span></button>`;
  }).join('');
  const levelPreview = `<span class="connect-level-preview" aria-label="Level ${recipient.level} to level ${view.previewLevel}" title="Lv. ${recipient.level} → Lv. ${view.previewLevel}">`
    + `<span aria-hidden="true">Lv. ${levelText(recipient.level)} <span class="connect-level-arrow">→</span> </span>`
    + `<b data-connect-preview-level="${view.previewLevel}" aria-hidden="true">${levelText(view.previewLevel)}</b></span>`;
  const stats = `<div class="connect-stats connect-preview-stats"><span><small>HP</small><b>${escape(view.hp)}</b></span>`
    + `<span><small>${escape(view.effectLabel)}</small><b>${escape(view.effect)}</b></span></div>`;
  const selectAll = `<button type="button" data-connect-action="select-all"${donors.length ? '' : ' disabled'} aria-label="Select all matching fighters in ${sourceTab === 'army' ? 'Army' : 'Barracks'}">Select all</button>`;
  return `<section class="connect-panel${view.inline ? ' connect-inline' : ''}" data-connect-recipient-id="${recipient.id}" data-connect-recipient-location="${location}" aria-label="Connect ${escape(name)}">`
    + (view.inline ? `<div class="connect-heading"><h3>Available connections</h3>${selectAll}</div>`
    : `<div class="connect-recipient"><div class="connect-recipient-art">${portrait(recipient, view.art)}</div>`
    + `<div class="connect-recipient-copy"><strong>${escape(name)}</strong>`
    + levelPreview + '</div></div>' + stats)
    + '<div class="connect-tabs" role="group" aria-label="Choose fighters from">'
    + `<button type="button" data-connect-location="reserve" aria-pressed="${sourceTab === 'reserve'}">Barracks</button>`
    + `<button type="button" data-connect-location="army" aria-pressed="${sourceTab === 'army'}">Army</button></div>`
    + `<div class="connect-donor-scroll" tabindex="0" role="group" aria-label="${sourceTab === 'army' ? 'Army' : 'Barracks'} fighters available to connect">`
    + (donors.length ? `<div class="connect-donors">${donorMarkup}</div>`
      : `<p class="connect-empty">No other ${escape(name)} in ${sourceTab === 'army' ? 'your Army' : 'Barracks'}.</p>`)
    + '</div>'
    + (view.inline && view.selectedCount ? `<div class="connect-inline-preview">${levelPreview}${stats}</div>` : '')
    + `<div class="connect-summary" role="status" aria-live="polite">${!view.inline || view.selectedCount ? `<strong>${escape(selected)}</strong>` : ''}`
    + `<p class="connect-message">${escape(view.message)}</p></div>`
    + (view.inline && !view.selectedCount ? '' : '<div class="connect-actions"><button type="button" data-connect-action="cancel">' + (view.inline ? 'Clear' : 'Cancel') + '</button>'
    + `<button type="button" data-connect-action="apply"${view.canApply ? '' : ' disabled'}`
    + ` aria-label="Connect ${view.selectedCount} selected fighters. Add ${view.addedLevels} levels." title="Connect · +${view.addedLevels} Lv">`
    + `Connect · +${levelText(view.addedLevels)} Lv</button></div>`) + '</section>';
}
