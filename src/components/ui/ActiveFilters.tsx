import React from 'react';
import { X } from 'lucide-react';

export interface ActiveFilterItem {
  key: string;
  label: string;
}

interface Props {
  items: ActiveFilterItem[];
  onRemove: (key: string) => void;
  onReset: () => void;
  resetLabel: string;
  /** Builds the accessible name of a chip's remove button, e.g. "Remove filter: Pune". */
  removeLabel: (label: string) => string;
}

/** Shows what is filtering the list right now, with one-tap removal and a single reset. */
export const ActiveFilters: React.FC<Props> = ({ items, onRemove, onReset, resetLabel, removeLabel }) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="flex flex-wrap items-center gap-2">
        {items.map((item) => (
          <li key={item.key} className="chip">
            <span className="max-w-[14rem] truncate">{item.label}</span>
            <button type="button" onClick={() => onRemove(item.key)} aria-label={removeLabel(item.label)}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onReset} className="btn btn-ghost btn-sm text-[var(--sk-blue-text)]">
        {resetLabel}
      </button>
    </div>
  );
};
