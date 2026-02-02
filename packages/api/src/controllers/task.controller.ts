import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, priority, ownerId, contactId, dealId, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { owner: { organizationId: req.user!.organizationId } };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (ownerId) where.ownerId = ownerId;
    if (contactId) where.contactId = contactId;
    if (dealId) where.dealId = dealId;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, contact: { select: { id: true, firstName: true, lastName: true } }, deal: { select: { id: true, title: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.task.count({ where }),
    ]);

    res.json({ success: true, data: tasks, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id }, include: { owner: true, contact: true, deal: true } });
    if (!task) throw new AppError('Attività non trovata', 404);
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const createTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.create({ data: { ...req.body, ownerId: req.body.ownerId || req.user!.id } });
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const deleteTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Attività eliminata' });
  } catch (error) { next(error); }
};

export const updateStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status: req.body.status, completedAt: req.body.status === 'COMPLETED' ? new Date() : null } });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};

export const completeTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { status: 'COMPLETED', completedAt: new Date() } });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
};
