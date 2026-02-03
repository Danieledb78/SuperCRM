import { Response, NextFunction } from 'express';
import { prisma } from '@supercrm/database';
import { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { DEFAULT_PAGE_SIZE } from '@supercrm/shared';
import { automationEngine } from '../services/automation.engine.js';

export const getAutomations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, isActive } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [automations, total] = await Promise.all([
      prisma.automation.findMany({ where, include: { owner: { select: { id: true, firstName: true, lastName: true } }, _count: { select: { actions: true, logs: true } } }, orderBy: { createdAt: 'desc' }, skip, take: Number(limit) }),
      prisma.automation.count({ where }),
    ]);

    res.json({ success: true, data: automations, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const getAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.findFirst({ where: { id: req.params.id, organizationId: req.user!.organizationId }, include: { owner: true, actions: { orderBy: { order: 'asc' } } } });
    if (!automation) throw new AppError('Automazione non trovata', 404);
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const createAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { actions, ...data } = req.body;
    const automation = await prisma.automation.create({ data: { ...data, organizationId: req.user!.organizationId!, ownerId: data.ownerId || req.user!.id, actions: actions ? { create: actions } : undefined }, include: { actions: true } });
    res.status(201).json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const updateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { actions, ...data } = req.body;
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { ...data, actions: actions ? { deleteMany: {}, create: actions } : undefined }, include: { actions: true } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const deleteAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.automation.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Automazione eliminata' });
  } catch (error) { next(error); }
};

export const activateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { isActive: true } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const deactivateAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const automation = await prisma.automation.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ success: true, data: automation });
  } catch (error) { next(error); }
};

export const triggerAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // TODO: Implement automation triggering
    res.json({ success: true, message: 'Automation triggered' });
  } catch (error) { next(error); }
};

export const getAutomationLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = await prisma.automationLog.findMany({ where: { automationId: req.params.id }, include: { contact: { select: { id: true, firstName: true, lastName: true } } }, orderBy: { executedAt: 'desc' }, take: 100 });
    res.json({ success: true, data: logs });
  } catch (error) { next(error); }
};

// ============================================
// ENROLLMENTS
// ============================================

export const getEnrollments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: Record<string, unknown> = { automationId: req.params.id };
    if (status) where.status = String(status);

    const [enrollments, total] = await Promise.all([
      prisma.automationEnrollment.findMany({
        where,
        include: {
          contact: { select: { id: true, firstName: true, lastName: true, email: true } },
          deal: { select: { id: true, title: true, value: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.automationEnrollment.count({ where })
    ]);

    res.json({ success: true, data: enrollments, pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) } });
  } catch (error) { next(error); }
};

export const enrollContact = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { contactId, dealId } = req.body;
    if (!contactId) throw new AppError('ID contatto obbligatorio', 400);

    const result = await automationEngine.enrollContactManually(req.params.id, contactId, dealId);
    if (!result.success) throw new AppError(result.error || 'Errore iscrizione', 400);

    res.json({ success: true, enrollmentId: result.enrollmentId });
  } catch (error) { next(error); }
};

export const removeFromAutomation = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { reason } = req.body;
    await prisma.automationEnrollment.update({
      where: { id: req.params.enrollmentId },
      data: { status: 'EXITED', exitedAt: new Date(), exitReason: reason || 'Rimosso manualmente' }
    });
    res.json({ success: true });
  } catch (error) { next(error); }
};

export const getAutomationStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params.id;
    const [totalEnrollments, activeEnrollments, completedEnrollments, failedEnrollments, totalLogs, successfulLogs] = await Promise.all([
      prisma.automationEnrollment.count({ where: { automationId: id } }),
      prisma.automationEnrollment.count({ where: { automationId: id, status: 'ACTIVE' } }),
      prisma.automationEnrollment.count({ where: { automationId: id, status: 'COMPLETED' } }),
      prisma.automationEnrollment.count({ where: { automationId: id, status: 'FAILED' } }),
      prisma.automationLog.count({ where: { automationId: id } }),
      prisma.automationLog.count({ where: { automationId: id, status: 'success' } })
    ]);

    res.json({
      success: true,
      data: {
        enrollments: { total: totalEnrollments, active: activeEnrollments, completed: completedEnrollments, failed: failedEnrollments },
        logs: { total: totalLogs, successful: successfulLogs, successRate: totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 0 }
      }
    });
  } catch (error) { next(error); }
};

// ============================================
// EMAIL TEMPLATES
// ============================================

