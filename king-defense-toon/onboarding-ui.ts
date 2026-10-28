import { FIELD, FORMATION_VIEW } from './field.ts';
import type { GridCell } from './scene-types.ts';

interface GuideTarget {
  element: HTMLElement;
  cell?: GridCell;
  step: string;
  label: string;
}

export function createOnboardingGuide(app: HTMLElement, canvas: HTMLCanvasElement) {
  const guide = document.createElement('div');
  guide.className = 'onboarding-guide';
  guide.hidden = true;
  guide.innerHTML = '<div class="onboarding-ring"></div><div class="onboarding-bubble"><span class="onboarding-copy" role="status" aria-live="polite"></span><svg class="onboarding-arrow" viewBox="0 0 28 28" aria-hidden="true"><path d="M9 2h10v12h7L14 26 2 14h7Z"/></svg></div>';
  app.append(guide);
  const ring = guide.querySelector<HTMLElement>('.onboarding-ring')!;
  const bubble = guide.querySelector<HTMLElement>('.onboarding-bubble')!;
  const copy = guide.querySelector<HTMLElement>('.onboarding-copy')!;
  let target: GuideTarget | null = null;
  let frame = 0;

  function position() {
    frame = 0;
    if (!target || !target.element.isConnected || !target.element.getClientRects().length) {
      guide.hidden = true;
      return;
    }
    const bounds = app.getBoundingClientRect();
    const rect = target.element.getBoundingClientRect();
    const scaleX = bounds.width / app.offsetWidth, scaleY = bounds.height / app.offsetHeight;
    let left = rect.left, top = rect.top, width = rect.width, height = rect.height;
    if (target.cell) {
      // Use the exact Canvas projection, including letterboxing and desktop preview scaling.
      const scale = Number(canvas.dataset.worldScale);
      if (!(scale > 0)) { guide.hidden = true; return; }
      left += Number(canvas.dataset.worldOffsetX) + (FIELD.gridX + target.cell.col * FIELD.cellWidth) * scale;
      top += (rect.height - FORMATION_VIEW.height * scale) / 2 + (FIELD.gridY + target.cell.row * FIELD.cellHeight - FORMATION_VIEW.y) * scale;
      width = FIELD.cellWidth * scale;
      height = FIELD.cellHeight * scale;
    }
    left = (left - bounds.left) / scaleX - app.clientLeft;
    top = (top - bounds.top) / scaleY - app.clientTop;
    width /= scaleX;
    height /= scaleY;
    guide.hidden = false;
    Object.assign(ring.style, { left: `${left}px`, top: `${top}px`, width: `${width}px`, height: `${height}px` });
    const above = top >= bubble.offsetHeight + 8;
    guide.classList.toggle('points-up', !above);
    const center = left + width / 2;
    const bubbleLeft = Math.max(6, Math.min(app.clientWidth - bubble.offsetWidth - 6, center - bubble.offsetWidth / 2));
    bubble.style.left = `${bubbleLeft}px`;
    bubble.style.top = `${above ? top - bubble.offsetHeight - 4 : top + height + 4}px`;
    bubble.style.setProperty('--arrow-x', `${center - bubbleLeft}px`);
  }

  function schedule() {
    if (target && !frame) frame = requestAnimationFrame(position);
  }
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
  observer?.observe(app);
  observer?.observe(canvas);
  window.addEventListener('resize', schedule);
  app.addEventListener('scroll', schedule, true);
  return {
    show(next: GuideTarget) {
      target = next;
      guide.dataset.step = next.step;
      if (copy.textContent !== next.label) copy.textContent = next.label;
      schedule();
    },
    hide() {
      target = null;
      guide.hidden = true;
      delete guide.dataset.step;
      copy.textContent = '';
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', schedule);
      app.removeEventListener('scroll', schedule, true);
      guide.remove();
    },
  };
}
