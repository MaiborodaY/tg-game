/** A one-pixel bleed prevents sampling seams without distorting the original artwork. */
export function getBackdropCoverSize(
  viewportWidth: number,
  viewportHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): { width: number; height: number } {
  if ([viewportWidth, viewportHeight, sourceWidth, sourceHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new RangeError("Backdrop and viewport dimensions must be positive finite numbers.");
  }
  const scale = Math.max((viewportWidth + 2) / sourceWidth, (viewportHeight + 2) / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
}
