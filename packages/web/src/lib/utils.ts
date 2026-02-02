import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

// Merge Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format currency
export function formatCurrency(value: number | string, currency = 'EUR'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(numValue);
}

// Format number
export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('it-IT').format(numValue);
}

// Format percentage
export function formatPercent(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('it-IT', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(numValue / 100);
}

// Format date
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: it });
}

// Format datetime
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: it });
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: it });
}

// Get initials from name
export function getInitials(firstName: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return `${first}${last}`;
}

// Get full name
export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

// Truncate text
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

// Generate random color
export function getRandomColor(): string {
  const colors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Get status color
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Contact status
    LEAD: '#3B82F6',
    PROSPECT: '#F59E0B',
    CUSTOMER: '#10B981',
    CHURNED: '#EF4444',
    INACTIVE: '#6B7280',

    // Deal status
    OPEN: '#3B82F6',
    WON: '#10B981',
    LOST: '#EF4444',

    // Project status
    DRAFT: '#6B7280',
    QUOTED: '#F59E0B',
    APPROVED: '#3B82F6',
    IN_PROGRESS: '#8B5CF6',
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444',
    ON_HOLD: '#F97316',

    // Invoice status
    PAID: '#10B981',
    PENDING: '#F59E0B',
    OVERDUE: '#EF4444',

    // Default
    DEFAULT: '#6B7280',
  };

  return colors[status] || colors.DEFAULT;
}

// Get priority color
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    LOW: '#6B7280',
    MEDIUM: '#3B82F6',
    HIGH: '#F97316',
    URGENT: '#EF4444',
  };
  return colors[priority] || colors.MEDIUM;
}

// Status labels
export const STATUS_LABELS: Record<string, string> = {
  // Contact
  LEAD: 'Lead',
  PROSPECT: 'Prospect',
  CUSTOMER: 'Cliente',
  CHURNED: 'Perso',
  INACTIVE: 'Inattivo',

  // Deal
  OPEN: 'Aperta',
  WON: 'Vinta',
  LOST: 'Persa',

  // Project
  DRAFT: 'Bozza',
  QUOTED: 'Preventivato',
  APPROVED: 'Approvato',
  IN_PROGRESS: 'In Corso',
  COMPLETED: 'Completato',
  CANCELLED: 'Annullato',
  ON_HOLD: 'In Attesa',

  // Invoice
  PAID: 'Pagata',
  PENDING: 'In Attesa',
  OVERDUE: 'Scaduta',
  PARTIAL: 'Parziale',
};

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Bassa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

// Role labels
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Amministratore',
  ADMIN: 'Amministratore',
  CEO: 'Amministratore Delegato',
  COO: 'Direttore Operativo',
  CFO: 'Direttore Finanziario',
  CTO: 'Direttore Tecnico',
  PURCHASING_DIRECTOR: 'Direttore Acquisti',
  SALES_DIRECTOR: 'Direttore Commerciale',
  SALES_MANAGER: 'Responsabile Commerciale',
  TECHNICAL_MANAGER: 'Responsabile Tecnico',
  PROJECT_MANAGER: 'Responsabile Commesse',
  WAREHOUSE_MANAGER: 'Responsabile Magazzino',
  SALES_AGENT: 'Agente Commerciale',
  TECHNICIAN: 'Tecnico',
  INSTALLER: 'Installatore',
  ACCOUNTANT: 'Contabile',
  SECRETARY: 'Segreteria',
  SUPPLIER: 'Fornitore',
  SUBCONTRACTOR: 'Sub Appaltatore',
  CUSTOMER: 'Cliente',
  USER: 'Utente',
};

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Download file from blob
export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
