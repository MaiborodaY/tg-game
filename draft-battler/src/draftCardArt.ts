import type { CardId } from "./game";
import { getCardArtBounds } from "./cardArtBounds";

const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

/** Fit the visible character, not the transparent portrait canvas. The source stays unchanged. */
export function createDraftCardSilhouette(cardId: CardId, label: string, assetPath: string): SVGSVGElement {
  const bounds = getCardArtBounds(cardId);
  const viewport = document.createElementNS(SVG_NAMESPACE, "svg");
  viewport.classList.add("unit-card__sprite", "unit-card__silhouette");
  viewport.setAttribute("viewBox", `${bounds.left} ${bounds.top} ${bounds.width} ${bounds.height}`);
  viewport.setAttribute("preserveAspectRatio", "xMidYMid meet");
  viewport.setAttribute("role", "img");
  viewport.setAttribute("aria-label", label);
  viewport.setAttribute("focusable", "false");

  const image = document.createElementNS(SVG_NAMESPACE, "image");
  image.setAttribute("href", assetPath);
  image.setAttribute("width", String(bounds.sourceWidth));
  image.setAttribute("height", String(bounds.sourceHeight));
  image.setAttribute("aria-hidden", "true");
  viewport.append(image);
  return viewport;
}
