import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, type, ownerId, contactId, dealId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { owner: { organizationId: req.user!.organizationId } };
    if (type) where.type = type;
    if (ownerId) where.ownerId = ownerId;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({ where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, contact: { select: { id: true, firstName: true, lastName: true } }, deal: { select: { id: true, title: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.activity.count({ where }),
    ]);

    res.json({ success: true, data: activities, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await prisma.activity.findUnique({ where: { id: req.params.id }, include: { owner: true, contact: true, deal: true } });
    if (!activity) throw new AppError('Attività non trovata', 404);
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const createActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await prisma.activity.create({ data: { ...req.body, ownerId: req.body.ownerId || req.user!.id } });
    if (req.body.contactId) await prisma.contact.update({ where: { id: req.body.contactId }, data: { lastContactedAt: new Date() } });
    res.status(201).json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const updateActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};

export const deleteActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.activity.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Attività eliminata' });
  } catch (error) { next(error); }
};

export const completeActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activity = await prisma.activity.update({ where: { id: req.params.id }, data: { completedAt: new Date(), outcome: req.body.outcome } });
    res.json({ success: true, data: activity });
  } catch (error) { next(error); }
};
