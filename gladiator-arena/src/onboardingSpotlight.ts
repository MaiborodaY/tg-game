export interface OnboardingSpotlightStep {
  id: string;
  label: string;
  target: HTMLElement | null | undefined;
  clickMode?: "target" | "point";
  onActivate?: (event: MouseEvent) => void;
}

export interface OnboardingSpotlightApi {
  sync: (step?: OnboardingSpotlightStep) => void;
  destroy: () => void;
}

const SPOTLIGHT_PADDING = 9;
const SPOTLIGHT_VIEWPORT_PADDING = 12;
const SPOTLIGHT_TOOLTIP_GAP = 12;

interface SpotlightRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function mountOnboardingSpotlight(host: HTMLElement = document.body): OnboardingSpotlightApi {
  const root = document.createElement("div");
  const scrimTop = createScrim("top");
  const scrimLeft = createScrim("left");
  const scrimRight = createScrim("right");
  const scrimBottom = createScrim("bottom");
  const ring = document.createElement("div");
  const tooltip = document.createElement("div");
  const label = document.createElement("span");
  let currentStep: OnboardingSpotlightStep | undefined;
  let frameId: number | undefined;

  root.className = "onboarding-spotlight";
  root.hidden = true;
  root.setAttribute("aria-hidden", "true");
  ring.className = "onboarding-spotlight__ring";
  tooltip.className = "onboarding-spotlight__tooltip";
  label.className = "onboarding-spotlight__label";
  tooltip.append(label);
  root.append(scrimTop, scrimLeft, scrimRight, scrimBottom, ring, tooltip);
  host.append(root);

  root.addEventListener("pointerdown", handleOverlayPointerDown);
  root.addEventListener("click", handleOverlayClick);
  window.addEventListener("resize", scheduleRender);
  window.addEventListener("scroll", scheduleRender, true);

  function sync(step?: OnboardingSpotlightStep): void {
    currentStep = step;
    scheduleRender();
  }

  function scheduleRender(): void {
    if (frameId !== undefined) {
      return;
    }

    frameId = window.requestAnimationFrame(() => {
      frameId = undefined;
      render();
    });
  }

  function render(): void {
    const step = currentStep;
    const target = step?.target;

    if (!step || !target || !isSpotlightTargetVisible(target)) {
      root.hidden = true;
      delete root.dataset.onboardingStep;
      return;
    }

    const rect = getSpotlightRect(target);

    if (rect.width <= 0 || rect.height <= 0) {
      root.hidden = true;
      delete root.dataset.onboardingStep;
      return;
    }

    label.textContent = step.label;
    root.dataset.onboardingStep = step.id;
    root.hidden = false;
    setRootRectVars(rect);
    positionTooltip(rect);
  }

  function handleOverlayPointerDown(event: PointerEvent): void {
    event.stopPropagation();
  }

  function handleOverlayClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const target = currentStep?.target;

    if (!target || !isPointerInsideTarget(event, target) || !isSpotlightTargetVisible(target)) {
      return;
    }

    if (currentStep?.onActivate) {
      currentStep.onActivate(event);
      return;
    }

    if (currentStep?.clickMode === "point") {
      clickElementAtPoint(root, event.clientX, event.clientY);
      return;
    }

    target.click();
  }

  function setRootRectVars(rect: SpotlightRect): void {
    root.style.setProperty("--onboarding-spotlight-x", `${rect.left}px`);
    root.style.setProperty("--onboarding-spotlight-y", `${rect.top}px`);
    root.style.setProperty("--onboarding-spotlight-width", `${rect.width}px`);
    root.style.setProperty("--onboarding-spotlight-height", `${rect.height}px`);
  }

  function positionTooltip(rect: SpotlightRect): void {
    const tooltipRect = tooltip.getBoundingClientRect();
    const tooltipWidth = tooltipRect.width || 160;
    const tooltipHeight = tooltipRect.height || 38;
    const preferredTop = rect.bottom + SPOTLIGHT_TOOLTIP_GAP;
    const fallbackTop = rect.top - tooltipHeight - SPOTLIGHT_TOOLTIP_GAP;
    const fitsBelow = preferredTop + tooltipHeight <= window.innerHeight - SPOTLIGHT_VIEWPORT_PADDING;
    const top = fitsBelow
      ? preferredTop
      : Math.max(SPOTLIGHT_VIEWPORT_PADDING, fallbackTop);
    const left = clamp(
      rect.left + rect.width / 2,
      SPOTLIGHT_VIEWPORT_PADDING + tooltipWidth / 2,
      window.innerWidth - SPOTLIGHT_VIEWPORT_PADDING - tooltipWidth / 2,
    );

    root.classList.toggle("onboarding-spotlight--tooltip-above", !fitsBelow);
    root.style.setProperty("--onboarding-tooltip-left", `${left}px`);
    root.style.setProperty("--onboarding-tooltip-top", `${top}px`);
  }

  return {
    sync,
    destroy() {
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }

      root.removeEventListener("pointerdown", handleOverlayPointerDown);
      root.removeEventListener("click", handleOverlayClick);
      window.removeEventListener("resize", scheduleRender);
      window.removeEventListener("scroll", scheduleRender, true);
      root.remove();
    },
  };
}

function clickElementAtPoint(root: HTMLElement, clientX: number, clientY: number): void {
  root.hidden = true;
  const target = document.elementFromPoint(clientX, clientY);
  root.hidden = false;

  if (target instanceof HTMLElement) {
    target.click();
  }
}

function createScrim(position: string): HTMLDivElement {
  const scrim = document.createElement("div");

  scrim.className = `onboarding-spotlight__scrim onboarding-spotlight__scrim--${position}`;
  return scrim;
}

function getSpotlightRect(target: HTMLElement): SpotlightRect {
  const rect = target.getBoundingClientRect();
  const left = clamp(rect.left - SPOTLIGHT_PADDING, 0, window.innerWidth);
  const top = clamp(rect.top - SPOTLIGHT_PADDING, 0, window.innerHeight);
  const right = clamp(rect.right + SPOTLIGHT_PADDING, 0, window.innerWidth);
  const bottom = clamp(rect.bottom + SPOTLIGHT_PADDING, 0, window.innerHeight);

  return {
    left,
    top,
    right,
    bottom,
    width: right - left,
    height: bottom - top,
  };
}

function isSpotlightTargetVisible(target: HTMLElement): boolean {
  if (!target.isConnected || target.hidden || target.getAttribute("aria-hidden") === "true") {
    return false;
  }

  const rect = target.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < window.innerHeight && rect.left < window.innerWidth;
}

function isPointerInsideTarget(event: MouseEvent | PointerEvent, target: HTMLElement): boolean {
  const rect = target.getBoundingClientRect();

  return event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
