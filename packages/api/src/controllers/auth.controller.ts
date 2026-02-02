import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@supercrm/database';
import { slugify } from '@supercrm/shared';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (userId: string, email: string, role: string, organizationId?: string) => {
  return jwt.sign(
    { userId, email, role, organizationId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password, firstName, lastName, organizationName } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new AppError('Email già registrata', 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization if provided
    let organizationId: string | undefined;
    if (organizationName) {
      const organization = await prisma.organization.create({
        data: {
          name: organizationName,
          slug: slugify(organizationName) + '-' + Date.now(),
        },
      });
      organizationId = organization.id;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        organizationId,
        role: organizationId ? 'ADMIN' : 'USER',
      },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    // Create default pipeline for new organization
    if (organizationId) {
      await prisma.pipeline.create({
        data: {
          name: 'Pipeline Vendite',
          isDefault: true,
          organizationId,
          stages: {
            create: [
              { name: 'Lead', color: '#9CA3AF', order: 0, probability: 10 },
              { name: 'Contattato', color: '#60A5FA', order: 1, probability: 20 },
              { name: 'Qualificato', color: '#A78BFA', order: 2, probability: 40 },
              { name: 'Proposta', color: '#FBBF24', order: 3, probability: 60 },
              { name: 'Negoziazione', color: '#FB923C', order: 4, probability: 80 },
              { name: 'Chiuso Vinto', color: '#34D399', order: 5, probability: 100 },
              { name: 'Chiuso Perso', color: '#F87171', order: 6, probability: 0 },
            ],
          },
        },
      });
    }

    const token = generateToken(user.id, user.email, user.role, user.organizationId || undefined);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organization: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Credenziali non valide', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new AppError('Credenziali non valide', 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id, user.email, user.role, user.organizationId || undefined);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organization: user.organization,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        organization: {
          select: { id: true, name: true, slug: true, logo: true },
        },
      },
    });

    if (!user) {
      throw new AppError('Utente non trovato', 404);
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { firstName, lastName, phone, avatar },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      throw new AppError('Utente non trovato', 404);
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw new AppError('Password attuale non corretta', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, message: 'Password aggiornata con successo' });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'Se l\'email esiste, riceverai le istruzioni per il reset',
    });

    if (user) {
      // TODO: Send password reset email
      // const resetToken = crypto.randomBytes(32).toString('hex');
      // await sendPasswordResetEmail(user.email, resetToken);
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, password } = req.body;

    // TODO: Implement token validation
    // For now, return an error
    throw new AppError('Funzionalità non ancora implementata', 501);
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Token richiesto', 400);
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError('Utente non valido', 401);
    }

    const newToken = generateToken(user.id, user.email, user.role, user.organizationId || undefined);

    res.json({ success: true, token: newToken });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, error: 'Token non valido' });
      return;
    }
    next(error);
  }
};
