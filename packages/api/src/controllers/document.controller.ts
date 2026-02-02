import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { formatCurrency, formatDate } from '@supercrm/shared';

// Note: In production, you would use a proper PDF library like puppeteer, pdfkit, or a service
// This is a simplified implementation that returns HTML which can be converted to PDF on the frontend

const renderTemplate = async (templateType: string, organizationId: string, data: Record<string, unknown>): Promise<{ html: string; styles: string }> => {
  const template = await prisma.documentTemplate.findFirst({
    where: { organizationId, type: templateType as any, isDefault: true, isActive: true },
  });

  if (!template) {
    throw new AppError(`Template ${templateType} non trovato`, 404);
  }

  let html = template.content;
  const header = template.headerContent || '';
  const footer = template.footerContent || '';

  // Replace all variables
  const replaceVariables = (content: string, obj: Record<string, unknown>, prefix = ''): string => {
    let result = content;
    Object.entries(obj).forEach(([key, value]) => {
      const varName = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result = replaceVariables(result, value as Record<string, unknown>, varName);
      } else if (Array.isArray(value)) {
        // Handle arrays (items)
        const arrayPattern = new RegExp(`{{#${varName}}}([\\s\\S]*?){{/${varName}}}`, 'g');
        result = result.replace(arrayPattern, (_match, itemTemplate) => {
          return value.map((item, index) => {
            let itemHtml = itemTemplate;
            itemHtml = itemHtml.replace(/{{index}}/g, String(index + 1));
            if (typeof item === 'object' && item !== null) {
              Object.entries(item).forEach(([itemKey, itemValue]) => {
                itemHtml = itemHtml.replace(new RegExp(`{{${itemKey}}}`, 'g'), String(itemValue ?? ''));
              });
            }
            return itemHtml;
          }).join('');
        });
      } else {
        result = result.replace(new RegExp(`{{${varName}}}`, 'g'), String(value ?? ''));
      }
    });
    return result;
  };

  html = replaceVariables(html, data);
  const fullHtml = `${replaceVariables(header, data)}${html}${replaceVariables(footer, data)}`;

  return { html: fullHtml, styles: template.styles || '' };
};

const saveGeneratedDocument = async (
  organizationId: string,
  generatedById: string,
  name: string,
  type: string,
  entityType: string,
  entityId: string,
  filePath: string,
  templateId?: string
) => {
  return prisma.generatedDocument.create({
    data: { organizationId, generatedById, name, type: type as any, entityType, entityId, filePath, templateId },
  });
};

export const generateQuotePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        contact: true,
        company: true,
        items: { include: { product: true }, orderBy: { order: 'asc' } },
        organization: true,
      },
    });

    if (!quote) throw new AppError('Preventivo non trovato', 404);

    const data = {
      organization: quote.organization,
      document: { number: quote.number, date: formatDate(quote.issueDate) },
      customer: {
        name: quote.company?.name || `${quote.contact?.firstName} ${quote.contact?.lastName}`,
        address: quote.company?.address || quote.contact?.address || '',
        city: quote.company?.city || quote.contact?.city || '',
        vatNumber: quote.company?.vatNumber || '',
        fiscalCode: quote.company?.fiscalCode || quote.contact?.fiscalCode || '',
      },
      quote: {
        subject: quote.subject || '',
        expiryDate: quote.expiryDate ? formatDate(quote.expiryDate) : '',
        subtotal: formatCurrency(Number(quote.subtotal)),
        tax: formatCurrency(Number(quote.taxAmount)),
        total: formatCurrency(Number(quote.total)),
        notes: quote.notes || '',
        terms: quote.terms || '',
      },
      items: quote.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: formatCurrency(Number(item.unitPrice)),
        vatRate: Number(item.vatRate),
        total: formatCurrency(Number(item.total)),
      })),
    };

    const { html, styles } = await renderTemplate('QUOTE', req.user!.organizationId!, data);

    // In production, convert HTML to PDF here and save to storage
    const filePath = `/documents/quotes/${quote.number}.pdf`;
    await saveGeneratedDocument(req.user!.organizationId!, req.user!.id, `Preventivo ${quote.number}`, 'QUOTE', 'quote', quote.id, filePath);

    res.json({ success: true, data: { html, styles, filename: `preventivo-${quote.number}.pdf` } });
  } catch (error) { next(error); }
};

export const generateInvoicePDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { contact: true, company: true, items: { include: { product: true }, orderBy: { order: 'asc' } }, organization: true },
    });

    if (!invoice) throw new AppError('Fattura non trovata', 404);

    const data = {
      organization: invoice.organization,
      document: { number: invoice.number, date: formatDate(invoice.issueDate) },
      customer: {
        name: invoice.company?.name || `${invoice.contact?.firstName} ${invoice.contact?.lastName}`,
        address: invoice.company?.address || invoice.contact?.address || '',
        vatNumber: invoice.company?.vatNumber || '',
        sdiCode: invoice.company?.sdiCode || '',
      },
      invoice: {
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : '',
        paymentTerms: invoice.paymentTerms || '',
        subtotal: formatCurrency(Number(invoice.subtotal)),
        tax: formatCurrency(Number(invoice.taxAmount)),
        total: formatCurrency(Number(invoice.total)),
      },
      items: invoice.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: formatCurrency(Number(item.unitPrice)),
        vatRate: Number(item.vatRate),
        total: formatCurrency(Number(item.total)),
      })),
    };

    const { html, styles } = await renderTemplate('INVOICE', req.user!.organizationId!, data);

    const filePath = `/documents/invoices/${invoice.number}.pdf`;
    await saveGeneratedDocument(req.user!.organizationId!, req.user!.id, `Fattura ${invoice.number}`, 'INVOICE', 'invoice', invoice.id, filePath);

    res.json({ success: true, data: { html, styles, filename: `fattura-${invoice.number}.pdf` } });
  } catch (error) { next(error); }
};

