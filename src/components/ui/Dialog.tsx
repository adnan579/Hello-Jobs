import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Visible heading. It also names the dialog for screen readers. */
  title: string;
  /** Small label above the title. */
  eyebrow?: string;
  /** 'center' is a modal card, 'drawer' slides in from the right (full width on phones). */
  variant?: 'center' | 'drawer';
  /** Accessible name for the close button, already translated. */
  closeLabel: string;
  /** Buttons pinned to the bottom so they never sit under the mobile nav bar. */
  footer?: React.ReactNode;
  /** Width of the center variant. */
  size?: 'md' | 'lg';
  children: React.ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal. Moves focus in when it opens, keeps Tab inside, closes on Escape or a
 * backdrop click, locks page scroll and hands focus back to whatever opened it.
 * It sits above the mobile bottom bar (z-50 over z-40) so its actions are never covered.
 */
export const Dialog: React.FC<Props> = ({
  open,
  onClose,
  title,
  eyebrow,
  variant = 'center',
  closeLabel,
  footer,
  size = 'md',
  children,
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const panel = panelRef.current;
    const focusables = () =>
      panel ? Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    // Land on the first control inside the content; fall back to the panel itself.
    (focusables()[0] ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open]);

  if (!open) return null;

  const isDrawer = variant === 'drawer';
  return (
    <div
      className={`fixed inset-0 z-50 flex bg-slate-900/70 ${
        isDrawer ? 'justify-end' : 'items-center justify-center p-3 sm:p-4'
      }`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`flex flex-col bg-white shadow-2xl outline-none ${
          isDrawer
            ? 'h-full w-full max-w-md'
            : `w-full ${size === 'lg' ? 'max-w-2xl' : 'max-w-md'} max-h-[calc(100dvh-1.5rem)] rounded-2xl`
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId} className="text-lg font-extrabold text-slate-900 leading-snug">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label={closeLabel}
            className="btn btn-ghost -mr-2 shrink-0 !min-h-11 !min-w-11 !p-0"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">{children}</div>

        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
