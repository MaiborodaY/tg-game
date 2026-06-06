type Env = {
  WORK_BOT_API_BASE_URL?: string;
};

type PagesContext = {
  request: Request;
  env: Env;
};

const ALLOWED_ENDPOINTS = new Set(["/start", "/finish"]);

export async function onRequest(context: PagesContext): Promise<Response> {
  const baseUrl = normalizeBaseUrl(context.env.WORK_BOT_API_BASE_URL || "");
  if (!baseUrl) {
    return json({ ok: false, error: "farm_paws_api_base_missing" }, 503);
  }

  const incomingUrl = new URL(context.request.url);
  const endpoint = incomingUrl.pathname.replace(/^\/api\/farm-paws/, "") || "/";
  if (!ALLOWED_ENDPOINTS.has(endpoint)) {
    return json({ ok: false, error: "not_found" }, 404);
  }

  const targetUrl = new URL(`${baseUrl}/api/farm-paws${endpoint}${incomingUrl.search}`);
  const headers = new Headers(context.request.headers);
  headers.delete("host");

  return fetch(new Request(targetUrl.toString(), {
    method: context.request.method,
    headers,
    body: hasRequestBody(context.request.method) ? context.request.body : null,
    redirect: "manual"
  }));
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

function hasRequestBody(method: string): boolean {
  return method !== "GET" && method !== "HEAD";
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
