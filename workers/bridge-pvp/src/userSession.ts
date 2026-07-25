import { DurableObject } from "cloudflare:workers";

import type { HumanBridgeSeat } from "./protocol";

export interface BridgeUserSessionRecord {
  roomCode: string;
  seat: HumanBridgeSeat;
  expiresAt: number;
  updatedAt: number;
}

export interface ClaimBridgeUserSessionResult {
  claimed: boolean;
  session: BridgeUserSessionRecord;
}

const USER_SESSION_STORAGE_KEY = "session:v1";

export class BridgeUserSession extends DurableObject<Record<string, never>> {
  async getSession(now = Date.now()): Promise<BridgeUserSessionRecord | undefined> {
    const session = await this.ctx.storage.get<BridgeUserSessionRecord>(USER_SESSION_STORAGE_KEY);
    if (!session) {
      return undefined;
    }

    if (session.expiresAt <= now) {
      await this.ctx.storage.delete(USER_SESSION_STORAGE_KEY);
      return undefined;
    }

    return session;
  }

  async claimSession(session: BridgeUserSessionRecord): Promise<ClaimBridgeUserSessionResult> {
    const current = await this.getSession();
    if (current && (current.roomCode !== session.roomCode || current.seat !== session.seat)) {
      return { claimed: false, session: current };
    }

    await this.ctx.storage.put(USER_SESSION_STORAGE_KEY, session);
    return { claimed: true, session };
  }

  async clearSession(roomCode?: string): Promise<void> {
    const current = await this.ctx.storage.get<BridgeUserSessionRecord>(USER_SESSION_STORAGE_KEY);
    if (!current || (roomCode && current.roomCode !== roomCode)) {
      return;
    }

    await this.ctx.storage.delete(USER_SESSION_STORAGE_KEY);
  }
}
