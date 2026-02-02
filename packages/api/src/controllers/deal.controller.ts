import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, status, pipelineId, stageId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (search) where.title = { contains: String(search), mode: 'insensitive' };
    if (status) where.status = status;
    if (pipelineId) where.pipelineId = pipelineId;
    if (stageId) where.stageId = stageId;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        include: {
          pipeline: { select: { id: true, name: true } },
          stage: { select: { id: true, name: true, color: true } },
          contact: { select: { id: true, firstName: true, lastName: true } },
          company: { select: { id: true, name: true } },
          owner: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit),
      }),
      prisma.deal.count({ where }),
    ]);

    res.json({ success: true, data: deals, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deal = await prisma.deal.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { pipeline: true, stage: true, contact: true, company: true, owner: true, activities: { take: 10 }, tasks: { take: 10 }, notes: { take: 10 }, quotes: { take: 5 } },
    });
    if (!deal) throw new AppError('Trattativa non trovata', 404);
    res.json({ success: true, data: deal });
  } catch (error) { next(error); }
};

export const createDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deal = await prisma.deal.create({
      data: { ...req.body, organizationId: req.user!.organizationId!, ownerId: req.body.ownerId || req.user!.id },
      include: { stage: true, contact: true, company: true },
    });
    res.status(201).json({ success: true, data: deal });
  } catch (error) { next(error); }
};

export const updateDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.deal.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Trattativa non trovata', 404);
    const deal = await prisma.deal.update({ where: { id: req.params.id }, data: req.body, include: { stage: true } });
    res.json({ success: true, data: deal });
  } catch (error) { next(error); }
};

export const deleteDeal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.deal.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Trattativa non trovata', 404);
    await prisma.deal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Trattativa eliminata' });
  } catch (error) { next(error); }
};

export const updateStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stageId, status } = req.body;
    const deal = await prisma.deal.update({
      where: { id: req.params.id },
      data: { stageId, status, actualCloseDate: status === 'WON' || status === 'LOST' ? new Date() : null },
      include: { stage: true },
    });
    res.json({ success: true, data: deal });
  } catch (error) { next(error); }
};
