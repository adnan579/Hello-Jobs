import React, { useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  /** Button text when closed, e.g. "More filters". */
  label: string;
  /** Button text when open, e.g. "Fewer filters". Defaults to `label`. */
  openLabel?: string;
  /** Small text shown after the label, e.g. "2 active". */
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** A labelled show/hide section. The button reports its state with aria-expanded. */
export const Disclosure: React.FC<Props> = ({ label, openLabel, hint, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const regionId = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={regionId}
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm -ml-2"
      >
        <span>{open ? openLabel ?? label : label}</span>
        {hint && <span className="badge badge-worker">{hint}</span>}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div id={regionId} hidden={!open} className="mt-2">
        {children}
      </div>
    </div>
  );
};
