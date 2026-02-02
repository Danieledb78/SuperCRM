import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, entity, isPublic } = req.query;
    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };

    // Non-admin users can only see public reports or their own
    if (!['ADMIN', 'CEO', 'COO'].includes(req.user!.role)) {
      where.OR = [{ isPublic: true }, { createdById: req.user!.id }];
    }

    if (type) where.type = type;
    if (entity) where.entity = entity;
    if (isPublic !== undefined) where.isPublic = isPublic === 'true';

    const reports = await prisma.report.findMany({
      where,
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: [{ isFavorite: 'desc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: reports });
  } catch (error) { next(error); }
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await prisma.report.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!report) throw new AppError('Report non trovato', 404);
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const createReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await prisma.report.create({
      data: { ...req.body, organizationId: req.user!.organizationId!, createdById: req.user!.id },
    });
    res.status(201).json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const updateReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await prisma.report.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: report });
  } catch (error) { next(error); }
};

export const deleteReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.report.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Report eliminato' });
  } catch (error) { next(error); }
};

export const runReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const report = await prisma.report.findUnique({ where: { id: req.params.id } });
    if (!report) throw new AppError('Report non trovato', 404);

    const config = report.config as Record<string, unknown>;
    const { filters, dateRange } = req.body;

    // Build query based on entity and config
    let data: unknown[] = [];
    const orgId = req.user!.organizationId;

    switch (report.entity) {
      case 'CONTACTS':
        data = await prisma.contact.findMany({ where: { organizationId: orgId, ...filters }, include: { company: { select: { name: true } } }, take: 1000 });
        break;
      case 'DEALS':
        data = await prisma.deal.findMany({ where: { organizationId: orgId, ...filters }, include: { stage: true, contact: true, company: true }, take: 1000 });
        break;
      case 'QUOTES':
        data = await prisma.quote.findMany({ where: { organizationId: orgId, ...filters }, include: { contact: true, company: true }, take: 1000 });
        break;
      case 'INVOICES':
        data = await prisma.invoice.findMany({ where: { organizationId: orgId, ...filters }, include: { contact: true, company: true }, take: 1000 });
        break;
      case 'PROJECTS':
        data = await prisma.project.findMany({ where: { organizationId: orgId, ...filters }, include: { contact: true, company: true, _count: { select: { phases: true, costs: true } } }, take: 1000 });
        break;
      case 'PRODUCTS':
        data = await prisma.product.findMany({ where: { organizationId: orgId, ...filters }, include: { stockItems: true }, take: 1000 });
        break;
      case 'SUPPLIERS':
        data = await prisma.supplier.findMany({ where: { organizationId: orgId, ...filters }, include: { _count: { select: { purchaseOrders: true } } }, take: 1000 });
        break;
      default:
        data = [];
    }

    await prisma.report.update({ where: { id: report.id }, data: { lastRunAt: new Date() } });

    res.json({ success: true, data: { report, results: data, generatedAt: new Date() } });
  } catch (error) { next(error); }
};

export const exportReport = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement export to CSV/Excel
    res.json({ success: true, message: 'Export not implemented yet' });
  } catch (error) { next(error); }
};

// Pre-built reports
export const getSalesSummary = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;
    const orgId = req.user!.organizationId;

    const start = startDate ? new Date(String(startDate)) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(String(endDate)) : new Date();

    const [wonDeals, lostDeals, quotes, invoices] = await Promise.all([
      prisma.deal.aggregate({ where: { organizationId: orgId, status: 'WON', actualCloseDate: { gte: start, lte: end } }, _sum: { value: true }, _count: true }),
      prisma.deal.aggregate({ where: { organizationId: orgId, status: 'LOST', actualCloseDate: { gte: start, lte: end } }, _count: true }),
      prisma.quote.aggregate({ where: { organizationId: orgId, status: 'ACCEPTED', updatedAt: { gte: start, lte: end } }, _sum: { total: true }, _count: true }),
      prisma.invoice.aggregate({ where: { organizationId: orgId, status: 'PAID', paidDate: { gte: start, lte: end } }, _sum: { total: true }, _count: true }),
    ]);

    const winRate = (wonDeals._count + lostDeals._count) > 0
      ? (wonDeals._count / (wonDeals._count + lostDeals._count) * 100).toFixed(1)
      : 0;

    res.json({ success: true, data: { period: { start, end }, dealsClosed: wonDeals._count, dealsValue: wonDeals._sum.value || 0, dealsLost: lostDeals._count, winRate, quotesAccepted: quotes._count, quotesValue: quotes._sum.total || 0, invoicesPaid: invoices._count, revenue: invoices._sum.total || 0 } });
  } catch (error) { next(error); }
};

