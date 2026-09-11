import { verifyTelegramInitData } from '../../draft-battler-pvp/src/telegramAuth.ts';
import { freshGame, SLOTS, EPOCHS } from '../../../forest-forge/game.mjs';

const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
});

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (url.pathname !== '/api/save') return json({ error: 'not_found' }, 404);
    if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405);
    if (!env.BOT_TOKEN) return json({ error: 'auth_unavailable' }, 503);
    const auth = await verifyTelegramInitData(request.headers.get('x-telegram-init-data') || '', env.BOT_TOKEN);
    if (!auth.ok) return json({ error: 'telegram_session_expired' }, 401);
    const id = auth.identity.userId;
    try {
      if (request.method === 'GET') {
        let row = await env.SAVES.prepare('SELECT state_json, revision FROM player_saves WHERE telegram_id = ?').bind(id).first();
        if (!row) {
          await env.SAVES.prepare('INSERT OR IGNORE INTO player_saves (telegram_id, state_json, updated_at) VALUES (?, ?, ?)')
            .bind(id, JSON.stringify(freshGame()), Date.now()).run();
          row = await env.SAVES.prepare('SELECT state_json, revision FROM player_saves WHERE telegram_id = ?').bind(id).first();
        }
        return json({ userId: id, state: JSON.parse(row.state_json), revision: row.revision });
      }
      // Bound the snapshot before parsing; a result stack can be much larger than the equipped items.
      if (Number(request.headers.get('content-length')) > 1_000_000) return json({ error: 'save_too_large' }, 413);
      const reader = request.body?.getReader();
      if (!reader) return json({ error: 'invalid_save' }, 400);
      const chunks = []; let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 1_000_000) { await reader.cancel(); return json({ error: 'save_too_large' }, 413); }
        chunks.push(value);
      }
      let payload;
      try { payload = JSON.parse(await new Blob(chunks).text()); }
      catch { return json({ error: 'invalid_save' }, 400); }
      const s = payload?.state;
      // Shape validation only. This PvE snapshot API does not make client combat authoritative.
      if (!Number.isSafeInteger(payload?.revision) || payload.revision < 0 || !s || s.version !== 3 ||
          !['coins', 'hammers', 'level', 'anvilLevel', 'idleSince'].every(k => Number.isFinite(s[k]) && s[k] >= 0) ||
          !s.equipment || !SLOTS.every(slot => Object.hasOwn(s.equipment, slot)) ||
          !Array.isArray(s.mastery) || s.mastery.length !== EPOCHS.length ||
          !Array.isArray(s.results) || !Array.isArray(s.forgingItems)) return json({ error: 'invalid_save' }, 400);
      const row = await env.SAVES.prepare('UPDATE player_saves SET state_json = ?, revision = revision + 1, updated_at = ? WHERE telegram_id = ? AND revision = ? RETURNING revision')
        .bind(JSON.stringify(s), Date.now(), id, payload.revision).first();
      if (!row) return json({ error: 'save_conflict' }, 409);
      return json({ revision: row.revision });
    } catch {
      console.error('Forest Forge save operation failed');
      return json({ error: 'save_unavailable' }, 503);
    }
  },
};
