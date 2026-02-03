import { z } from 'zod';

// Portal Types
export const PortalType = z.enum(['CUSTOMER', 'SUPPLIER']);
export const PortalStatus = z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED']);
export const DocumentCategory = z.enum([
  'QUOTE',
  'CONTRACT',
  'INVOICE',
  'TECHNICAL',
  'CERTIFICATE',
  'MANUAL',
  'OTHER'
]);

// Portal Permissions
export const CustomerPermission = z.enum([
  'VIEW_PROJECTS',
  'VIEW_DOCUMENTS',
  'VIEW_INVOICES',
  'SEND_MESSAGES',
  'UPLOAD_DOCUMENTS'
]);

export const SupplierPermission = z.enum([
  'VIEW_ORDERS',
  'UPDATE_DELIVERY',
  'VIEW_DOCUMENTS',
  'SEND_MESSAGES',
  'UPLOAD_DOCUMENTS'
]);

// Get portal accesses
export const getPortalAccessesSchema = z.object({
  query: z.object({
    type: PortalType.optional(),
    status: PortalStatus.optional(),
    search: z.string().optional(),
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    pageSize: z.string().optional().transform(val => val ? parseInt(val) : 20)
  })
});

// Get single portal access
export const getPortalAccessSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID accesso portale richiesto')
  })
});

// Create portal access
export const createPortalAccessSchema = z.object({
  body: z.object({
    type: PortalType,
    email: z.string().email('Email non valida'),
    contactId: z.string().optional(),
    supplierId: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    expiresAt: z.string().datetime().optional(),
    welcomeMessage: z.string().max(1000).optional()
  }).refine(
    data => {
      if (data.type === 'CUSTOMER' && !data.contactId) return false;
      if (data.type === 'SUPPLIER' && !data.supplierId) return false;
      return true;
    },
    { message: 'Contact ID richiesto per clienti, Supplier ID per fornitori' }
  )
});

// Update portal access
export const updatePortalAccessSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID accesso portale richiesto')
  }),
  body: z.object({
    permissions: z.array(z.string()).optional(),
    status: PortalStatus.optional(),
    expiresAt: z.string().datetime().optional().nullable()
  })
});

// Portal login
export const portalLoginSchema = z.object({
  body: z.object({
    email: z.string().email('Email non valida'),
    password: z.string().min(1, 'Password richiesta'),
    portalType: PortalType.optional()
  })
});

// Accept invitation
export const acceptInvitationSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token richiesto'),
    password: z.string()
      .min(8, 'Password minimo 8 caratteri')
      .regex(/[A-Z]/, 'Almeno una lettera maiuscola')
      .regex(/[a-z]/, 'Almeno una lettera minuscola')
      .regex(/[0-9]/, 'Almeno un numero')
  })
});

// Password reset
export const portalPasswordResetSchema = z.object({
  body: z.object({
    email: z.string().email('Email non valida')
  })
});

// Share document
export const shareDocumentSchema = z.object({
  body: z.object({
    portalAccessId: z.string().min(1, 'ID accesso portale richiesto'),
    documentId: z.string().min(1, 'ID documento richiesto'),
    category: DocumentCategory.optional().default('OTHER'),
    projectId: z.string().optional(),
    expiresAt: z.string().datetime().optional()
  })
});

// Send message
export const sendPortalMessageSchema = z.object({
  params: z.object({
    portalAccessId: z.string().min(1, 'ID accesso portale richiesto')
  }),
  body: z.object({
    subject: z.string().min(1, 'Oggetto richiesto').max(200),
    content: z.string().min(1, 'Contenuto richiesto').max(5000),
    attachmentIds: z.array(z.string()).optional()
  })
});

// Reply from portal
export const replyFromPortalSchema = z.object({
  params: z.object({
    portalAccessId: z.string().min(1, 'ID accesso portale richiesto')
  }),
  body: z.object({
    subject: z.string().max(200).optional(),
    content: z.string().min(1, 'Contenuto richiesto').max(5000),
    replyToId: z.string().optional()
  })
});

// Update delivery status
export const updateDeliveryStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'ID ordine richiesto')
  }),
  body: z.object({
    status: z.enum(['PROCESSING', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'DELAYED']),
    trackingNumber: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional(),
    notes: z.string().max(500).optional()
  })
});

export default {
  getPortalAccessesSchema,
  getPortalAccessSchema,
  createPortalAccessSchema,
  updatePortalAccessSchema,
  portalLoginSchema,
  acceptInvitationSchema,
  portalPasswordResetSchema,
  shareDocumentSchema,
  sendPortalMessageSchema,
  replyFromPortalSchema,
  updateDeliveryStatusSchema
};
