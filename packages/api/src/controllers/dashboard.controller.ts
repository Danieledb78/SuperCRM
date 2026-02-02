import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';

export const getStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const [contacts, companies, deals, projects, invoices] = await Promise.all([
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.company.count({ where: { organizationId: orgId } }),
      prisma.deal.count({ where: { organizationId: orgId, status: 'OPEN' } }),
      prisma.project.count({ where: { organizationId: orgId, status: 'IN_PROGRESS' } }),
      prisma.invoice.aggregate({ where: { organizationId: orgId, status: { in: ['SENT', 'PARTIALLY_PAID'] } }, _sum: { total: true } }),
    ]);

    res.json({ success: true, data: { totalContacts: contacts, totalCompanies: companies, openDeals: deals, activeProjects: projects, outstandingInvoices: invoices._sum.total || 0 } });
  } catch (error) { next(error); }
};

export const getSalesStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [wonDeals, totalValue, quotes] = await Promise.all([
      prisma.deal.count({ where: { organizationId: orgId, status: 'WON', actualCloseDate: { gte: startOfMonth } } }),
      prisma.deal.aggregate({ where: { organizationId: orgId, status: 'WON', actualCloseDate: { gte: startOfMonth } }, _sum: { value: true } }),
      prisma.quote.count({ where: { organizationId: orgId, status: 'ACCEPTED', updatedAt: { gte: startOfMonth } } }),
    ]);

    res.json({ success: true, data: { wonDealsThisMonth: wonDeals, revenueThisMonth: totalValue._sum.value || 0, acceptedQuotesThisMonth: quotes } });
  } catch (error) { next(error); }
};

export const getActivityStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const activities = await prisma.activity.groupBy({ by: ['type'], where: { owner: { organizationId: orgId }, createdAt: { gte: startOfWeek } }, _count: true });

    res.json({ success: true, data: activities });
  } catch (error) { next(error); }
};

export const getProjectStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user!.organizationId;
    const projects = await prisma.project.groupBy({ by: ['status'], where: { organizationId: orgId }, _count: true });
    res.json({ success: true, data: projects });
  } catch (error) { next(error); }
};

export const getRecentContacts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const contacts = await prisma.contact.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, firstName: true, lastName: true, email: true, status: true, createdAt: true } });
    res.json({ success: true, data: contacts });
  } catch (error) { next(error); }
};

export const getRecentDeals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const deals = await prisma.deal.findMany({ where: { organizationId: req.user!.organizationId }, orderBy: { updatedAt: 'desc' }, take: 10, include: { stage: { select: { name: true, color: true } }, contact: { select: { firstName: true, lastName: true } } } });
    res.json({ success: true, data: deals });
  } catch (error) { next(error); }
};

export const getRecentActivities = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const activities = await prisma.activity.findMany({ where: { owner: { organizationId: req.user!.organizationId } }, orderBy: { createdAt: 'desc' }, take: 20, include: { owner: { select: { firstName: true, lastName: true } }, contact: { select: { firstName: true, lastName: true } } } });
    res.json({ success: true, data: activities });
  } catch (error) { next(error); }
};

export const getRevenueChart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Last 12 months revenue
    const data: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const revenue = await prisma.invoice.aggregate({ where: { organizationId: req.user!.organizationId, status: 'PAID', paidDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { total: true } });

      data.push({ month: startOfMonth.toISOString().slice(0, 7), revenue: Number(revenue._sum.total || 0) });
    }
    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getPipelineChart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipeline = await prisma.pipeline.findFirst({ where: { organizationId: req.user!.organizationId, isDefault: true }, include: { stages: { include: { _count: { select: { deals: true } }, deals: { where: { status: 'OPEN' }, select: { value: true } } }, orderBy: { order: 'asc' } } } });

    const data = pipeline?.stages.map(stage => ({ name: stage.name, color: stage.color, count: stage._count.deals, value: stage.deals.reduce((acc, d) => acc + Number(d.value || 0), 0) })) || [];

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getLeadSourcesChart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sources = await prisma.contact.groupBy({ by: ['source'], where: { organizationId: req.user!.organizationId, source: { not: null } }, _count: true });
    res.json({ success: true, data: sources });
  } catch (error) { next(error); }
};
