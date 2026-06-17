export type PasswordStrength = "weak" | "medium" | "strong";
export type PasswordMatchStatus = "match" | "mismatch";

export function getPasswordMatchStatus(
  confirmPassword: string,
  password: string
): PasswordMatchStatus | null {
  if (!confirmPassword || !password || confirmPassword.length < password.length) {
    return null;
  }

  return confirmPassword === password ? "match" : "mismatch";
}

export function getPasswordStrength(password: string): PasswordStrength | null {
  if (!password) {
    return null;
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (password.length < 8 || score <= 2) {
    return "weak";
  }

  if (score <= 4) {
    return "medium";
  }

  return "strong";
}
