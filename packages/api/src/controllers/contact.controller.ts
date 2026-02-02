import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getContacts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, status, companyId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = {
      organizationId: req.user!.organizationId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: String(search), mode: 'insensitive' } },
        { lastName: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    if (status) where.status = status;
    if (companyId) where.companyId = companyId;

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
          tags: { include: { tag: true } },
        },
        orderBy: { [String(sortBy)]: sortOrder },
        skip,
        take: Number(limit),
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, organizationId: req.user!.organizationId },
      include: {
        company: true,
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        tags: { include: { tag: true } },
        deals: { include: { stage: true } },
        quotes: { orderBy: { createdAt: 'desc' }, take: 5 },
        invoices: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });

    if (!contact) {
      throw new AppError('Contatto non trovato', 404);
    }

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

export const createContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = req.body;

    const contact = await prisma.contact.create({
      data: {
        ...data,
        organizationId: req.user!.organizationId!,
        ownerId: data.ownerId || req.user!.id,
      },
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

export const updateContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Verify contact exists and belongs to organization
    const existing = await prisma.contact.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      throw new AppError('Contatto non trovato', 404);
    }

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        company: { select: { id: true, name: true } },
        owner: { select: { id: true, firstName: true, lastName: true } },
        tags: { include: { tag: true } },
      },
    });

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

export const deleteContact = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const existing = await prisma.contact.findFirst({
      where: { id, organizationId: req.user!.organizationId },
    });

    if (!existing) {
      throw new AppError('Contatto non trovato', 404);
    }

    await prisma.contact.delete({ where: { id } });

    res.json({ success: true, message: 'Contatto eliminato' });
  } catch (error) {
    next(error);
  }
};

export const addTags = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { tagIds } = req.body;

    await prisma.contactTag.createMany({
      data: tagIds.map((tagId: string) => ({ contactId: id, tagId })),
      skipDuplicates: true,
    });

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

export const removeTag = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id, tagId } = req.params;

    await prisma.contactTag.delete({
      where: { contactId_tagId: { contactId: id, tagId } },
    });

    res.json({ success: true, message: 'Tag rimosso' });
  } catch (error) {
    next(error);
  }
};

export const getActivities = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const activities = await prisma.activity.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

export const getNotes = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    const notes = await prisma.note.findMany({
      where: { contactId: id },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });

    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
};
