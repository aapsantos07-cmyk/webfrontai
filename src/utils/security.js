// Security and logging utilities

const isDevelopment = import.meta.env.MODE === 'development';

export const secureLog = (...args) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const secureError = (...args) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Secure password generation using cryptographically secure random values
export const generateSecurePassword = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[randomValues[i] % charset.length];
  }

  // Ensure password meets complexity requirements
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=]/.test(password);

  if (!hasUpper) password = password.slice(0, -1) + 'A';
  if (!hasLower) password = password.slice(0, -2) + 'a' + password.slice(-1);
  if (!hasNumber) password = password.slice(0, -3) + '1' + password.slice(-2);
  if (!hasSpecial) password = password.slice(0, -4) + '!' + password.slice(-3);

  return password;
};
