export const PASSWORD_EXPIRY_DAYS = 90;
export const PASSWORD_HISTORY_LIMIT = 5;

export interface PasswordValidationResult {
  isValid: boolean;
  ruleMinLength: boolean;
  ruleUppercase: boolean;
  ruleLowercase: boolean;
  ruleNumber: boolean;
  ruleSpecial: boolean;
  ruleNotInHistory: boolean;
  errorMessage?: string;
}

/**
 * Returns the stored password history for the CEO (up to 5 previous passwords)
 */
export function getCeoPasswordHistory(): string[] {
  try {
    const raw = localStorage.getItem('ADMIN_PASSWORD_HISTORY');
    if (!raw) {
      const current = localStorage.getItem('ADMIN_PASSWORD');
      return current ? [current] : [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Validates a new CEO password according to all security standards:
 * - Minimum 12 characters
 * - Uppercase, lowercase, number, and special character
 * - Not used in the last 5 passwords
 */
export function validateCeoPassword(
  password: string,
  history: string[] = getCeoPasswordHistory()
): PasswordValidationResult {
  const ruleMinLength = password.length >= 12;
  const ruleUppercase = /[A-Z]/.test(password);
  const ruleLowercase = /[a-z]/.test(password);
  const ruleNumber = /[0-9]/.test(password);
  const ruleSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password);
  const ruleNotInHistory = !history.includes(password);

  const isValid =
    ruleMinLength &&
    ruleUppercase &&
    ruleLowercase &&
    ruleNumber &&
    ruleSpecial &&
    ruleNotInHistory;

  let errorMessage: string | undefined;
  if (!ruleMinLength) {
    errorMessage = 'La contraseña debe tener al menos 12 caracteres.';
  } else if (!ruleUppercase) {
    errorMessage = 'La contraseña debe incluir al menos una letra mayúscula.';
  } else if (!ruleLowercase) {
    errorMessage = 'La contraseña debe incluir al menos una letra minúscula.';
  } else if (!ruleNumber) {
    errorMessage = 'La contraseña debe incluir al menos un número.';
  } else if (!ruleSpecial) {
    errorMessage = 'La contraseña debe incluir al menos un carácter especial (!@#$%^&*...).';
  } else if (!ruleNotInHistory) {
    errorMessage = 'No puedes reutilizar ninguna de las últimas 5 contraseñas.';
  }

  return {
    isValid,
    ruleMinLength,
    ruleUppercase,
    ruleLowercase,
    ruleNumber,
    ruleSpecial,
    ruleNotInHistory,
    errorMessage,
  };
}

/**
 * Saves a new password, updates the last 5 history and resets the 90-day counter
 */
export function saveCeoPassword(newPassword: string): void {
  const history = getCeoPasswordHistory();
  const updatedHistory = [newPassword, ...history.filter((p) => p !== newPassword)].slice(
    0,
    PASSWORD_HISTORY_LIMIT
  );
  localStorage.setItem('ADMIN_PASSWORD', newPassword);
  localStorage.setItem('ADMIN_PASSWORD_HISTORY', JSON.stringify(updatedHistory));
  localStorage.setItem('ADMIN_PASSWORD_UPDATED_AT', Date.now().toString());
}

/**
 * Calculates password age, days passed, days remaining, and expiry status (90 days)
 */
export function getCeoPasswordAgeInfo(): {
  daysPassed: number;
  daysRemaining: number;
  isExpired: boolean;
  lastUpdateDate: Date;
} {
  const rawTimestamp = localStorage.getItem('ADMIN_PASSWORD_UPDATED_AT');
  let timestamp = rawTimestamp ? parseInt(rawTimestamp, 10) : 0;
  if (!timestamp || isNaN(timestamp)) {
    timestamp = Date.now();
    localStorage.setItem('ADMIN_PASSWORD_UPDATED_AT', timestamp.toString());
  }

  const msPassed = Date.now() - timestamp;
  const daysPassed = Math.floor(msPassed / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, PASSWORD_EXPIRY_DAYS - daysPassed);
  const isExpired = daysPassed >= PASSWORD_EXPIRY_DAYS;

  return {
    daysPassed,
    daysRemaining,
    isExpired,
    lastUpdateDate: new Date(timestamp),
  };
}
