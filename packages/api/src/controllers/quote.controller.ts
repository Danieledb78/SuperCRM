import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

const generateQuoteNumber = async (organizationId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({ where: { organizationId, number: { startsWith: `PV-${year}` } } });
  return `PV-${year}-${String(count + 1).padStart(5, '0')}`;
};

export const getQuotes = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, contactId, companyId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (status) where.status = status;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { contact: { select: { id: true, firstName: true, lastName: true } }, company: { select: { id: true, name: true } }, owner: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit),
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({ success: true, data: quotes, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { contact: true, company: true, owner: true, deal: true, items: { include: { product: true }, orderBy: { order: 'asc' } } },
    });
    if (!quote) throw new AppError('Preventivo non trovato', 404);
    res.json({ success: true, data: quote });
  } catch (error) { next(error); }
};

export const createQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, ...data } = req.body;
    const organizationId = req.user!.organizationId!;
    const number = await generateQuoteNumber(organizationId);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    const processedItems = items.map((item: any, index: number) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice) * (1 - (Number(item.discountPercent) || 0) / 100);
      const itemTax = itemTotal * Number(item.vatRate) / 100;
      subtotal += itemTotal;
      taxAmount += itemTax;
      return { ...item, total: itemTotal, order: index };
    });

    const discountAmount = data.discountPercent ? subtotal * Number(data.discountPercent) / 100 : 0;
    const total = subtotal - discountAmount + taxAmount;

    const quote = await prisma.quote.create({
      data: { ...data, number, organizationId, ownerId: data.ownerId || req.user!.id, subtotal, taxAmount, total, discountAmount, items: { create: processedItems } },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error) { next(error); }
};

export const updateQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.quote.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Preventivo non trovato', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Solo preventivi in bozza possono essere modificati', 400);

    const { items, ...data } = req.body;

    let updateData: any = { ...data };

    if (items) {
      let subtotal = 0;
      let taxAmount = 0;
      const processedItems = items.map((item: any, index: number) => {
        const itemTotal = Number(item.quantity) * Number(item.unitPrice) * (1 - (Number(item.discountPercent) || 0) / 100);
        const itemTax = itemTotal * Number(item.vatRate) / 100;
        subtotal += itemTotal;
        taxAmount += itemTax;
        return { ...item, total: itemTotal, order: index };
      });

      const discountAmount = data.discountPercent ? subtotal * Number(data.discountPercent) / 100 : 0;
      const total = subtotal - discountAmount + taxAmount;

      updateData = { ...updateData, subtotal, taxAmount, total, discountAmount, items: { deleteMany: {}, create: processedItems } };
    }

    const quote = await prisma.quote.update({ where: { id: req.params.id }, data: updateData, include: { items: true } });
    res.json({ success: true, data: quote });
  } catch (error) { next(error); }
};

export const deleteQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.quote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Preventivo eliminato' });
  } catch (error) { next(error); }
};

export const sendQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quote = await prisma.quote.update({ where: { id: req.params.id }, data: { status: 'SENT' } });
    // TODO: Send email
    res.json({ success: true, data: quote });
  } catch (error) { next(error); }
};

export const convertToInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!quote) throw new AppError('Preventivo non trovato', 404);

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({ where: { organizationId: quote.organizationId, number: { startsWith: `FT-${year}` } } });
    const invoiceNumber = `FT-${year}-${String(count + 1).padStart(5, '0')}`;

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        organizationId: quote.organizationId,
        ownerId: quote.ownerId,
        contactId: quote.contactId,
        companyId: quote.companyId,
        quoteId: quote.id,
        subtotal: quote.subtotal,
        discountPercent: quote.discountPercent,
        discountAmount: quote.discountAmount,
        taxAmount: quote.taxAmount,
        total: quote.total,
        currency: quote.currency,
        items: { create: quote.items.map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, discountPercent: item.discountPercent, vatRate: item.vatRate, total: item.total, order: item.order, productId: item.productId })) },
      },
    });

    await prisma.quote.update({ where: { id: quote.id }, data: { status: 'CONVERTED' } });

    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

export const duplicateQuote = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quote = await prisma.quote.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!quote) throw new AppError('Preventivo non trovato', 404);

    const number = await generateQuoteNumber(quote.organizationId);

    const newQuote = await prisma.quote.create({
      data: {
        number,
        organizationId: quote.organizationId,
        ownerId: req.user!.id,
        contactId: quote.contactId,
        companyId: quote.companyId,
        dealId: quote.dealId,
        subject: quote.subject,
        notes: quote.notes,
        terms: quote.terms,
        subtotal: quote.subtotal,
        discountPercent: quote.discountPercent,
        discountAmount: quote.discountAmount,
        taxAmount: quote.taxAmount,
        total: quote.total,
        currency: quote.currency,
        items: { create: quote.items.map(item => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice, discountPercent: item.discountPercent, vatRate: item.vatRate, total: item.total, order: item.order, productId: item.productId })) },
      },
      include: { items: true },
    });

    res.json({ success: true, data: newQuote });
  } catch (error) { next(error); }
};

export const generatePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement PDF generation
    res.json({ success: true, message: 'PDF generation not implemented yet' });
  } catch (error) { next(error); }
};
