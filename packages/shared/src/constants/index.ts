// Application Constants

export const APP_NAME = 'SuperCRM';
export const APP_VERSION = '1.0.0';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Contact Status
export const CONTACT_STATUSES = {
  LEAD: { label: 'Lead', color: '#FCD34D' },
  PROSPECT: { label: 'Prospect', color: '#60A5FA' },
  CUSTOMER: { label: 'Cliente', color: '#34D399' },
  CHURNED: { label: 'Perso', color: '#F87171' },
  INACTIVE: { label: 'Inattivo', color: '#9CA3AF' },
} as const;

// Lead Sources
export const LEAD_SOURCES = {
  WEBSITE: { label: 'Sito Web', icon: 'globe' },
  REFERRAL: { label: 'Referral', icon: 'users' },
  SOCIAL_MEDIA: { label: 'Social Media', icon: 'share' },
  ADVERTISING: { label: 'Pubblicità', icon: 'megaphone' },
  EMAIL_CAMPAIGN: { label: 'Email Campaign', icon: 'mail' },
  COLD_CALL: { label: 'Chiamata a Freddo', icon: 'phone' },
  TRADE_SHOW: { label: 'Fiera', icon: 'calendar' },
  PARTNER: { label: 'Partner', icon: 'handshake' },
  OTHER: { label: 'Altro', icon: 'circle' },
} as const;

// Deal Status
export const DEAL_STATUSES = {
  OPEN: { label: 'Aperta', color: '#60A5FA' },
  WON: { label: 'Vinta', color: '#34D399' },
  LOST: { label: 'Persa', color: '#F87171' },
} as const;

// Priority Levels
export const PRIORITIES = {
  LOW: { label: 'Bassa', color: '#9CA3AF', order: 1 },
  MEDIUM: { label: 'Media', color: '#FCD34D', order: 2 },
  HIGH: { label: 'Alta', color: '#FB923C', order: 3 },
  URGENT: { label: 'Urgente', color: '#F87171', order: 4 },
} as const;

// Task Status
export const TASK_STATUSES = {
  TODO: { label: 'Da fare', color: '#9CA3AF' },
  IN_PROGRESS: { label: 'In corso', color: '#60A5FA' },
  COMPLETED: { label: 'Completato', color: '#34D399' },
  CANCELLED: { label: 'Annullato', color: '#F87171' },
} as const;

// Activity Types
export const ACTIVITY_TYPES = {
  CALL: { label: 'Chiamata', icon: 'phone' },
  EMAIL: { label: 'Email', icon: 'mail' },
  MEETING: { label: 'Riunione', icon: 'calendar' },
  TASK: { label: 'Attività', icon: 'check-square' },
  NOTE: { label: 'Nota', icon: 'file-text' },
  SMS: { label: 'SMS', icon: 'message-square' },
  WHATSAPP: { label: 'WhatsApp', icon: 'message-circle' },
} as const;

// Quote Status
export const QUOTE_STATUSES = {
  DRAFT: { label: 'Bozza', color: '#9CA3AF' },
  SENT: { label: 'Inviato', color: '#60A5FA' },
  VIEWED: { label: 'Visualizzato', color: '#A78BFA' },
  ACCEPTED: { label: 'Accettato', color: '#34D399' },
  REJECTED: { label: 'Rifiutato', color: '#F87171' },
  EXPIRED: { label: 'Scaduto', color: '#FCD34D' },
  CONVERTED: { label: 'Convertito', color: '#2DD4BF' },
} as const;

// Invoice Status
export const INVOICE_STATUSES = {
  DRAFT: { label: 'Bozza', color: '#9CA3AF' },
  SENT: { label: 'Inviata', color: '#60A5FA' },
  VIEWED: { label: 'Visualizzata', color: '#A78BFA' },
  PARTIALLY_PAID: { label: 'Parzialmente Pagata', color: '#FCD34D' },
  PAID: { label: 'Pagata', color: '#34D399' },
  OVERDUE: { label: 'Scaduta', color: '#F87171' },
  CANCELLED: { label: 'Annullata', color: '#6B7280' },
} as const;

// Invoice Types
export const INVOICE_TYPES = {
  INVOICE: { label: 'Fattura', prefix: 'FT' },
  CREDIT_NOTE: { label: 'Nota di Credito', prefix: 'NC' },
  PROFORMA: { label: 'Proforma', prefix: 'PF' },
} as const;

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: { label: 'Contanti', icon: 'banknote' },
  BANK_TRANSFER: { label: 'Bonifico Bancario', icon: 'landmark' },
  CREDIT_CARD: { label: 'Carta di Credito', icon: 'credit-card' },
  PAYPAL: { label: 'PayPal', icon: 'wallet' },
  CHECK: { label: 'Assegno', icon: 'file-check' },
  OTHER: { label: 'Altro', icon: 'circle' },
} as const;

