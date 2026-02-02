import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getWarehouses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { organizationId: req.user!.organizationId },
      include: { _count: { select: { stockItems: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: warehouses });
  } catch (error) { next(error); }
};

export const getWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { stockItems: { include: { product: true } } },
    });
    if (!warehouse) throw new AppError('Magazzino non trovato', 404);
    res.json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const createWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await prisma.warehouse.create({ data: { ...req.body, organizationId: req.user!.organizationId! } });
    res.status(201).json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const updateWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouse = await prisma.warehouse.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: warehouse });
  } catch (error) { next(error); }
};

export const deleteWarehouse = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Magazzino eliminato' });
  } catch (error) { next(error); }
};

export const getWarehouseStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const stock = await prisma.stockItem.findMany({ where: { warehouseId: req.params.id }, include: { product: true }, orderBy: { product: { name: 'asc' } } });
    res.json({ success: true, data: stock });
  } catch (error) { next(error); }
};

export const getAllStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const warehouses = await prisma.warehouse.findMany({ where: { organizationId: req.user!.organizationId }, select: { id: true } });
    const warehouseIds = warehouses.map(w => w.id);

    const where: Record<string, unknown> = { warehouseId: { in: warehouseIds } };
    if (search) where.product = { name: { contains: String(search), mode: 'insensitive' } };

    const [stock, total] = await Promise.all([
      prisma.stockItem.findMany({ where, include: { product: true, warehouse: true }, skip, take: Number(limit) }),
      prisma.stockItem.count({ where }),
    ]);

    res.json({ success: true, data: stock, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getLowStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const warehouses = await prisma.warehouse.findMany({ where: { organizationId: req.user!.organizationId }, select: { id: true } });
    const warehouseIds = warehouses.map(w => w.id);

    const lowStock = await prisma.$queryRaw`
      SELECT si.*, p.name as product_name, p.sku, w.name as warehouse_name
      FROM "StockItem" si
      JOIN "Product" p ON si."productId" = p.id
      JOIN "Warehouse" w ON si."warehouseId" = w.id
      WHERE si."warehouseId" = ANY(${warehouseIds})
      AND si.quantity <= COALESCE(si."minLevel", 0)
    `;

    res.json({ success: true, data: lowStock });
  } catch (error) { next(error); }
};

export const getMovements = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, type, warehouseId, productId, from, to } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const warehouses = await prisma.warehouse.findMany({ where: { organizationId: req.user!.organizationId }, select: { id: true } });
    const warehouseIds = warehouses.map(w => w.id);

    const where: Record<string, unknown> = { warehouseId: { in: warehouseIds } };
    if (type) where.type = type;
    if (warehouseId) where.warehouseId = warehouseId;
    if (productId) where.productId = productId;
    if (from || to) {
      where.movementDate = {};
      if (from) (where.movementDate as Record<string, unknown>).gte = new Date(String(from));
      if (to) (where.movementDate as Record<string, unknown>).lte = new Date(String(to));
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({ where, include: { product: true, warehouse: true, project: true }, orderBy: { movementDate: 'desc' }, skip, take: Number(limit) }),
      prisma.stockMovement.count({ where }),
    ]);

    res.json({ success: true, data: movements, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const createMovement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { warehouseId, productId, type, quantity, reference, notes, projectId, ddtId } = req.body;

    const movement = await prisma.stockMovement.create({
      data: { warehouseId, productId, type, quantity, reference, notes, projectId, ddtId },
    });

    // Update stock
    const isInbound = type.startsWith('IN_');
    await prisma.stockItem.upsert({
      where: { warehouseId_productId: { warehouseId, productId } },
      update: { quantity: { [isInbound ? 'increment' : 'decrement']: Number(quantity) } },
      create: { warehouseId, productId, quantity: isInbound ? Number(quantity) : -Number(quantity) },
    });

    res.status(201).json({ success: true, data: movement });
  } catch (error) { next(error); }
};

export const getMovement = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const movement = await prisma.stockMovement.findUnique({ where: { id: req.params.id }, include: { product: true, warehouse: true, project: true } });
    if (!movement) throw new AppError('Movimento non trovato', 404);
    res.json({ success: true, data: movement });
  } catch (error) { next(error); }
};

export const transferStock = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity, notes } = req.body;

    // Create outbound movement
    await prisma.stockMovement.create({
      data: { warehouseId: fromWarehouseId, productId, type: 'OUT_TRANSFER', quantity, notes, reference: `Transfer to ${toWarehouseId}` },
    });

    // Create inbound movement
    await prisma.stockMovement.create({
      data: { warehouseId: toWarehouseId, productId, type: 'IN_TRANSFER', quantity, notes, reference: `Transfer from ${fromWarehouseId}` },
    });

    // Update stock levels
    await prisma.stockItem.update({ where: { warehouseId_productId: { warehouseId: fromWarehouseId, productId } }, data: { quantity: { decrement: Number(quantity) } } });
    await prisma.stockItem.upsert({
      where: { warehouseId_productId: { warehouseId: toWarehouseId, productId } },
      update: { quantity: { increment: Number(quantity) } },
      create: { warehouseId: toWarehouseId, productId, quantity: Number(quantity) },
    });

    res.json({ success: true, message: 'Trasferimento completato' });
  } catch (error) { next(error); }
};
