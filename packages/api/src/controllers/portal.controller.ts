import { Request, Response } from 'express';
import crypto from 'crypto';

// Portal Controller - Gestione portali clienti e fornitori

// ============================================
// PORTAL ACCESS MANAGEMENT
// ============================================

// Get all portal accesses
export const getPortalAccesses = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { type, status, search } = req.query;

    // Demo data
    const accesses = [
      {
        id: 'pa_1',
        type: 'CUSTOMER',
        email: 'mario.rossi@email.it',
        status: 'ACTIVE',
        contact: {
          id: 'c1',
          firstName: 'Mario',
          lastName: 'Rossi',
          company: { name: 'Rossi SRL' }
        },
        permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES'],
        lastLoginAt: new Date(Date.now() - 86400000),
        createdAt: new Date(Date.now() - 2592000000)
      },
      {
        id: 'pa_2',
        type: 'SUPPLIER',
        email: 'forniture@panelsolar.it',
        status: 'ACTIVE',
        supplier: {
          id: 's1',
          name: 'Panel Solar Italia',
          contactPerson: 'Giuseppe Verdi'
        },
        permissions: ['VIEW_ORDERS', 'UPDATE_DELIVERY', 'SEND_MESSAGES', 'UPLOAD_DOCUMENTS'],
        lastLoginAt: new Date(Date.now() - 3600000),
        createdAt: new Date(Date.now() - 5184000000)
      },
      {
        id: 'pa_3',
        type: 'CUSTOMER',
        email: 'info@bianchi-costruzioni.it',
        status: 'PENDING',
        contact: {
          id: 'c2',
          firstName: 'Luigi',
          lastName: 'Bianchi',
          company: { name: 'Bianchi Costruzioni' }
        },
        permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS'],
        invitedAt: new Date(Date.now() - 172800000),
        createdAt: new Date(Date.now() - 172800000)
      }
    ];

    res.json(accesses);
  } catch (error) {
    console.error('Error fetching portal accesses:', error);
    res.status(500).json({ error: 'Failed to fetch portal accesses' });
  }
};

// Get single portal access
export const getPortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      type: 'CUSTOMER',
      email: 'mario.rossi@email.it',
      status: 'ACTIVE',
      permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES'],
      lastLoginAt: new Date(),
      sessions: [
        {
          id: 'sess_1',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          createdAt: new Date(Date.now() - 3600000),
          expiresAt: new Date(Date.now() + 82800000)
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching portal access:', error);
    res.status(500).json({ error: 'Failed to fetch portal access' });
  }
};

// Create portal access / Invite user
export const createPortalAccess = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      type,
      email,
      contactId,
      supplierId,
      permissions,
      expiresAt,
      welcomeMessage
    } = req.body;

    if (!type || !email) {
      return res.status(400).json({ error: 'Type and email are required' });
    }

    if (type === 'CUSTOMER' && !contactId) {
      return res.status(400).json({ error: 'Contact ID is required for customer portal' });
    }

    if (type === 'SUPPLIER' && !supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required for supplier portal' });
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const portalAccess = {
      id: `pa_${Date.now()}`,
      type,
      email,
      status: 'PENDING',
      contactId: type === 'CUSTOMER' ? contactId : null,
      supplierId: type === 'SUPPLIER' ? supplierId : null,
      permissions: permissions || getDefaultPermissions(type),
      inviteToken,
      inviteTokenExpiry: tokenExpiry,
      invitedAt: new Date(),
      invitedById: userId,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      organizationId,
      createdAt: new Date()
    };

    // In production:
    // 1. Check if access already exists for this email
    // 2. Save to database
    // 3. Send invitation email with portal link

    res.status(201).json({
      ...portalAccess,
      inviteUrl: `${process.env.PORTAL_URL}/invite/${inviteToken}`
    });
  } catch (error) {
    console.error('Error creating portal access:', error);
    res.status(500).json({ error: 'Failed to create portal access' });
  }
};

// Update portal access
export const updatePortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { permissions, status, expiresAt } = req.body;

    res.json({
      id,
      permissions,
      status,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating portal access:', error);
    res.status(500).json({ error: 'Failed to update portal access' });
  }
};

// Revoke portal access
export const revokePortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Invalidate all sessions for this access

    res.json({ message: 'Portal access revoked' });
  } catch (error) {
    console.error('Error revoking portal access:', error);
    res.status(500).json({ error: 'Failed to revoke portal access' });
  }
};

