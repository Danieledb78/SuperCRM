// API Response Types

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Contact Types
export interface ContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  mobile?: string;
  jobTitle?: string;
  department?: string;
  source?: string;
  status?: string;
  companyId?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  description?: string;
  emailOptIn?: boolean;
  smsOptIn?: boolean;
  tags?: string[];
}

// Company Types
export interface CompanyInput {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  industry?: string;
  employeeCount?: number;
  annualRevenue?: number;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  vatNumber?: string;
  fiscalCode?: string;
  sdiCode?: string;
  pecEmail?: string;
  tags?: string[];
}

// Deal Types
export interface DealInput {
  title: string;
  value?: number;
  currency?: string;
  pipelineId: string;
  stageId: string;
  contactId?: string;
  companyId?: string;
  expectedCloseDate?: string;
  priority?: string;
  description?: string;
  tags?: string[];
}

// Quote Types
export interface QuoteInput {
  contactId?: string;
  companyId?: string;
  dealId?: string;
  subject?: string;
  notes?: string;
  terms?: string;
  expiryDate?: string;
  discountPercent?: number;
  items: QuoteItemInput[];
}

export interface QuoteItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRate: number;
}

// Invoice Types
export interface InvoiceInput {
  contactId?: string;
  companyId?: string;
  quoteId?: string;
  type?: string;
  subject?: string;
  notes?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  dueDate?: string;
  discountPercent?: number;
  items: InvoiceItemInput[];
}

export interface InvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  vatRate: number;
}

// Campaign Types
export interface CampaignInput {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP';
  subject?: string;
  content?: string;
  htmlContent?: string;
  scheduledAt?: string;
  contactIds: string[];
}

// Automation Types
export interface AutomationInput {
  name: string;
  description?: string;
  trigger: string;
  triggerConfig?: Record<string, unknown>;
  actions: AutomationActionInput[];
}

export interface AutomationActionInput {
  type: string;
  config: Record<string, unknown>;
  delayMinutes?: number;
  order: number;
}

// Task Types
export interface TaskInput {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
  contactId?: string;
  dealId?: string;
}

// Activity Types
export interface ActivityInput {
  type: string;
  subject: string;
  description?: string;
  duration?: number;
  outcome?: string;
  scheduledAt?: string;
  contactId?: string;
  dealId?: string;
}

// Appointment Types
export interface AppointmentInput {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingUrl?: string;
  contactId: string;
}
