import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';

export const getInvoices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status, type, contactId, companyId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({ where, include: { contact: { select: { id: true, firstName: true, lastName: true } }, company: { select: { id: true, name: true } } }, orderBy: { [String(sortBy)]: sortOrder }, skip, take: Number(limit) }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ success: true, data: invoices, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { contact: true, company: true, owner: true, items: { include: { product: true }, orderBy: { order: 'asc' } }, payments: true } });
    if (!invoice) throw new AppError('Fattura non trovata', 404);
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

export const createInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { items, ...data } = req.body;
    const organizationId = req.user!.organizationId!;
    const year = new Date().getFullYear();
    const prefix = data.type === 'CREDIT_NOTE' ? 'NC' : data.type === 'PROFORMA' ? 'PF' : 'FT';
    const count = await prisma.invoice.count({ where: { organizationId, number: { startsWith: `${prefix}-${year}` } } });
    const number = `${prefix}-${year}-${String(count + 1).padStart(5, '0')}`;

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

    const invoice = await prisma.invoice.create({ data: { ...data, number, organizationId, ownerId: data.ownerId || req.user!.id, subtotal, taxAmount, total, discountAmount, items: { create: processedItems } }, include: { items: true } });
    res.status(201).json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

export const updateInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.invoice.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Fattura non trovata', 404);
    if (existing.status !== 'DRAFT') throw new AppError('Solo fatture in bozza possono essere modificate', 400);
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

export const deleteInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Fattura eliminata' });
  } catch (error) { next(error); }
};

export const sendInvoice = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await prisma.invoice.update({ where: { id: req.params.id }, data: { status: 'SENT' } });
    res.json({ success: true, data: invoice });
  } catch (error) { next(error); }
};

export const addPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) throw new AppError('Fattura non trovata', 404);

    const payment = await prisma.payment.create({ data: { ...req.body, invoiceId: req.params.id } });
    const newPaidAmount = Number(invoice.paidAmount) + Number(req.body.amount);
    const newStatus = newPaidAmount >= Number(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';

    await prisma.invoice.update({ where: { id: req.params.id }, data: { paidAmount: newPaidAmount, paidDate: newStatus === 'PAID' ? new Date() : null, status: newStatus } });

    res.status(201).json({ success: true, data: payment });
  } catch (error) { next(error); }
};

export const removePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId } });
    if (!payment) throw new AppError('Pagamento non trovato', 404);

    await prisma.payment.delete({ where: { id: req.params.paymentId } });

    const invoice = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (invoice) {
      const newPaidAmount = Number(invoice.paidAmount) - Number(payment.amount);
      const newStatus = newPaidAmount <= 0 ? 'SENT' : newPaidAmount >= Number(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';
      await prisma.invoice.update({ where: { id: req.params.id }, data: { paidAmount: Math.max(0, newPaidAmount), paidDate: null, status: newStatus } });
    }

    res.json({ success: true, message: 'Pagamento rimosso' });
  } catch (error) { next(error); }
};

export const generatePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => { res.json({ success: true, message: 'PDF not implemented' }); };
export const generateXML = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => { res.json({ success: true, message: 'XML e-invoice not implemented' }); };
