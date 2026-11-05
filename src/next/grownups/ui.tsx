import { ReactNode } from 'react';

/** A segmented control: one of a few values, all visible at once. */
export function Segmented<T extends string | number | boolean>({ label, value, options, onChange }: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="gu-seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)} type="button" role="radio" aria-checked={o.value === value}
          onClick={() => { if (o.value !== value) onChange(o.value); }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Section({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section className="gu-sec" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}