export const getEmailTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search } = req.query;
    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (category) where.category = String(category);
    if (search) where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { subject: { contains: String(search), mode: 'insensitive' } }
    ];

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: { id: true, name: true, subject: true, category: true, isActive: true, usageCount: true, createdAt: true, updatedAt: true }
    });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const createEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, subject, bodyHtml, bodyText, category, variables, previewText } = req.body;
    if (!name || !subject || !bodyHtml) throw new AppError('Nome, oggetto e contenuto sono obbligatori', 400);

    const template = await prisma.emailTemplate.create({
      data: { name, subject, bodyHtml, bodyText, category, variables, previewText, organizationId: req.user!.organizationId!, createdById: req.user!.id }
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const updateEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prisma.emailTemplate.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteEmailTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.emailTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Template eliminato' });
  } catch (error) { next(error); }
};

// ============================================
// SMS/WHATSAPP TEMPLATES
// ============================================

export const getSmsTemplates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;
    const where: Record<string, unknown> = { organizationId: req.user!.organizationId };
    if (type) where.type = String(type);

    const templates = await prisma.smsTemplate.findMany({ where, orderBy: { updatedAt: 'desc' } });
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
};

export const createSmsTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, content, type, variables, category, language } = req.body;
    if (!name || !content) throw new AppError('Nome e contenuto sono obbligatori', 400);

    const template = await prisma.smsTemplate.create({
      data: { name, content, type: type || 'SMS', variables, category, language: language || 'it', organizationId: req.user!.organizationId! }
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const updateSmsTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const template = await prisma.smsTemplate.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
};

export const deleteSmsTemplate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.smsTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Template eliminato' });
  } catch (error) { next(error); }
};

// ============================================
// MESSAGING PROVIDERS
// ============================================

export const getMessagingProviders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const providers = await prisma.messagingProvider.findMany({
      where: { organizationId: req.user!.organizationId },
      select: { id: true, type: true, name: true, isActive: true, isDefault: true, dailyLimit: true, monthlyLimit: true, sentToday: true, sentThisMonth: true, createdAt: true }
    });
    res.json({ success: true, data: providers });
  } catch (error) { next(error); }
};

export const createMessagingProvider = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, name, config, dailyLimit, monthlyLimit, isDefault } = req.body;
    if (!type || !name || !config) throw new AppError('Tipo, nome e configurazione sono obbligatori', 400);

    if (isDefault) {
      const prefix = type.split('_')[0];
      await prisma.messagingProvider.updateMany({
        where: { organizationId: req.user!.organizationId, type: { startsWith: prefix } },
        data: { isDefault: false }
      });
    }

    const provider = await prisma.messagingProvider.create({
      data: { type, name, config, dailyLimit, monthlyLimit, isDefault: isDefault || false, organizationId: req.user!.organizationId! }
    });
    const { config: _, ...safeProvider } = provider;
    res.status(201).json({ success: true, data: safeProvider });
  } catch (error) { next(error); }
};

export const updateMessagingProvider = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, config, isActive, isDefault, dailyLimit, monthlyLimit } = req.body;
    const existing = await prisma.messagingProvider.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError('Provider non trovato', 404);

    if (isDefault) {
      const prefix = existing.type.split('_')[0];
      await prisma.messagingProvider.updateMany({
        where: { organizationId: req.user!.organizationId, type: { startsWith: prefix }, id: { not: req.params.id } },
        data: { isDefault: false }
      });
    }

    const provider = await prisma.messagingProvider.update({
      where: { id: req.params.id },
      data: { name, config, isActive, isDefault, dailyLimit, monthlyLimit }
    });
    const { config: _, ...safeProvider } = provider;
    res.json({ success: true, data: safeProvider });
  } catch (error) { next(error); }
};

export const deleteMessagingProvider = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.messagingProvider.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Provider eliminato' });
  } catch (error) { next(error); }
};

// ============================================
// LEAD SCORING
// ============================================

export const getLeadScoringRules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rules = await prisma.leadScoringRule.findMany({
      where: { organizationId: req.user!.organizationId },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: rules });
  } catch (error) { next(error); }
};

export const createLeadScoringRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, trigger, triggerConfig, scoreChange, isActive } = req.body;
    if (!name || !trigger || scoreChange === undefined) throw new AppError('Nome, trigger e punteggio sono obbligatori', 400);

    const rule = await prisma.leadScoringRule.create({
      data: { name, description, trigger, triggerConfig, scoreChange, isActive: isActive !== false, organizationId: req.user!.organizationId! }
    });
    res.status(201).json({ success: true, data: rule });
  } catch (error) { next(error); }
};

export const updateLeadScoringRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rule = await prisma.leadScoringRule.update({ where: { id: req.params.id }, data: req.body });
    res.json({ success: true, data: rule });
  } catch (error) { next(error); }
};

export const deleteLeadScoringRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.leadScoringRule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Regola eliminata' });
  } catch (error) { next(error); }
};