// Campaign Types
export const CAMPAIGN_TYPES = {
  EMAIL: { label: 'Email', icon: 'mail' },
  SMS: { label: 'SMS', icon: 'message-square' },
  WHATSAPP: { label: 'WhatsApp', icon: 'message-circle' },
} as const;

// Campaign Status
export const CAMPAIGN_STATUSES = {
  DRAFT: { label: 'Bozza', color: '#9CA3AF' },
  SCHEDULED: { label: 'Programmata', color: '#60A5FA' },
  SENDING: { label: 'In Invio', color: '#FCD34D' },
  SENT: { label: 'Inviata', color: '#34D399' },
  PAUSED: { label: 'In Pausa', color: '#FB923C' },
  CANCELLED: { label: 'Annullata', color: '#F87171' },
} as const;

// Automation Triggers
export const AUTOMATION_TRIGGERS = {
  CONTACT_CREATED: { label: 'Contatto Creato', icon: 'user-plus' },
  CONTACT_UPDATED: { label: 'Contatto Aggiornato', icon: 'user-check' },
  CONTACT_TAG_ADDED: { label: 'Tag Aggiunto', icon: 'tag' },
  DEAL_CREATED: { label: 'Trattativa Creata', icon: 'plus-circle' },
  DEAL_STAGE_CHANGED: { label: 'Fase Trattativa Cambiata', icon: 'git-branch' },
  DEAL_WON: { label: 'Trattativa Vinta', icon: 'trophy' },
  DEAL_LOST: { label: 'Trattativa Persa', icon: 'x-circle' },
  FORM_SUBMITTED: { label: 'Form Inviato', icon: 'file-input' },
  APPOINTMENT_BOOKED: { label: 'Appuntamento Prenotato', icon: 'calendar-check' },
  INVOICE_CREATED: { label: 'Fattura Creata', icon: 'file-text' },
  INVOICE_PAID: { label: 'Fattura Pagata', icon: 'check-circle' },
  MANUAL: { label: 'Manuale', icon: 'hand' },
} as const;

// Automation Actions
export const AUTOMATION_ACTIONS = {
  SEND_EMAIL: { label: 'Invia Email', icon: 'mail' },
  SEND_SMS: { label: 'Invia SMS', icon: 'message-square' },
  CREATE_TASK: { label: 'Crea Attività', icon: 'check-square' },
  UPDATE_CONTACT: { label: 'Aggiorna Contatto', icon: 'user-check' },
  ADD_TAG: { label: 'Aggiungi Tag', icon: 'tag' },
  REMOVE_TAG: { label: 'Rimuovi Tag', icon: 'x' },
  MOVE_DEAL_STAGE: { label: 'Sposta Fase Trattativa', icon: 'git-branch' },
  CREATE_DEAL: { label: 'Crea Trattativa', icon: 'plus-circle' },
  NOTIFY_USER: { label: 'Notifica Utente', icon: 'bell' },
  WEBHOOK: { label: 'Webhook', icon: 'webhook' },
  WAIT: { label: 'Attendi', icon: 'clock' },
} as const;

// Italian VAT Rates
export const VAT_RATES = [
  { value: 22, label: '22% - Aliquota ordinaria' },
  { value: 10, label: '10% - Aliquota ridotta' },
  { value: 5, label: '5% - Aliquota ridotta' },
  { value: 4, label: '4% - Aliquota minima' },
  { value: 0, label: '0% - Esente IVA' },
] as const;

// Italian Provinces
export const ITALIAN_PROVINCES = [
  'AG', 'AL', 'AN', 'AO', 'AP', 'AQ', 'AR', 'AT', 'AV', 'BA',
  'BG', 'BI', 'BL', 'BN', 'BO', 'BR', 'BS', 'BT', 'BZ', 'CA',
  'CB', 'CE', 'CH', 'CL', 'CN', 'CO', 'CR', 'CS', 'CT', 'CZ',
  'EN', 'FC', 'FE', 'FG', 'FI', 'FM', 'FR', 'GE', 'GO', 'GR',
  'IM', 'IS', 'KR', 'LC', 'LE', 'LI', 'LO', 'LT', 'LU', 'MB',
  'MC', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NA', 'NO', 'NU',
  'OR', 'PA', 'PC', 'PD', 'PE', 'PG', 'PI', 'PN', 'PO', 'PR',
  'PT', 'PU', 'PV', 'PZ', 'RA', 'RC', 'RE', 'RG', 'RI', 'RM',
  'RN', 'RO', 'SA', 'SI', 'SO', 'SP', 'SR', 'SS', 'SU', 'SV',
  'TA', 'TE', 'TN', 'TO', 'TP', 'TR', 'TS', 'TV', 'UD', 'VA',
  'VB', 'VC', 'VE', 'VI', 'VR', 'VT', 'VV',
] as const;

// Re-export permissions
export * from './permissions';