export const generateDDTPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ddt = await prisma.dDT.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { contact: true, company: true, items: { include: { product: true }, orderBy: { order: 'asc' } }, organization: true },
    });

    if (!ddt) throw new AppError('DDT non trovato', 404);

    const data = {
      organization: ddt.organization,
      document: { number: ddt.number, date: formatDate(ddt.issueDate) },
      customer: {
        name: ddt.company?.name || `${ddt.contact?.firstName} ${ddt.contact?.lastName}`,
        address: ddt.deliveryAddress || ddt.company?.address || '',
      },
      ddt: {
        transportDate: ddt.transportDate ? formatDate(ddt.transportDate) : '',
        reason: ddt.transportReason || '',
        carrier: ddt.carrier || '',
        packages: ddt.packages || '',
        weight: ddt.weight ? Number(ddt.weight) : '',
      },
      items: ddt.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
      })),
    };

    const { html, styles } = await renderTemplate('DDT', req.user!.organizationId!, data);

    const filePath = `/documents/ddt/${ddt.number}.pdf`;
    await saveGeneratedDocument(req.user!.organizationId!, req.user!.id, `DDT ${ddt.number}`, 'DDT', 'ddt', ddt.id, filePath);

    res.json({ success: true, data: { html, styles, filename: `ddt-${ddt.number}.pdf` } });
  } catch (error) { next(error); }
};

export const generatePurchaseOrderPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await prisma.purchaseOrder.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { supplier: true, items: { include: { product: true }, orderBy: { order: 'asc' } }, organization: true },
    });

    if (!order) throw new AppError('Ordine non trovato', 404);

    const data = {
      organization: order.organization,
      supplier: { name: order.supplier.name, address: order.supplier.address || '' },
      order: {
        number: order.number,
        date: formatDate(order.orderDate),
        expectedDate: order.expectedDate ? formatDate(order.expectedDate) : '',
        total: formatCurrency(Number(order.total)),
      },
      items: order.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: formatCurrency(Number(item.unitPrice)),
        total: formatCurrency(Number(item.total)),
      })),
    };

    const { html, styles } = await renderTemplate('PURCHASE_ORDER', req.user!.organizationId!, data);

    const filePath = `/documents/purchase-orders/${order.number}.pdf`;
    await saveGeneratedDocument(req.user!.organizationId!, req.user!.id, `Ordine ${order.number}`, 'PURCHASE_ORDER', 'purchase_order', order.id, filePath);

    res.json({ success: true, data: { html, styles, filename: `ordine-${order.number}.pdf` } });
  } catch (error) { next(error); }
};

export const generateProjectReportPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const project = await prisma.project.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: {
        contact: true, company: true, organization: true, projectManager: true,
        phases: { include: { tasks: true } },
        materials: { include: { product: true } },
        costs: true,
        team: { include: { user: true, workLogs: true } },
      },
    });

    if (!project) throw new AppError('Commessa non trovata', 404);

    // Calculate totals
    const materialsCost = project.materials.reduce((acc, m) => acc + Number(m.totalCost), 0);
    const otherCosts = project.costs.reduce((acc, c) => acc + Number(c.amount), 0);
    const laborHours = project.team.reduce((acc, t) => acc + t.workLogs.reduce((h, l) => h + Number(l.hours), 0), 0);
    const laborCost = project.team.reduce((acc, t) => acc + t.workLogs.reduce((h, l) => h + Number(l.hours) * Number(t.hourlyRate || 0), 0), 0);

    res.json({
      success: true,
      data: {
        project: {
          code: project.code,
          name: project.name,
          status: project.status,
          type: project.type,
          customer: project.company?.name || `${project.contact?.firstName} ${project.contact?.lastName}`,
          manager: project.projectManager ? `${project.projectManager.firstName} ${project.projectManager.lastName}` : '',
          startDate: project.startDate,
          expectedEndDate: project.expectedEndDate,
          estimatedValue: project.estimatedValue,
        },
        costs: { materials: materialsCost, labor: laborCost, other: otherCosts, total: materialsCost + laborCost + otherCosts },
        hours: laborHours,
        phases: project.phases,
        materials: project.materials,
        team: project.team,
      },
    });
  } catch (error) { next(error); }
};

export const generateOfferPDF = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // Similar to quote but with different template
  return generateQuotePDF(req, res, next);
};

export const getGeneratedDocuments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, entityType, entityId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (type) where.type = type;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [documents, total] = await Promise.all([
      prisma.generatedDocument.findMany({
        where,
        include: { generatedBy: { select: { firstName: true, lastName: true } }, template: { select: { name: true } } },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.generatedDocument.count({ where }),
    ]);

    res.json({ success: true, data: documents, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getGeneratedDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await prisma.generatedDocument.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!doc) throw new AppError('Documento non trovato', 404);
    res.json({ success: true, data: doc });
  } catch (error) { next(error); }
};

export const deleteGeneratedDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.generatedDocument.delete({ where: { id: req.params.id } });
    // TODO: Also delete the file from storage
    res.json({ success: true, message: 'Documento eliminato' });
  } catch (error) { next(error); }
};

export const downloadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const doc = await prisma.generatedDocument.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!doc) throw new AppError('Documento non trovato', 404);

    // In production, stream the file from storage
    res.json({ success: true, data: { filePath: doc.filePath, name: doc.name } });
  } catch (error) { next(error); }
};
