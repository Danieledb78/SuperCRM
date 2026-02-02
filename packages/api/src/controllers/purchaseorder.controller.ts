import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

const generatePONumber = async (organizationId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count({ where: { organizationId, number: { startsWith: `OA-${year}` } } });
  return `OA-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, supplierId, projectId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (projectId) where.projectId = projectId;

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({ where, include: { supplier: { select: { id: true, name: true } }, project: { select: { id: true, code: true, name: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.purchaseOrder.count({ where }),
    ]);

    res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { supplier: true, project: true, items: { include: { product: true }, orderBy: { order: 'asc' } } } });
    if (!order) throw new AppError('Ordine non trovato', 404);
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, ...data } = req.body;
    const organizationId = req.user!.organizationId!;
    const number = await generatePONumber(organizationId);

    let subtotal = 0, taxAmount = 0;
    const processedItems = items.map((item: any, index: number) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice) * (1 - (Number(item.discountPercent) || 0) / 100);
      const itemTax = itemTotal * Number(item.vatRate) / 100;
      subtotal += itemTotal;
      taxAmount += itemTax;
      return { ...item, total: itemTotal, order: index };
    });

    const discountAmount = data.discountPercent ? subtotal * Number(data.discountPercent) / 100 : 0;
    const total = subtotal - discountAmount + taxAmount;

    const order = await prisma.purchaseOrder.create({ data: { ...data, number, organizationId, subtotal, taxAmount, total, discountAmount, items: { create: processedItems } }, include: { items: true } });
    res.status(201).json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const updatePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Ordine non trovato', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Solo ordini in bozza possono essere modificati', 400);
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const deletePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.purchaseOrder.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Ordine eliminato' });
  } catch (error) { next(error); }
};

export const sendOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'SENT' } });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const confirmOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'CONFIRMED', expectedDate: req.body.expectedDate } });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const receiveOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'RECEIVED', receivedDate: new Date() }, include: { items: true } });

    // Update stock and item received quantities
    for (const item of order.items) {
      if (item.productId) {
        await prisma.purchaseOrderItem.update({ where: { id: item.id }, data: { receivedQty: item.quantity } });
        // Get default warehouse
        const warehouse = await prisma.warehouse.findFirst({ where: { organizationId: order.organizationId, isDefault: true } });
        if (warehouse) {
          await prisma.stockMovement.create({ data: { warehouseId: warehouse.id, productId: item.productId, type: 'IN_PURCHASE', quantity: item.quantity, reference: order.number, projectId: order.projectId } });
          await prisma.stockItem.upsert({ where: { warehouseId_productId: { warehouseId: warehouse.id, productId: item.productId } }, update: { quantity: { increment: Number(item.quantity) } }, create: { warehouseId: warehouse.id, productId: item.productId, quantity: Number(item.quantity) } });
        }
      }
    }

    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const receivePartial = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items } = req.body; // [{ itemId, receivedQty }]

    for (const { itemId, receivedQty } of items) {
      await prisma.purchaseOrderItem.update({ where: { id: itemId }, data: { receivedQty: { increment: Number(receivedQty) } } });
    }

    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'PARTIALLY_RECEIVED' }, include: { items: true } });

    // Check if fully received
    const allReceived = order.items.every(item => Number(item.receivedQty) >= Number(item.quantity));
    if (allReceived) {
      await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'RECEIVED', receivedDate: new Date() } });
    }

    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.update({ where: { id: req.params.id }, data: { status: 'CANCELLED' } });
    res.json({ success: true, data: order });
  } catch (error) { next(error); }
};

export const generatePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ success: true, message: 'PDF not implemented' });
  } catch (error) { next(error); }
};
