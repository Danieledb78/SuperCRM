import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getTags = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tags = await prisma.tag.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { name: 'asc' } });
    res.json({ success: true, data: tags });
  } catch (error) { next(error); }
};

export const getTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tag = await prisma.tag.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { _count: { select: { contacts: true, companies: true, deals: true } } } });
    if (!tag) throw new AppError('Tag non trovato', 404);
    res.json({ success: true, data: tag });
  } catch (error) { next(error); }
};

export const createTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tag = await prisma.tag.create({ data: { ...req.body, organizationId: req.user!.organizationId! } });
    res.status(201).json({ success: true, data: tag });
  } catch (error) { next(error); }
};

export const updateTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tag = await prisma.tag.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: tag });
  } catch (error) { next(error); }
};

export const deleteTag = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.tag.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Tag eliminato' });
  } catch (error) { next(error); }
};
