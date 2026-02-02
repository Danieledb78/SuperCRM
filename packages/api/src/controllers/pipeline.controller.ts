import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getPipelines = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { stages: { orderBy: { order: 'asc' } }, _count: { select: { deals: true } } },
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, data: pipelines });
  } catch (error) { next(error); }
};

export const getPipeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { stages: { orderBy: { order: 'asc' }, include: { deals: { include: { contact: true, company: true } } } } },
    });
    if (!pipeline) throw new AppError('Pipeline non trovata', 404);
    res.json({ success: true, data: pipeline });
  } catch (error) { next(error); }
};

export const createPipeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipeline = await prisma.pipeline.create({ data: { ...req.body, organizationId: req.user!.organizationId! } });
    res.status(201).json({ success: true, data: pipeline });
  } catch (error) { next(error); }
};

export const updatePipeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipeline = await prisma.pipeline.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: pipeline });
  } catch (error) { next(error); }
};

export const deletePipeline = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.pipeline.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Pipeline eliminata' });
  } catch (error) { next(error); }
};

export const getStages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stages = await prisma.pipelineStage.findMany({ where: { pipelineId: req.params.id }, orderBy: { order: 'asc' } });
    res.json({ success: true, data: stages });
  } catch (error) { next(error); }
};

export const createStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stage = await prisma.pipelineStage.create({ data: { ...req.body, pipelineId: req.params.id } });
    res.status(201).json({ success: true, data: stage });
  } catch (error) { next(error); }
};

export const updateStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stage = await prisma.pipelineStage.update({ where: { id: req.params.stageId }, data: req.body });
    res.json({ success: true, data: stage });
  } catch (error) { next(error); }
};

export const deleteStage = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.pipelineStage.delete({ where: { id: req.params.stageId } });
    res.json({ success: true, message: 'Fase eliminata' });
  } catch (error) { next(error); }
};

export const reorderStages = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { stages } = req.body;
    await Promise.all(stages.map((s: { id: string; order: number }) => prisma.pipelineStage.update({ where: { id: s.id }, data: { order: s.order } })));
    res.json({ success: true, message: 'Ordine aggiornato' });
  } catch (error) { next(error); }
};
