export interface AuthFieldErrors {
  email?: string;
  password?: string;
  name?: string;
  form?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PASSWORD_LENGTH = 128;

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) {
    return "Email is required";
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Enter a valid email address";
  }
  return undefined;
}

export function validateLoginPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }
  return undefined;
}

export function validateRegisterPassword(password: string): string | undefined {
  if (!password) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }
  return undefined;
}

export function validateLoginInput(input: LoginInput): AuthFieldErrors | null {
  const errors: AuthFieldErrors = {};
  const emailError = validateEmail(input.email);
  const passwordError = validateLoginPassword(input.password);

  if (emailError) {
    errors.email = emailError;
  }
  if (passwordError) {
    errors.password = passwordError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateRegisterInput(input: RegisterInput): AuthFieldErrors | null {
  const errors: AuthFieldErrors = {};
  const emailError = validateEmail(input.email);
  const passwordError = validateRegisterPassword(input.password);

  if (emailError) {
    errors.email = emailError;
  }
  if (passwordError) {
    errors.password = passwordError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function getPrimaryAuthError(errors: AuthFieldErrors): string {
  return (
    errors.form ??
    errors.email ??
    errors.password ??
    errors.name ??
    "Something went wrong"
  );
}
