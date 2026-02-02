import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getSuppliers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, category, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (search) where.OR = [{ name: { contains: String(search), mode: 'insensitive' } }, { code: { contains: String(search), mode: 'insensitive' } }];
    if (category) where.category = category;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, include: { _count: { select: { purchaseOrders: true, products: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.supplier.count({ where }),
    ]);

    res.json({ success: true, data: suppliers, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { products: { include: { product: true } }, purchaseOrders: { take: 10, orderBy: { createdAt: 'desc' } } },
    });
    if (!supplier) throw new AppError('Fornitore non trovato', 404);
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const createSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const supplier = await prisma.supplier.create({ data: { ...req.body, organizationId: req.user!.organizationId! } });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const updateSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.supplier.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Fornitore non trovato', 404);
    const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: supplier });
  } catch (error) { next(error); }
};

export const deleteSupplier = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.supplier.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Fornitore eliminato' });
  } catch (error) { next(error); }
};

export const getSupplierProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const products = await prisma.supplierProduct.findMany({ where: { supplierId: req.params.id }, include: { product: true } });
    res.json({ success: true, data: products });
  } catch (error) { next(error); }
};

export const linkProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const link = await prisma.supplierProduct.create({ data: { ...req.body, supplierId: req.params.id } });
    res.status(201).json({ success: true, data: link });
  } catch (error) { next(error); }
};

export const unlinkProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.supplierProduct.delete({ where: { supplierId_productId: { supplierId: req.params.id, productId: req.params.productId } } });
    res.json({ success: true, message: 'Prodotto scollegato' });
  } catch (error) { next(error); }
};

export const getSupplierOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await prisma.purchaseOrder.findMany({ where: { supplierId: req.params.id }, orderBy: { createdAt: 'desc' } });
    res.json({ success: true, data: orders });
  } catch (error) { next(error); }
};
