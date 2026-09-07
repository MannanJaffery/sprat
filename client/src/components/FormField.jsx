export function TextField({ label, error, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <input className="input" {...props} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TextAreaField({ label, error, rows = 3, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <textarea className="input" rows={rows} {...props} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function SelectField({ label, error, children, ...props }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className="input" {...props}>
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}

export function CheckboxField({ label, ...props }) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-primary">
      <input type="checkbox" className="h-4 w-4 rounded border-border text-primary-600 focus:ring-primary-500" {...props} />
      {label}
    </label>
  );
}
