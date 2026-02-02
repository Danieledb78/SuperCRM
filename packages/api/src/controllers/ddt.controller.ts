import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

const generateDDTNumber = async (organizationId: string, type: string): Promise<string> => {
  const year = new Date().getFullYear();
  const prefix = type === 'INBOUND' ? 'DDT-E' : type === 'OUTBOUND' ? 'DDT-U' : 'DDT-I';
  const count = await prisma.dDT.count({ where: { organizationId, type: type as any, number: { startsWith: `${prefix}-${year}` } } });
  return `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const getDDTs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, type, status, projectId, supplierId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (projectId) where.projectId = projectId;
    if (supplierId) where.supplierId = supplierId;

    const [ddts, total] = await Promise.all([
      prisma.dDT.findMany({
        where,
        include: { contact: { select: { id: true, firstName: true, lastName: true } }, company: { select: { id: true, name: true } }, supplier: { select: { id: true, name: true } }, project: { select: { id: true, code: true, name: true } } },
        orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit),
      }),
      prisma.dDT.count({ where }),
    ]);

    res.json({ success: true, data: ddts, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getDDT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { contact: true, company: true, supplier: true, project: true, items: { include: { product: true } }, fromWarehouse: true, toWarehouse: true },
    });
    if (!ddt) throw new AppError('DDT non trovato', 404);
    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const createDDT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, items, ...data } = req.body;
    const organizationId = req.user!.organizationId!;
    const number = await generateDDTNumber(organizationId, type);

    const ddt = await prisma.dDT.create({
      data: { ...data, type, number, organizationId, items: { create: items } },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const updateDDT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.dDT.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('DDT non trovato', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Solo DDT in bozza possono essere modificati', 400);

    const { items, ...data } = req.body;
    const ddt = await prisma.dDT.update({
      where: { id: req.params.id },
      data: { ...data, items: items ? { deleteMany: {}, create: items } : undefined },
      include: { items: true },
    });

    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const deleteDDT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.dDT.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('DDT non trovato', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Solo DDT in bozza possono essere eliminati', 400);
    await prisma.dDT.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'DDT eliminato' });
  } catch (error) { next(error); }
};

export const markReady = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.update({ where: { id: req.params.id }, data: { status: 'READY' } });
    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const markInTransit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.update({ where: { id: req.params.id }, data: { status: 'IN_TRANSIT', transportDate: new Date() } });
    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const markDelivered = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.update({ where: { id: req.params.id }, data: { status: 'DELIVERED', deliveryDate: new Date() }, include: { items: true } });

    // Create stock movements
    if (ddt.fromWarehouseId) {
      for (const item of ddt.items) {
        if (item.productId) {
          await prisma.stockMovement.create({ data: { warehouseId: ddt.fromWarehouseId, productId: item.productId, type: 'OUT_SALE', quantity: item.quantity, reference: ddt.number, ddtId: ddt.id, projectId: ddt.projectId } });
          await prisma.stockItem.update({ where: { warehouseId_productId: { warehouseId: ddt.fromWarehouseId, productId: item.productId } }, data: { quantity: { decrement: Number(item.quantity) } } });
        }
      }
    }

    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const cancelDDT = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, data: ddt });
  } catch (error) { next(error); }
};

export const generatePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement PDF generation
    res.json({ success: true, message: 'PDF generation not implemented yet' });
  } catch (error) { next(error); }
};