// Resend invitation
export const resendInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Generate new token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    res.json({
      message: 'Invitation resent',
      inviteUrl: `${process.env.PORTAL_URL}/invite/${inviteToken}`,
      expiresAt: tokenExpiry
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
};

// ============================================
// PORTAL AUTHENTICATION (Public endpoints)
// ============================================

// Portal login
export const portalLogin = async (req: Request, res: Response) => {
  try {
    const { email, password, portalType } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // In production: Verify credentials and check portal access status

    // Demo response
    res.json({
      token: 'portal_jwt_token_here',
      expiresIn: 86400,
      user: {
        id: 'pa_1',
        email,
        type: portalType || 'CUSTOMER',
        name: 'Mario Rossi',
        permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES']
      }
    });
  } catch (error) {
    console.error('Error in portal login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Accept invitation and set password
export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // In production:
    // 1. Validate token and check expiry
    // 2. Hash password
    // 3. Update portal access status to ACTIVE
    // 4. Clear invite token

    res.json({
      message: 'Account activated successfully',
      redirectUrl: '/portal/login'
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};

// Portal password reset request
export const portalPasswordReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If an account exists, a reset email has been sent' });
  } catch (error) {
    console.error('Error in password reset:', error);
    res.status(500).json({ error: 'Failed to process reset request' });
  }
};

// ============================================
// PORTAL DOCUMENTS
// ============================================

// Get portal documents
export const getPortalDocuments = async (req: Request, res: Response) => {
  try {
    const { portalAccessId } = req.params;
    const { category, projectId } = req.query;

    const documents = [
      {
        id: 'pdoc_1',
        name: 'Preventivo_FV_2024.pdf',
        category: 'QUOTE',
        fileSize: 245000,
        mimeType: 'application/pdf',
        project: { id: 'p1', name: 'Impianto FV Residenziale' },
        uploadedAt: new Date(Date.now() - 604800000),
        downloadCount: 3
      },
      {
        id: 'pdoc_2',
        name: 'Contratto_Fornitura.pdf',
        category: 'CONTRACT',
        fileSize: 512000,
        mimeType: 'application/pdf',
        uploadedAt: new Date(Date.now() - 1209600000),
        downloadCount: 1
      },
      {
        id: 'pdoc_3',
        name: 'Schema_Impianto.dwg',
        category: 'TECHNICAL',
        fileSize: 1024000,
        mimeType: 'application/acad',
        project: { id: 'p1', name: 'Impianto FV Residenziale' },
        uploadedAt: new Date(Date.now() - 259200000),
        downloadCount: 5
      }
    ];

    res.json(documents);
  } catch (error) {
    console.error('Error fetching portal documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Share document with portal
export const shareDocument = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { portalAccessId, documentId, category, expiresAt } = req.body;

    if (!portalAccessId || !documentId) {
      return res.status(400).json({ error: 'Portal access ID and document ID are required' });
    }

    const portalDocument = {
      id: `pdoc_${Date.now()}`,
      portalAccessId,
      documentId,
      category: category || 'OTHER',
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      sharedAt: new Date()
    };

    // In production: Notify portal user of new document

    res.status(201).json(portalDocument);
  } catch (error) {
    console.error('Error sharing document:', error);
    res.status(500).json({ error: 'Failed to share document' });
  }
};

// Remove document from portal
export const removePortalDocument = async (req: Request, res: Response) => {
  try {
    const { portalAccessId, documentId } = req.params;

    res.json({ message: 'Document removed from portal' });
  } catch (error) {
    console.error('Error removing document:', error);
    res.status(500).json({ error: 'Failed to remove document' });
  }
};

// ============================================
// PORTAL MESSAGES
// ============================================

// Get portal messages
export const getPortalMessages = async (req: Request, res: Response) => {
  try {
    const { portalAccessId } = req.params;

    const messages = [
      {
        id: 'pmsg_1',
        subject: 'Aggiornamento progetto',
        content: 'Il sopralluogo è stato programmato per lunedì prossimo.',
        fromPortal: false,
        senderName: 'Team Tecnico',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000)
      },
      {
        id: 'pmsg_2',
        subject: 'Re: Aggiornamento progetto',
        content: 'Perfetto, sarò disponibile dalle 9 alle 12.',
        fromPortal: true,
        isRead: true,
        createdAt: new Date(Date.now() - 72000000)
      },
      {
        id: 'pmsg_3',
        subject: 'Documenti richiesti',
        content: 'Allego i documenti catastali richiesti.',
        fromPortal: true,
        attachments: [{ name: 'visura_catastale.pdf', size: 150000 }],
        isRead: false,
        createdAt: new Date(Date.now() - 3600000)
      }
    ];

    res.json(messages);
  } catch (error) {
    console.error('Error fetching portal messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send message to portal user (from CRM)
export const sendPortalMessage = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;
    const { portalAccessId } = req.params;
    const { subject, content, attachmentIds } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    const message = {
      id: `pmsg_${Date.now()}`,
      portalAccessId,
      subject,
      content,
      fromPortal: false,
      senderId: userId,
      attachments: attachmentIds || [],
      isRead: false,
      createdAt: new Date()
    };

    // In production: Send email notification to portal user

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Reply from portal (portal user endpoint)
export const replyFromPortal = async (req: Request, res: Response) => {
  try {
    const { portalAccessId } = req.params;
    const { subject, content, replyToId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = {
      id: `pmsg_${Date.now()}`,
      portalAccessId,
      subject: subject || 'Re: Messaggio',
      content,
      fromPortal: true,
      replyToId,
      isRead: false,
      createdAt: new Date()
    };

    // In production: Notify CRM users of new message

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ error: 'Failed to send reply' });
  }
};

// Mark message as read
export const markMessageRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    res.json({ id: messageId, isRead: true, readAt: new Date() });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};

// ============================================
// PORTAL CUSTOMER VIEW (Customer sees their projects)
// ============================================

// Get customer projects
export const getCustomerProjects = async (req: Request, res: Response) => {
  try {
    // Portal user context would be set by portal auth middleware

    const projects = [
      {
        id: 'p1',
        code: 'PRJ-2024-001',
        name: 'Impianto Fotovoltaico 6kW',
        status: 'IN_PROGRESS',
        technicalStatus: 'DESIGN',
        installationStatus: 'NOT_STARTED',
        progress: 35,
        estimatedCompletionDate: new Date(Date.now() + 2592000000),
        timeline: [
          { phase: 'Sopralluogo', status: 'COMPLETED', date: new Date(Date.now() - 604800000) },
          { phase: 'Progettazione', status: 'IN_PROGRESS', date: null },
          { phase: 'Pratiche GSE', status: 'PENDING', date: null },
          { phase: 'Installazione', status: 'PENDING', date: null },
          { phase: 'Collaudo', status: 'PENDING', date: null }
        ]
      }
    ];

    res.json(projects);
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// ============================================
// PORTAL SUPPLIER VIEW (Supplier sees their orders)
// ============================================

// Get supplier orders
export const getSupplierOrders = async (req: Request, res: Response) => {
  try {
    const orders = [
      {
        id: 'ord_1',
        orderNumber: 'PO-2024-0042',
        status: 'CONFIRMED',
        items: [
          { product: 'Pannello FV 400W', quantity: 15, unitPrice: 180 },
          { product: 'Inverter 6kW', quantity: 1, unitPrice: 1200 }
        ],
        totalAmount: 3900,
        orderDate: new Date(Date.now() - 259200000),
        expectedDeliveryDate: new Date(Date.now() + 432000000),
        deliveryAddress: 'Via Roma 123, Milano',
        notes: 'Consegna mattino'
      },
      {
        id: 'ord_2',
        orderNumber: 'PO-2024-0038',
        status: 'DELIVERED',
        items: [
          { product: 'Struttura tetto piano', quantity: 2, unitPrice: 450 }
        ],
        totalAmount: 900,
        orderDate: new Date(Date.now() - 1209600000),
        deliveredDate: new Date(Date.now() - 604800000)
      }
    ];

    res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update delivery status (supplier action)
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDelivery, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const update = {
      orderId,
      status,
      trackingNumber,
      estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
      notes,
      updatedAt: new Date()
    };

    // In production: Notify CRM users of delivery update

    res.json(update);
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
};

// ============================================
// PORTAL ANALYTICS
// ============================================

// Get portal usage stats
export const getPortalStats = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;

    res.json({
      customers: {
        total: 45,
        active: 38,
        pending: 7,
        loginsLast30Days: 156
      },
      suppliers: {
        total: 12,
        active: 10,
        pending: 2,
        loginsLast30Days: 89
      },
      messages: {
        sent: 234,
        received: 189,
        unread: 12
      },
      documents: {
        shared: 456,
        downloaded: 1234
      }
    });
  } catch (error) {
    console.error('Error fetching portal stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

// ============================================
// HELPERS
// ============================================

function getDefaultPermissions(type: string): string[] {
  if (type === 'CUSTOMER') {
    return ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES'];
  } else if (type === 'SUPPLIER') {
    return ['VIEW_ORDERS', 'UPDATE_DELIVERY', 'SEND_MESSAGES', 'UPLOAD_DOCUMENTS'];
  }
  return [];
}

export default {
  // Portal Access Management
  getPortalAccesses,
  getPortalAccess,
  createPortalAccess,
  updatePortalAccess,
  revokePortalAccess,
  resendInvitation,
  // Portal Authentication
  portalLogin,
  acceptInvitation,
  portalPasswordReset,
  // Portal Documents
  getPortalDocuments,
  shareDocument,
  removePortalDocument,
  // Portal Messages
  getPortalMessages,
  sendPortalMessage,
  replyFromPortal,
  markMessageRead,
  // Customer Portal
  getCustomerProjects,
  // Supplier Portal
  getSupplierOrders,
  updateDeliveryStatus,
  // Analytics
  getPortalStats
};
