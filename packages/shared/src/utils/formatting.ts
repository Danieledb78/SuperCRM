// Formatting utilities

export const formatCurrency = (
  amount: number,
  currency: string = 'EUR',
  locale: string = 'it-IT'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (
  date: Date | string,
  locale: string = 'it-IT',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(dateObj);
};

export const formatDateTime = (
  date: Date | string,
  locale: string = 'it-IT'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

export const formatPhoneNumber = (phone: string): string => {
  // Clean the phone number
  const cleaned = phone.replace(/\D/g, '');

  // Format for Italian numbers
  if (cleaned.startsWith('39')) {
    const number = cleaned.slice(2);
    if (number.startsWith('3')) {
      // Mobile
      return `+39 ${number.slice(0, 3)} ${number.slice(3, 6)} ${number.slice(6)}`;
    }
    // Landline
    return `+39 ${number.slice(0, 2)} ${number.slice(2)}`;
  }

  return phone;
};

export const formatVatNumber = (vatNumber: string): string => {
  const cleaned = vatNumber.replace(/\D/g, '');
  return `IT${cleaned}`;
};

export const formatFiscalCode = (fiscalCode: string): string => {
  return fiscalCode.toUpperCase().replace(/\s/g, '');
};

export const formatInvoiceNumber = (
  number: number,
  year: number = new Date().getFullYear(),
  prefix: string = 'FT'
): string => {
  return `${prefix}-${year}-${number.toString().padStart(5, '0')}`;
};

export const formatQuoteNumber = (
  number: number,
  year: number = new Date().getFullYear(),
  prefix: string = 'PV'
): string => {
  return `${prefix}-${year}-${number.toString().padStart(5, '0')}`;
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
};
