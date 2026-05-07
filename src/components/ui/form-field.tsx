type FormFieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  helper?: string;
  error?: string;
  placeholder?: string;
};

export function FormField({
  label,
  name,
  type = "text",
  autoComplete,
  required,
  helper,
  error,
  placeholder,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-foreground">
        {label} {required ? <span className="text-danger">*</span> : null}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : helper ? `${name}-helper` : undefined}
        placeholder={placeholder}
        className="min-h-12 w-full rounded-2xl bg-paper px-4 text-base text-foreground shadow-[inset_0_0_0_1px_var(--line)] transition-[box-shadow,background-color] duration-200 ease-out placeholder:text-muted/60 focus:bg-paper focus:shadow-[inset_0_0_0_2px_var(--brand)]"
      />
      {error ? (
        <p id={`${name}-error`} role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={`${name}-helper`} className="text-sm leading-6 text-muted">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
