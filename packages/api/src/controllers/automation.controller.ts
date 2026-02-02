import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getAutomations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({ where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { actions: true, logs: true } } }, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.automation.count({ where }),
    ]);

    res.json({ success: true, data: automations, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { owner: true, actions: { orderBy: { order: 'asc' } } } });
    if (!automation) throw new AppError('Automazione non trovata', 404);
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const createAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { actions, ...data } = req.body;
    const automation = await prisma.automation.create({ data: { ...data, organizationId: req.user!.organizationId!, ownerId: data.ownerId || req.user!.id, actions: actions ? { create: actions } : undefined }, include: { actions: true } });
    res.status(201).json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const updateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { actions, ...data } = req.body;
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { ...data, actions: actions ? { deleteMany: {}, create: actions } : undefined }, include: { actions: true } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const deleteAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.automation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Automazione eliminata' });
  } catch (error) { next(error); }
};

export const activateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { isActive: true } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const deactivateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const triggerAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement automation triggering
    res.json({ success: true, message: 'Automation triggered' });
  } catch (error) { next(error); }
};

export const getAutomationLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.automationLog.findMany({ where: { automationId: req.params.id }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { executedAt: 'desc' }, take: 100 });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};
