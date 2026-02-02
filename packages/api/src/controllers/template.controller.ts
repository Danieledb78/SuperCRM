import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

export const getTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, isActive } = req.query;
    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.documentTemplate.findMany({
      where,
      select: { id: true, name: true, type: true, description: true, isDefault: true, isActive: true, version: true, createdAt: true },
      orderBy: [{ type: 'asc' }, { isDefault: 'desc' }, { name: 'asc' }],
    });

    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const getTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prisma.documentTemplate.findFirst({
      where: { id: req.params.id, organizationId: req.user!.organizationId },
      include: { createdBy: { select: { id: true, firstName: true, lastName: true } } },
    });
    if (!template) throw new AppError('Template non trovato', 404);
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const createTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // If this is the default template, remove default from others of same type
    if (req.body.isDefault) {
      await prisma.documentTemplate.updateMany({
        where: { organizationId: req.user!.organizationId, type: req.body.type },
        data: { isDefault: false },
      });
    }

    const template = await prisma.documentTemplate.create({
      data: { ...req.body, organizationId: req.user!.organizationId!, createdById: req.user!.id },
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.documentTemplate.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId } });
    if (!existing) throw new AppError('Template non trovato', 404);

    if (req.body.isDefault && !existing.isDefault) {
      await prisma.documentTemplate.updateMany({
        where: { organizationId: req.user!.organizationId, type: existing.type, id: { not: req.params.id } },
        data: { isDefault: false },
      });
    }

    const template = await prisma.documentTemplate.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.documentTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Template eliminato' });
  } catch (error) { next(error); }
};

export const previewTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prisma.documentTemplate.findUnique({ where: { id: req.params.id } });
    if (!template) throw new AppError('Template non trovato', 404);

    const { data } = req.body;

    // Simple template variable replacement
    let html = template.content;
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
    }

    res.json({ success: true, data: { html, styles: template.styles } });
  } catch (error) { next(error); }
};

export const initDefaultTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const organizationId = req.user!.organizationId!;
    const createdById = req.user!.id;

    const defaultTemplates = [
      {
        name: 'Preventivo Standard',
        type: 'QUOTE',
        description: 'Template standard per preventivi',
        isDefault: true,
        content: getQuoteTemplate(),
        headerContent: getHeaderTemplate(),
        footerContent: getFooterTemplate(),
        styles: getDefaultStyles(),
        variables: getQuoteVariables(),
      },
      {
        name: 'Fattura Standard',
        type: 'INVOICE',
        description: 'Template standard per fatture',
        isDefault: true,
        content: getInvoiceTemplate(),
        headerContent: getHeaderTemplate(),
        footerContent: getFooterTemplate(),
        styles: getDefaultStyles(),
        variables: getInvoiceVariables(),
      },
      {
        name: 'DDT Standard',
        type: 'DDT',
        description: 'Template standard per documenti di trasporto',
        isDefault: true,
        content: getDDTTemplate(),
        headerContent: getHeaderTemplate(),
        footerContent: getFooterTemplate(),
        styles: getDefaultStyles(),
        variables: getDDTVariables(),
      },
      {
        name: 'Ordine Acquisto Standard',
        type: 'PURCHASE_ORDER',
        description: 'Template standard per ordini di acquisto',
        isDefault: true,
        content: getPurchaseOrderTemplate(),
        headerContent: getHeaderTemplate(),
        footerContent: getFooterTemplate(),
        styles: getDefaultStyles(),
        variables: getPurchaseOrderVariables(),
      },
    ];

    for (const tpl of defaultTemplates) {
      await prisma.documentTemplate.upsert({
        where: { organizationId_type_name: { organizationId, type: tpl.type as any, name: tpl.name } },
        create: { ...tpl, organizationId, createdById } as any,
        update: {},
      });
    }

    res.json({ success: true, message: 'Template di default creati' });
  } catch (error) { next(error); }
};

