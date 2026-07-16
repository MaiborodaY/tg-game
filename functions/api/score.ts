// /functions/api/score.ts
export interface Env {
  BOT_TOKEN: string; // зададите в Pages → Settings → Variables
}

type TelegramGameScoreResponse = {
  ok?: boolean;
  [key: string]: unknown;
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const input = await request.json() as unknown;
    if (!isRecord(input)) return json({ ok:false, error:"Bad payload" }, 400);
    const score = normalizeScore(input.score);
    const payload = normalizePayload(input.payload);

    if (!env.BOT_TOKEN) return json({ ok:false, error:"Missing BOT_TOKEN" }, 400);
    if (score === null || !payload) return json({ ok:false, error:"Bad payload" }, 400);

    const body: Record<string, unknown> = {
      user_id: payload.user_id,
      score,
      disable_edit_message: false,
    };
    if (payload.inline_message_id) {
      body.inline_message_id = payload.inline_message_id;
    } else {
      body.chat_id = payload.chat_id;
      body.message_id = payload.message_id;
    }

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setGameScore`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await tg.json()) as TelegramGameScoreResponse;
    return data?.ok ? json({ ok:true }) : json(data, 400);
  } catch (error: unknown) {
    return json({ ok:false, error:error instanceof Error ? error.message : String(error) }, 400);
  }
};

type NormalizedPayload = {
  user_id: number;
  inline_message_id?: string;
  chat_id?: number | string;
  message_id?: number;
};

function normalizeScore(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() && /^\d+(?:\.\d+)?$/.test(value.trim())
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.min(2_147_483_647, Math.floor(parsed));
}

function normalizePayload(value: unknown): NormalizedPayload | null {
  if (!isRecord(value)) return null;
  const userId = positiveSafeInteger(value.user_id);
  if (userId === null) return null;

  const inlineMessageId = boundedString(value.inline_message_id, 512);
  if (inlineMessageId) {
    return { user_id: userId, inline_message_id: inlineMessageId };
  }

  const chatId = normalizeChatId(value.chat_id);
  const messageId = positiveSafeInteger(value.message_id);
  return chatId !== null && messageId !== null
    ? { user_id: userId, chat_id: chatId, message_id: messageId }
    : null;
}

function positiveSafeInteger(value: unknown): number | null {
  const parsed = typeof value === "number"
    ? value
    : typeof value === "string" && /^\d+$/.test(value.trim())
      ? Number(value)
      : Number.NaN;
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeChatId(value: unknown): number | string | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value !== 0 ? value : null;
  }
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (/^-?\d+$/.test(text)) {
    const parsed = Number(text);
    return Number.isSafeInteger(parsed) && parsed !== 0 ? parsed : null;
  }
  return /^@[A-Za-z\d_]{5,32}$/.test(text) ? text : null;
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text && text.length <= maxLength ? text : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type":"application/json; charset=utf-8" },
  });
}
