import assert from "node:assert/strict";
import test from "node:test";
import { verifySoloDeployment } from "../scripts/verify-solo-deployment.mjs";

test("deployment gate accepts only a disabled health flag and fail-closed room route", async () => {
  const requestedPaths = [];
  const request = async (input) => {
    const url = new URL(input);
    requestedPaths.push(url.pathname);

    if (url.pathname === "/health") {
      return jsonResponse(200, { ok: true, pvpEnabled: false });
    }

    if (url.pathname === "/api/pvp/rooms/release-policy-smoke") {
      return jsonResponse(404, { ok: false, code: "pvp_disabled" });
    }

    return url.pathname === "/"
      ? textResponse(200, '<div id="app"></div>')
      : textResponse(200, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  };

  await verifySoloDeployment("https://draft.example", request);
  assert.deepEqual(requestedPaths, [
    "/health",
    "/api/pvp/rooms/release-policy-smoke",
    "/",
    "/assets/ui/cards/frames/card-frame-common.svg",
  ]);
});

test("deployment gate rejects an enabled PvP health flag", async () => {
  const request = async () => jsonResponse(200, { ok: true, pvpEnabled: true });

  await assert.rejects(
    verifySoloDeployment("https://draft.example", request),
    /does not report pvpEnabled=false/,
  );
});

test("deployment gate rejects a room route that reaches the PvP service", async () => {
  const request = async (input) => {
    const url = new URL(input);
    return url.pathname === "/health"
      ? jsonResponse(200, { ok: true, pvpEnabled: false })
      : jsonResponse(200, { ok: true });
  };

  await assert.rejects(
    verifySoloDeployment("https://draft.example", request),
    /room route is not fail-closed/,
  );
});

test("deployment gate rejects a missing app shell", async () => {
  const request = async (input) => {
    const url = new URL(input);
    if (url.pathname === "/health") {
      return jsonResponse(200, { ok: true, pvpEnabled: false });
    }
    if (url.pathname === "/api/pvp/rooms/release-policy-smoke") {
      return jsonResponse(404, { ok: false, code: "pvp_disabled" });
    }
    return textResponse(503, "unavailable");
  };

  await assert.rejects(
    verifySoloDeployment("https://draft.example", request),
    /homepage is not serving the app shell/,
  );
});

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}

function textResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return JSON.parse(body);
    },
    async text() {
      return body;
    },
  };
}
