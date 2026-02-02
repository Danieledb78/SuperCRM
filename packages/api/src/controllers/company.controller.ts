import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getCompanies = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: 'insensitive' } },
        { email: { contains: String(search), mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { contacts: true, deals: true } } },
        orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit),
      }),
      prisma.company.count({ where }),
    ]);

    res.json({ success: true, data: companies, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await prisma.company.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { owner: true, contacts: { take: 10 }, deals: { take: 5 }, quotes: { take: 5 }, invoices: { take: 5 } },
    });
    if (!company) throw new AppError('Azienda non trovata', 404);
    res.json({ success: true, data: company });
  } catch (error) { next(error); }
};

export const createCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const company = await prisma.company.create({
      data: { ...req.body, organizationId: req.user!.organizationId!, ownerId: req.body.ownerId || req.user!.id },
    });
    res.status(201).json({ success: true, data: company });
  } catch (error) { next(error); }
};

export const updateCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.company.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Azienda non trovata', 404);
    const company = await prisma.company.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: company });
  } catch (error) { next(error); }
};

export const deleteCompany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.company.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Azienda non trovata', 404);
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Azienda eliminata' });
  } catch (error) { next(error); }
};

export const getCompanyContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contacts = await prisma.contact.findMany({ where: { companyId: req.params.id }, orderBy: { lastName: 'asc' } });
    res.json({ success: true, data: contacts });
  } catch (error) { next(error); }
};
