import { Request, Response } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma, { getPaginationParams, createPaginatedResult, handlePrismaError } from '../lib/prisma';

// Portal Controller - Gestione portali clienti e fornitori

// ============================================
// PORTAL ACCESS MANAGEMENT
// ============================================

// Get all portal accesses
export const getPortalAccesses = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { type, status, search, page = 1, pageSize = 20 } = req.query;

    const where: any = { organizationId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { contact: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { contact: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { supplier: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    const { skip, take } = getPaginationParams({
      page: Number(page),
      pageSize: Number(pageSize)
    });

    const [accesses, total] = await Promise.all([
      prisma.portalAccess.findMany({
        where,
        include: {
          contact: {
            select: { id: true, firstName: true, lastName: true, email: true },
            include: { company: { select: { id: true, name: true } } }
          },
          supplier: { select: { id: true, name: true, contactPerson: true, email: true } },
          invitedBy: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.portalAccess.count({ where })
    ]);

    res.json(createPaginatedResult(accesses, total, { page: Number(page), pageSize: Number(pageSize) }));
  } catch (error) {
    console.error('Error fetching portal accesses:', error);
    res.status(500).json({ error: 'Failed to fetch portal accesses' });
  }
};

// Get single portal access
export const getPortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    const access = await prisma.portalAccess.findFirst({
      where: { id, organizationId },
      include: {
        contact: { include: { company: { select: { id: true, name: true } } } },
        supplier: true,
        invitedBy: { select: { id: true, firstName: true, lastName: true } },
        sessions: { orderBy: { createdAt: 'desc' }, take: 10 }
      }
    });

    if (!access) {
      return res.status(404).json({ error: 'Portal access not found' });
    }

    res.json(access);
  } catch (error) {
    console.error('Error fetching portal access:', error);
    res.status(500).json({ error: 'Failed to fetch portal access' });
  }
};

// Create portal access / Invite user
export const createPortalAccess = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { type, email, contactId, supplierId, permissions, expiresAt, welcomeMessage } = req.body;

    if (!type || !email) {
      return res.status(400).json({ error: 'Type and email are required' });
    }

    if (type === 'CUSTOMER' && !contactId) {
      return res.status(400).json({ error: 'Contact ID is required for customer portal' });
    }

    if (type === 'SUPPLIER' && !supplierId) {
      return res.status(400).json({ error: 'Supplier ID is required for supplier portal' });
    }

    // Check if access already exists
    const existing = await prisma.portalAccess.findFirst({
      where: { email, organizationId }
    });

    if (existing) {
      return res.status(409).json({ error: 'Portal access already exists for this email' });
    }

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const portalAccess = await prisma.portalAccess.create({
      data: {
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
        organizationId
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        supplier: { select: { id: true, name: true } }
      }
    });

    // TODO: Send invitation email with welcomeMessage

    res.status(201).json({
      ...portalAccess,
      inviteUrl: `${process.env.PORTAL_URL}/invite/${inviteToken}`
    });
  } catch (error) {
    console.error('Error creating portal access:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Update portal access
export const updatePortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;
    const { permissions, status, expiresAt } = req.body;

    const access = await prisma.portalAccess.updateMany({
      where: { id, organizationId },
      data: {
        permissions,
        status,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        updatedAt: new Date()
      }
    });

    if (access.count === 0) {
      return res.status(404).json({ error: 'Portal access not found' });
    }

    const updated = await prisma.portalAccess.findUnique({ where: { id } });
    res.json(updated);
  } catch (error) {
    console.error('Error updating portal access:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Revoke portal access
export const revokePortalAccess = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user!;

    // Invalidate all sessions
    await prisma.portalSession.updateMany({
      where: { portalAccessId: id },
      data: { isValid: false }
    });

    // Update status
    await prisma.portalAccess.updateMany({
      where: { id, organizationId },
      data: { status: 'SUSPENDED' }
    });

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
    const { organizationId } = req.user!;

    const inviteToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await prisma.portalAccess.updateMany({
      where: { id, organizationId, status: 'PENDING' },
      data: {
        inviteToken,
        inviteTokenExpiry: tokenExpiry,
        invitedAt: new Date()
      }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Portal access not found or not pending' });
    }

    // TODO: Send invitation email

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

    const access = await prisma.portalAccess.findFirst({
      where: {
        email,
        status: 'ACTIVE',
        ...(portalType && { type: portalType })
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        supplier: { select: { id: true, name: true } },
        organization: { select: { id: true, name: true } }
      }
    });

    if (!access || !access.passwordHash) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, access.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check expiry
    if (access.expiresAt && access.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Portal access has expired' });
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    await prisma.portalSession.create({
      data: {
        portalAccessId: access.id,
        token: sessionToken,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });

    // Update last login
    await prisma.portalAccess.update({
      where: { id: access.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate JWT
    const token = jwt.sign(
      {
        portalAccessId: access.id,
        type: access.type,
        email: access.email,
        organizationId: access.organizationId,
        permissions: access.permissions
      },
      process.env.JWT_SECRET || 'portal-secret',
      { expiresIn: '24h' }
    );

    const name = access.type === 'CUSTOMER'
      ? `${access.contact?.firstName} ${access.contact?.lastName}`
      : access.supplier?.name;

    res.json({
      token,
      expiresIn: 86400,
      user: {
        id: access.id,
        email: access.email,
        type: access.type,
        name,
        permissions: access.permissions,
        organization: access.organization
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

    const access = await prisma.portalAccess.findFirst({
      where: {
        inviteToken: token,
        inviteTokenExpiry: { gt: new Date() },
        status: 'PENDING'
      }
    });

    if (!access) {
      return res.status(400).json({ error: 'Invalid or expired invitation token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.portalAccess.update({
      where: { id: access.id },
      data: {
        passwordHash,
        status: 'ACTIVE',
        inviteToken: null,
        inviteTokenExpiry: null,
        activatedAt: new Date()
      }
    });

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

    const access = await prisma.portalAccess.findFirst({
      where: { email, status: 'ACTIVE' }
    });

    if (access) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      await prisma.portalAccess.update({
        where: { id: access.id },
        data: {
          inviteToken: resetToken,
          inviteTokenExpiry: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        }
      });

      // TODO: Send password reset email
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

    const where: any = { portalAccessId };
    if (category) where.category = category;
    if (projectId) where.projectId = projectId;

    const documents = await prisma.portalDocument.findMany({
      where,
      include: {
        document: true,
        project: { select: { id: true, code: true, name: true } }
      },
      orderBy: { sharedAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching portal documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

// Share document with portal
export const shareDocument = async (req: Request, res: Response) => {
  try {
    const { portalAccessId, documentId, category, expiresAt, projectId } = req.body;

    if (!portalAccessId || !documentId) {
      return res.status(400).json({ error: 'Portal access ID and document ID are required' });
    }

    const portalDocument = await prisma.portalDocument.create({
      data: {
        portalAccessId,
        documentId,
        category: category || 'OTHER',
        projectId,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        sharedAt: new Date()
      },
      include: {
        document: true
      }
    });

    // TODO: Notify portal user

    res.status(201).json(portalDocument);
  } catch (error) {
    console.error('Error sharing document:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Remove document from portal
export const removePortalDocument = async (req: Request, res: Response) => {
  try {
    const { portalAccessId, documentId } = req.params;

    await prisma.portalDocument.deleteMany({
      where: { portalAccessId, documentId }
    });

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

    const messages = await prisma.portalMessage.findMany({
      where: { portalAccessId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

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

    const message = await prisma.portalMessage.create({
      data: {
        portalAccessId,
        subject,
        content,
        fromPortal: false,
        senderId: userId,
        attachments: attachmentIds || [],
        isRead: false
      }
    });

    // TODO: Send email notification

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Reply from portal
export const replyFromPortal = async (req: Request, res: Response) => {
  try {
    const { portalAccessId } = req.params;
    const { subject, content, replyToId } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await prisma.portalMessage.create({
      data: {
        portalAccessId,
        subject: subject || 'Re: Messaggio',
        content,
        fromPortal: true,
        replyToId,
        isRead: false
      }
    });

    // TODO: Notify CRM users

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending reply:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Mark message as read
export const markMessageRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.portalMessage.update({
      where: { id: messageId },
      data: { isRead: true, readAt: new Date() }
    });

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// ============================================
// PORTAL CUSTOMER VIEW
// ============================================

// Get customer projects
export const getCustomerProjects = async (req: Request, res: Response) => {
  try {
    // In production, get portalAccessId from portal auth token
    const { portalAccessId } = req.query;

    const access = await prisma.portalAccess.findUnique({
      where: { id: portalAccessId as string },
      include: { contact: true }
    });

    if (!access || !access.contactId) {
      return res.status(404).json({ error: 'Portal access not found' });
    }

    const projects = await prisma.project.findMany({
      where: {
        organizationId: access.organizationId,
        contactId: access.contactId
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        technicalStatus: true,
        installationStatus: true,
        progress: true,
        estimatedCompletionDate: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching customer projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// ============================================
// PORTAL SUPPLIER VIEW
// ============================================

// Get supplier orders
export const getSupplierOrders = async (req: Request, res: Response) => {
  try {
    const { portalAccessId } = req.query;

    const access = await prisma.portalAccess.findUnique({
      where: { id: portalAccessId as string },
      include: { supplier: true }
    });

    if (!access || !access.supplierId) {
      return res.status(404).json({ error: 'Portal access not found' });
    }

    const orders = await prisma.purchaseOrder.findMany({
      where: {
        organizationId: access.organizationId,
        supplierId: access.supplierId
      },
      include: {
        items: { include: { product: { select: { name: true } } } }
      },
      orderBy: { orderDate: 'desc' }
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching supplier orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// Update delivery status
export const updateDeliveryStatus = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status, trackingNumber, estimatedDelivery, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const order = await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: {
        status,
        trackingNumber,
        expectedDeliveryDate: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
        notes,
        updatedAt: new Date()
      }
    });

    // TODO: Notify CRM users

    res.json(order);
  } catch (error) {
    console.error('Error updating delivery:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// ============================================
// PORTAL ANALYTICS
// ============================================

// Get portal usage stats
export const getPortalStats = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      customerTotal,
      customerActive,
      customerPending,
      supplierTotal,
      supplierActive,
      supplierPending,
      customerLogins,
      supplierLogins,
      messagesReceived,
      messagesSent,
      unreadMessages,
      documentsShared
    ] = await Promise.all([
      prisma.portalAccess.count({ where: { organizationId, type: 'CUSTOMER' } }),
      prisma.portalAccess.count({ where: { organizationId, type: 'CUSTOMER', status: 'ACTIVE' } }),
      prisma.portalAccess.count({ where: { organizationId, type: 'CUSTOMER', status: 'PENDING' } }),
      prisma.portalAccess.count({ where: { organizationId, type: 'SUPPLIER' } }),
      prisma.portalAccess.count({ where: { organizationId, type: 'SUPPLIER', status: 'ACTIVE' } }),
      prisma.portalAccess.count({ where: { organizationId, type: 'SUPPLIER', status: 'PENDING' } }),
      prisma.portalSession.count({
        where: {
          portalAccess: { organizationId, type: 'CUSTOMER' },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.portalSession.count({
        where: {
          portalAccess: { organizationId, type: 'SUPPLIER' },
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.portalMessage.count({
        where: { portalAccess: { organizationId }, fromPortal: true }
      }),
      prisma.portalMessage.count({
        where: { portalAccess: { organizationId }, fromPortal: false }
      }),
      prisma.portalMessage.count({
        where: { portalAccess: { organizationId }, isRead: false }
      }),
      prisma.portalDocument.count({
        where: { portalAccess: { organizationId } }
      })
    ]);

    res.json({
      customers: {
        total: customerTotal,
        active: customerActive,
        pending: customerPending,
        loginsLast30Days: customerLogins
      },
      suppliers: {
        total: supplierTotal,
        active: supplierActive,
        pending: supplierPending,
        loginsLast30Days: supplierLogins
      },
      messages: {
        sent: messagesSent,
        received: messagesReceived,
        unread: unreadMessages
      },
      documents: {
        shared: documentsShared
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
  getPortalAccesses, getPortalAccess, createPortalAccess, updatePortalAccess,
  revokePortalAccess, resendInvitation,
  portalLogin, acceptInvitation, portalPasswordReset,
  getPortalDocuments, shareDocument, removePortalDocument,
  getPortalMessages, sendPortalMessage, replyFromPortal, markMessageRead,
  getCustomerProjects, getSupplierOrders, updateDeliveryStatus,
  getPortalStats
};
