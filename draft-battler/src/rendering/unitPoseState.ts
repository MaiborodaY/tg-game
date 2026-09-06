export type UnitPose = "idle" | "walkA" | "walkB" | "attack" | "dead";

export class UnitPoseState {
  private dead = false;
  private readonly preserveDeathPose: boolean;

  constructor(preserveDeathPose = false) {
    this.preserveDeathPose = preserveDeathPose;
  }

  accept(pose: UnitPose): boolean {
    // Combat results can kill a unit before its pending attack/walk callback restores idle.
    if (this.preserveDeathPose && this.dead && pose !== "dead") {
      return false;
    }
    if (pose === "dead") {
      this.dead = true;
    }
    return true;
  }
}
