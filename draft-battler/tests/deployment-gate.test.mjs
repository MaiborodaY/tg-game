import assert from "node:assert/strict";
import test from "node:test";
import { verifyDeployment } from "../scripts/verify-solo-deployment.mjs";

test("deployment gate accepts a PvP-enabled health flag and the app shell", async () => {
  const requestedPaths = [];
  const request = async (input, init) => {
    const url = new URL(input);
    requestedPaths.push(url.pathname);

    if (url.pathname === "/health") {
      return jsonResponse(200, {
        ok: true,
        pvpEnabled: true,
        rulesetVersion: "draft-battler-pvp-v4",
      });
    }

    if (url.pathname === "/api/pvp/rooms") {
      assert.equal(init?.method, "POST");
      assert.equal(init?.headers?.origin, "https://draft.example");
      assert.equal(init?.body, "{}");
      return jsonResponse(200, {
        ok: true,
        roomId: "ABC123",
        seat: "host",
        seatToken: "seat-token",
        socketTicket: "socket-ticket",
        snapshot: { rulesetVersion: "draft-battler-pvp-v4" },
      });
    }

    return url.pathname === "/"
      ? textResponse(200, '<div id="app"></div>')
      : textResponse(200, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  };

  await verifyDeployment("https://draft.example", request);
  assert.deepEqual(requestedPaths, [
    "/health",
    "/",
    "/assets/ui/cards/frames/card-frame-common.svg",
    "/api/pvp/rooms",
  ]);
});

test("deployment gate rejects a disabled PvP health flag", async () => {
  const request = async () => jsonResponse(200, {
    ok: true,
    pvpEnabled: false,
    rulesetVersion: "draft-battler-pvp-v4",
  });

  await assert.rejects(
    verifyDeployment("https://draft.example", request),
    /does not report pvpEnabled=true/,
  );
});

test("deployment gate rejects a stale PvP ruleset", async () => {
  const request = async () => jsonResponse(200, {
    ok: true,
    pvpEnabled: true,
    rulesetVersion: "stale-rules",
  });

  await assert.rejects(
    verifyDeployment("https://draft.example", request),
    /unsupported ruleset/,
  );
});

test("deployment gate rejects a missing app shell", async () => {
  const request = async (input) => {
    const url = new URL(input);
    if (url.pathname === "/health") {
      return jsonResponse(200, {
        ok: true,
        pvpEnabled: true,
        rulesetVersion: "draft-battler-pvp-v4",
      });
    }
    return textResponse(503, "unavailable");
  };

  await assert.rejects(
    verifyDeployment("https://draft.example", request),
    /homepage is not serving the app shell/,
  );
});

test("deployment gate rejects a room creation failure", async () => {
  const request = async (input) => {
    const url = new URL(input);
    if (url.pathname === "/health") {
      return jsonResponse(200, {
        ok: true,
        pvpEnabled: true,
        rulesetVersion: "draft-battler-pvp-v4",
      });
    }
    if (url.pathname === "/") {
      return textResponse(200, '<div id="app"></div>');
    }
    if (url.pathname.includes("card-frame-common.svg")) {
      return textResponse(200, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    }
    return jsonResponse(503, { ok: false, code: "internal_error" });
  };

  await assert.rejects(
    verifyDeployment("https://draft.example", request),
    /room creation smoke failed/,
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