export const getPipelineAnalysis = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: req.user!.organizationId, isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            deals: { where: { status: 'OPEN' }, select: { value: true, createdAt: true } },
          },
        },
      },
    });

    const stageData = pipeline?.stages.map(stage => ({
      name: stage.name,
      color: stage.color,
      probability: stage.probability,
      dealCount: stage.deals.length,
      totalValue: stage.deals.reduce((acc, d) => acc + Number(d.value || 0), 0),
      weightedValue: stage.deals.reduce((acc, d) => acc + Number(d.value || 0), 0) * stage.probability / 100,
      avgAge: stage.deals.length > 0
        ? Math.round(stage.deals.reduce((acc, d) => acc + (Date.now() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24), 0) / stage.deals.length)
        : 0,
    })) || [];

    res.json({ success: true, data: { pipeline: pipeline?.name, stages: stageData, totalPipelineValue: stageData.reduce((acc, s) => acc + s.totalValue, 0), weightedPipelineValue: stageData.reduce((acc, s) => acc + s.weightedValue, 0) } });
  } catch (error) { next(error); }
};

export const getRevenueTrend = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { months = 12 } = req.query;
    const orgId = req.user!.organizationId;

    const data: { month: string; revenue: number; invoices: number; quotes: number }[] = [];

    for (let i = Number(months) - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const [revenue, invoiceCount, quoteCount] = await Promise.all([
        prisma.invoice.aggregate({ where: { organizationId: orgId, status: 'PAID', paidDate: { gte: startOfMonth, lte: endOfMonth } }, _sum: { total: true } }),
        prisma.invoice.count({ where: { organizationId: orgId, issueDate: { gte: startOfMonth, lte: endOfMonth } } }),
        prisma.quote.count({ where: { organizationId: orgId, issueDate: { gte: startOfMonth, lte: endOfMonth } } }),
      ]);

      data.push({ month: startOfMonth.toISOString().slice(0, 7), revenue: Number(revenue._sum.total || 0), invoices: invoiceCount, quotes: quoteCount });
    }

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getProjectProfitability = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const projects = await prisma.project.findMany({
      where: { organizationId: req.user!.organizationId, status: { in: ['COMPLETED', 'IN_PROGRESS'] } },
      include: { materials: true, costs: true, team: { include: { workLogs: true } } },
      take: 50,
    });

    const data = projects.map(project => {
      const materialsCost = project.materials.reduce((acc, m) => acc + Number(m.totalCost), 0);
      const otherCosts = project.costs.reduce((acc, c) => acc + Number(c.amount), 0);
      const laborCost = project.team.reduce((acc, t) =>
        acc + t.workLogs.reduce((h, l) => h + Number(l.hours) * Number(t.hourlyRate || 0), 0), 0
      );
      const totalCost = materialsCost + otherCosts + laborCost;
      const estimatedValue = Number(project.estimatedValue || 0);
      const margin = estimatedValue - totalCost;
      const marginPercent = estimatedValue > 0 ? (margin / estimatedValue * 100).toFixed(1) : 0;

      return { id: project.id, code: project.code, name: project.name, status: project.status, estimatedValue, materialsCost, laborCost, otherCosts, totalCost, margin, marginPercent };
    });

    res.json({ success: true, data });
  } catch (error) { next(error); }
};

export const getSupplierPerformance = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { organizationId: req.user!.organizationId, isActive: true },
      include: {
        purchaseOrders: { where: { status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED'] } }, select: { total: true, expectedDate: true, receivedDate: true } },
      },
    });

    const data = suppliers.map(supplier => {
      const orders = supplier.purchaseOrders;
      const totalOrders = orders.length;
      const totalSpent = orders.reduce((acc, o) => acc + Number(o.total), 0);
      const onTimeDeliveries = orders.filter(o => o.receivedDate && o.expectedDate && o.receivedDate <= o.expectedDate).length;
      const onTimeRate = totalOrders > 0 ? (onTimeDeliveries / totalOrders * 100).toFixed(1) : 0;

      return { id: supplier.id, name: supplier.name, category: supplier.category, rating: supplier.rating, totalOrders, totalSpent, onTimeRate };
    });

    res.json({ success: true, data: data.sort((a, b) => b.totalSpent - a.totalSpent) });
  } catch (error) { next(error); }
};

export const getInventoryStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({ where: { organizationId: req.user!.organizationId }, select: { id: true } });
    const warehouseIds = warehouses.map(w => w.id);

    const [totalItems, lowStock, outOfStock, totalValue] = await Promise.all([
      prisma.stockItem.count({ where: { warehouseId: { in: warehouseIds } } }),
      prisma.stockItem.count({ where: { warehouseId: { in: warehouseIds }, quantity: { gt: 0 }, minLevel: { not: null }, AND: { quantity: { lte: prisma.stockItem.fields.minLevel } } } }),
      prisma.stockItem.count({ where: { warehouseId: { in: warehouseIds }, quantity: { lte: 0 } } }),
      prisma.$queryRaw`SELECT SUM(si.quantity * p."unitPrice") as total FROM "StockItem" si JOIN "Product" p ON si."productId" = p.id WHERE si."warehouseId" = ANY(${warehouseIds})` as Promise<{ total: number }[]>,
    ]);

    const topProducts = await prisma.stockItem.findMany({
      where: { warehouseId: { in: warehouseIds }, quantity: { gt: 0 } },
      include: { product: { select: { name: true, sku: true, unitPrice: true } }, warehouse: { select: { name: true } } },
      orderBy: { quantity: 'desc' },
      take: 10,
    });

    res.json({ success: true, data: { totalItems, lowStock, outOfStock, totalValue: totalValue[0]?.total || 0, topProducts } });
  } catch (error) { next(error); }
};
