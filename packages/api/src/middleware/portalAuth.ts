import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

// Portal user context
export interface PortalUser {
  portalAccessId: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  email: string;
  organizationId: string;
  permissions: string[];
  contactId?: string;
  supplierId?: string;
}

export interface PortalRequest extends Request {
  portalUser?: PortalUser;
}

// JWT payload structure for portal tokens
interface PortalTokenPayload {
  portalAccessId: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  email: string;
  organizationId: string;
  permissions: string[];
}

/**
 * Authenticate portal users via JWT token
 */
export const authenticatePortal = async (
  req: PortalRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Token non fornito' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'portal-secret';

    const decoded = jwt.verify(token, secret) as PortalTokenPayload;

    // Verify portal access exists and is active
    const portalAccess = await prisma.portalAccess.findUnique({
      where: { id: decoded.portalAccessId },
      select: {
        id: true,
        type: true,
        email: true,
        status: true,
        permissions: true,
        expiresAt: true,
        organizationId: true,
        contactId: true,
        supplierId: true
      }
    });

    if (!portalAccess) {
      res.status(401).json({ success: false, error: 'Accesso portale non valido' });
      return;
    }

    if (portalAccess.status !== 'ACTIVE') {
      res.status(401).json({ success: false, error: 'Accesso portale non attivo' });
      return;
    }

    // Check if access has expired
    if (portalAccess.expiresAt && portalAccess.expiresAt < new Date()) {
      res.status(401).json({ success: false, error: 'Accesso portale scaduto' });
      return;
    }

    req.portalUser = {
      portalAccessId: portalAccess.id,
      type: portalAccess.type as 'CUSTOMER' | 'SUPPLIER',
      email: portalAccess.email,
      organizationId: portalAccess.organizationId,
      permissions: portalAccess.permissions as string[],
      contactId: portalAccess.contactId || undefined,
      supplierId: portalAccess.supplierId || undefined
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token scaduto' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Token non valido' });
      return;
    }
    next(error);
  }
};

/**
 * Check if portal user has required permission
 */
export const requirePortalPermission = (...requiredPermissions: string[]) => {
  return (req: PortalRequest, res: Response, next: NextFunction): void => {
    if (!req.portalUser) {
      res.status(401).json({ success: false, error: 'Non autenticato' });
      return;
    }

    const hasPermission = requiredPermissions.some(permission =>
      req.portalUser!.permissions.includes(permission)
    );

    if (!hasPermission) {
      res.status(403).json({ success: false, error: 'Permessi insufficienti' });
      return;
    }

    next();
  };
};

/**
 * Restrict to customer portal users only
 */
export const customerOnly = (
  req: PortalRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.portalUser || req.portalUser.type !== 'CUSTOMER') {
    res.status(403).json({ success: false, error: 'Accesso riservato ai clienti' });
    return;
  }
  next();
};

/**
 * Restrict to supplier portal users only
 */
export const supplierOnly = (
  req: PortalRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.portalUser || req.portalUser.type !== 'SUPPLIER') {
    res.status(403).json({ success: false, error: 'Accesso riservato ai fornitori' });
    return;
  }
  next();
};

/**
 * Validate session token (for session-based auth as alternative to JWT)
 */
export const validatePortalSession = async (
  req: PortalRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionToken = req.headers['x-portal-session'] as string;

    if (!sessionToken) {
      res.status(401).json({ success: false, error: 'Sessione non fornita' });
      return;
    }

    const session = await prisma.portalSession.findFirst({
      where: {
        token: sessionToken,
        isValid: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        portalAccess: {
          select: {
            id: true,
            type: true,
            email: true,
            status: true,
            permissions: true,
            organizationId: true,
            contactId: true,
            supplierId: true
          }
        }
      }
    });

    if (!session || !session.portalAccess) {
      res.status(401).json({ success: false, error: 'Sessione non valida o scaduta' });
      return;
    }

    if (session.portalAccess.status !== 'ACTIVE') {
      res.status(401).json({ success: false, error: 'Accesso portale non attivo' });
      return;
    }

    // Update last activity
    await prisma.portalSession.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() }
    });

    req.portalUser = {
      portalAccessId: session.portalAccess.id,
      type: session.portalAccess.type as 'CUSTOMER' | 'SUPPLIER',
      email: session.portalAccess.email,
      organizationId: session.portalAccess.organizationId,
      permissions: session.portalAccess.permissions as string[],
      contactId: session.portalAccess.contactId || undefined,
      supplierId: session.portalAccess.supplierId || undefined
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authenticatePortal,
  requirePortalPermission,
  customerOnly,
  supplierOnly,
  validatePortalSession
};
