import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getProducts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search, category, isActive, sortBy = 'name', sortOrder = 'asc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (search) where.OR = [{ name: { contains: String(search), mode: 'insensitive' } }, { sku: { contains: String(search), mode: 'insensitive' } }];
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.product.count({ where }),
    ]);

    res.json({ success: true, data: products, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { stockItems: { include: { warehouse: true } }, supplierProducts: { include: { supplier: true } } },
    });
    if (!product) throw new AppError('Prodotto non trovato', 404);
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await prisma.product.create({ data: { ...req.body, organizationId: req.user!.organizationId! } });
    res.status(201).json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.product.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Prodotto non trovato', 404);
    const product = await prisma.product.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Prodotto eliminato' });
  } catch (error) { next(error); }
};

export const getStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stock = await prisma.stockItem.findMany({ where: { productId: req.params.id }, include: { warehouse: true } });
    res.json({ success: true, data: stock });
  } catch (error) { next(error); }
};
