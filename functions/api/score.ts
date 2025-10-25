// /functions/api/score.ts
export interface Env {
  BOT_TOKEN: string; // зададите в Pages → Settings → Variables
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { score, payload } = await request.json<any>();

    const s = Math.max(0, Math.floor(Number(score) || 0));
    if (!env.BOT_TOKEN) return json({ ok:false, error:"Missing BOT_TOKEN" }, 400);
    if (!payload || !payload.user_id || (!payload.inline_message_id && (!payload.chat_id || !payload.message_id))) {
      return json({ ok:false, error:"Bad payload" }, 400);
    }

    const body: Record<string, unknown> = {
      user_id: payload.user_id,
      score: s,
      force: true,
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
    const data = await tg.json();
    return data?.ok ? json({ ok:true }) : json(data, 400);
  } catch (e:any) {
    return json({ ok:false, error:String(e?.message || e) }, 400);
  }
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type":"application/json; charset=utf-8" },
  });
}
