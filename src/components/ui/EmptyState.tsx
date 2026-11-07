import React, { useId } from 'react';

interface Props {
  icon: React.ReactNode;
  title: string;
  body: string;
  /** One clear next step: primary first, then at most one alternative. */
  actions?: React.ReactNode;
}

/** A deliberate "nothing here" screen: says what happened and what to do next. */
export const EmptyState: React.FC<Props> = ({ icon, title, body, actions }) => {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="card flex flex-col items-center gap-3 px-6 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600" aria-hidden="true">
        {icon}
      </div>
      <h3 id={id} className="text-lg font-extrabold text-slate-900">
        {title}
      </h3>
      <p className="max-w-md text-body text-slate-600">{body}</p>
      {actions && <div className="mt-1 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </section>
  );
};