export const getTemplateVariables = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.params;
    let variables: Record<string, string> = {};

    switch (type) {
      case 'QUOTE':
        variables = getQuoteVariables();
        break;
      case 'INVOICE':
        variables = getInvoiceVariables();
        break;
      case 'DDT':
        variables = getDDTVariables();
        break;
      case 'PURCHASE_ORDER':
        variables = getPurchaseOrderVariables();
        break;
      default:
        variables = getCommonVariables();
    }

    res.json({ success: true, data: variables });
  } catch (error) { next(error); }
};

// Template helpers
const getCommonVariables = () => ({
  'organization.name': 'Nome azienda',
  'organization.address': 'Indirizzo azienda',
  'organization.city': 'Città azienda',
  'organization.vatNumber': 'Partita IVA azienda',
  'organization.phone': 'Telefono azienda',
  'organization.email': 'Email azienda',
  'document.number': 'Numero documento',
  'document.date': 'Data documento',
  'customer.name': 'Nome cliente',
  'customer.address': 'Indirizzo cliente',
  'customer.vatNumber': 'P.IVA cliente',
  'customer.fiscalCode': 'Codice fiscale cliente',
});

const getQuoteVariables = () => ({ ...getCommonVariables(), 'quote.expiryDate': 'Data scadenza', 'quote.subject': 'Oggetto', 'quote.subtotal': 'Subtotale', 'quote.tax': 'IVA', 'quote.total': 'Totale', 'quote.notes': 'Note', 'quote.terms': 'Condizioni' });
const getInvoiceVariables = () => ({ ...getCommonVariables(), 'invoice.dueDate': 'Data scadenza', 'invoice.paymentTerms': 'Termini pagamento', 'invoice.subtotal': 'Subtotale', 'invoice.tax': 'IVA', 'invoice.total': 'Totale', 'invoice.sdiCode': 'Codice SDI' });
const getDDTVariables = () => ({ ...getCommonVariables(), 'ddt.transportDate': 'Data trasporto', 'ddt.carrier': 'Vettore', 'ddt.packages': 'Colli', 'ddt.weight': 'Peso', 'ddt.reason': 'Causale' });
const getPurchaseOrderVariables = () => ({ 'supplier.name': 'Nome fornitore', 'supplier.address': 'Indirizzo fornitore', 'order.number': 'Numero ordine', 'order.date': 'Data ordine', 'order.expectedDate': 'Data consegna prevista', 'order.total': 'Totale' });

const getHeaderTemplate = () => `
<div class="header">
  <div class="logo">{{organization.name}}</div>
  <div class="company-info">
    <p>{{organization.address}}, {{organization.city}}</p>
    <p>P.IVA: {{organization.vatNumber}}</p>
    <p>Tel: {{organization.phone}} - Email: {{organization.email}}</p>
  </div>
</div>`;

const getFooterTemplate = () => `
<div class="footer">
  <p>{{organization.name}} - P.IVA {{organization.vatNumber}}</p>
  <p class="page-number">Pagina <span class="pageNumber"></span> di <span class="totalPages"></span></p>
</div>`;

const getDefaultStyles = () => `
body { font-family: 'Helvetica', Arial, sans-serif; font-size: 10pt; color: #333; }
.header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
.logo { font-size: 24pt; font-weight: bold; color: #2563eb; }
.document-title { font-size: 18pt; font-weight: bold; margin: 20px 0; color: #1f2937; }
.customer-box { background: #f3f4f6; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #2563eb; color: white; padding: 10px; text-align: left; }
td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
.totals { text-align: right; margin-top: 20px; }
.total-row { font-size: 14pt; font-weight: bold; color: #2563eb; }
.footer { text-align: center; font-size: 8pt; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
`;

