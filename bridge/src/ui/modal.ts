const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export function activateModalFocusTrap(root: HTMLElement, onDismiss: () => void): () => void {
  const backdrop = root.querySelector<HTMLElement>("[data-modal-backdrop]");
  const card = backdrop?.querySelector<HTMLElement>("[role='dialog']");
  if (!backdrop || !card) return () => undefined;

  const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const focusable = () => Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  const initial = focusable()[0] ?? card;
  card.setAttribute("tabindex", "-1");
  queueMicrotask(() => initial.focus());

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== "Tab") return;
    const elements = focusable();
    if (elements.length === 0) {
      event.preventDefault();
      card.focus();
      return;
    }
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onBackdropClick = (event: MouseEvent) => {
    if (event.target === backdrop) onDismiss();
  };

  document.addEventListener("keydown", onKeyDown);
  backdrop.addEventListener("click", onBackdropClick);
  return () => {
    document.removeEventListener("keydown", onKeyDown);
    backdrop.removeEventListener("click", onBackdropClick);
    if (previouslyFocused?.isConnected) previouslyFocused.focus();
  };
}
