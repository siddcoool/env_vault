import { Input } from "@/components/ui/input";

interface AuthFieldProps {
  label: string;
  name: string;
  type?: React.ComponentProps<"input">["type"];
  error?: string;
  autoComplete?: string;
  minLength?: number;
  required?: boolean;
}

export function AuthField({
  label,
  name,
  type = "text",
  error,
  autoComplete,
  minLength,
  required,
}: AuthFieldProps) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      <Input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-error` : undefined}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