const getQuoteTemplate = () => `
<div class="document-title">PREVENTIVO N. {{document.number}}</div>
<div class="document-date">Data: {{document.date}}</div>
<div class="customer-box">
  <strong>Spett.le</strong><br>
  {{customer.name}}<br>
  {{customer.address}}<br>
  P.IVA: {{customer.vatNumber}}
</div>
<p><strong>Oggetto:</strong> {{quote.subject}}</p>
<table>
  <thead><tr><th>#</th><th>Descrizione</th><th>Q.tà</th><th>Prezzo</th><th>IVA</th><th>Totale</th></tr></thead>
  <tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>€ {{unitPrice}}</td><td>{{vatRate}}%</td><td>€ {{total}}</td></tr>{{/items}}</tbody>
</table>
<div class="totals">
  <p>Subtotale: € {{quote.subtotal}}</p>
  <p>IVA: € {{quote.tax}}</p>
  <p class="total-row">TOTALE: € {{quote.total}}</p>
</div>
<div class="notes"><strong>Note:</strong> {{quote.notes}}</div>
<div class="terms"><strong>Condizioni:</strong> {{quote.terms}}</div>
<p>Validità offerta: {{quote.expiryDate}}</p>`;

const getInvoiceTemplate = () => `
<div class="document-title">FATTURA N. {{document.number}}</div>
<div class="document-date">Data: {{document.date}}</div>
<div class="customer-box">
  <strong>Spett.le</strong><br>
  {{customer.name}}<br>
  {{customer.address}}<br>
  P.IVA: {{customer.vatNumber}}<br>
  Codice SDI: {{customer.sdiCode}}
</div>
<table>
  <thead><tr><th>#</th><th>Descrizione</th><th>Q.tà</th><th>Prezzo</th><th>IVA</th><th>Totale</th></tr></thead>
  <tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>€ {{unitPrice}}</td><td>{{vatRate}}%</td><td>€ {{total}}</td></tr>{{/items}}</tbody>
</table>
<div class="totals">
  <p>Imponibile: € {{invoice.subtotal}}</p>
  <p>IVA: € {{invoice.tax}}</p>
  <p class="total-row">TOTALE FATTURA: € {{invoice.total}}</p>
</div>
<p><strong>Scadenza pagamento:</strong> {{invoice.dueDate}}</p>
<p><strong>Modalità pagamento:</strong> {{invoice.paymentTerms}}</p>`;

const getDDTTemplate = () => `
<div class="document-title">DOCUMENTO DI TRASPORTO N. {{document.number}}</div>
<div class="document-date">Data: {{document.date}}</div>
<div class="customer-box">
  <strong>Destinatario</strong><br>
  {{customer.name}}<br>
  {{customer.address}}
</div>
<div class="transport-info">
  <p><strong>Data trasporto:</strong> {{ddt.transportDate}}</p>
  <p><strong>Causale:</strong> {{ddt.reason}}</p>
  <p><strong>Vettore:</strong> {{ddt.carrier}}</p>
  <p><strong>Colli:</strong> {{ddt.packages}} - <strong>Peso:</strong> {{ddt.weight}} kg</p>
</div>
<table>
  <thead><tr><th>#</th><th>Descrizione</th><th>Q.tà</th><th>U.M.</th></tr></thead>
  <tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>{{unit}}</td></tr>{{/items}}</tbody>
</table>
<div class="signatures">
  <div class="signature-box"><p>Firma conducente</p><div class="signature-line"></div></div>
  <div class="signature-box"><p>Firma destinatario</p><div class="signature-line"></div></div>
</div>`;

const getPurchaseOrderTemplate = () => `
<div class="document-title">ORDINE DI ACQUISTO N. {{order.number}}</div>
<div class="document-date">Data: {{order.date}}</div>
<div class="supplier-box">
  <strong>Fornitore</strong><br>
  {{supplier.name}}<br>
  {{supplier.address}}
</div>
<p><strong>Data consegna richiesta:</strong> {{order.expectedDate}}</p>
<table>
  <thead><tr><th>#</th><th>Descrizione</th><th>Q.tà</th><th>Prezzo</th><th>Totale</th></tr></thead>
  <tbody>{{#items}}<tr><td>{{index}}</td><td>{{description}}</td><td>{{quantity}}</td><td>€ {{unitPrice}}</td><td>€ {{total}}</td></tr>{{/items}}</tbody>
</table>
<div class="totals">
  <p class="total-row">TOTALE ORDINE: € {{order.total}}</p>
</div>`;
