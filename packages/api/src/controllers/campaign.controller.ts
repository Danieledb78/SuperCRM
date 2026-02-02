import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getCampaigns = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (status) where.status = status;
    if (type) where.type = type;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({ where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { contacts: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.campaign.count({ where }),
    ]);

    res.json({ success: true, data: campaigns, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { owner: true, contacts: { include: { contact: true } } } });
    if (!campaign) throw new AppError('Campagna non trovata', 404);
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const createCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contactIds, ...data } = req.body;
    const campaign = await prisma.campaign.create({
      data: { ...data, organizationId: req.user!.organizationId!, ownerId: data.ownerId || req.user!.id, totalRecipients: contactIds?.length || 0, contacts: contactIds ? { create: contactIds.map((id: string) => ({ contactId: id })) } : undefined },
    });
    res.status(201).json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const updateCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const deleteCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.campaign.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Campagna eliminata' });
  } catch (error) { next(error); }
};

export const scheduleCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: { status: 'SCHEDULED', scheduledAt: req.body.scheduledAt } });
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const sendCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: { status: 'SENDING', sentAt: new Date() } });
    // TODO: Implement actual sending
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const pauseCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: { status: 'PAUSED' } });
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const cancelCampaign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, data: campaign });
  } catch (error) { next(error); }
};

export const getCampaignStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const campaign = await prisma.campaign.findUnique({ where: { id: req.params.id } });
    if (!campaign) throw new AppError('Campagna non trovata', 404);
    res.json({ success: true, data: { totalRecipients: campaign.totalRecipients, delivered: campaign.delivered, opened: campaign.opened, clicked: campaign.clicked, bounced: campaign.bounced, unsubscribed: campaign.unsubscribed, openRate: campaign.delivered > 0 ? (campaign.opened / campaign.delivered * 100).toFixed(2) : 0, clickRate: campaign.opened > 0 ? (campaign.clicked / campaign.opened * 100).toFixed(2) : 0 } });
  } catch (error) { next(error); }
};
