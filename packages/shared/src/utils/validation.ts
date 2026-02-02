// Validation utilities

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  // Italian phone format or international
  const phoneRegex = /^(\+39)?[\s]?[0-9]{6,12}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

export const isValidVatNumber = (vatNumber: string): boolean => {
  // Italian Partita IVA: 11 digits
  const vatRegex = /^[0-9]{11}$/;
  return vatRegex.test(vatNumber.replace(/\s/g, ''));
};

export const isValidFiscalCode = (fiscalCode: string): boolean => {
  // Italian Codice Fiscale: 16 alphanumeric characters
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return cfRegex.test(fiscalCode.replace(/\s/g, ''));
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isValidPassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La password deve essere di almeno 8 caratteri');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('La password deve contenere almeno un numero');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};
