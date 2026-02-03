import prisma from '../lib/prisma';
import { sendEmail } from './email.service';
import { sendSms, sendWhatsApp } from './messaging.service';
import { eventBus, AutomationEvent } from './event-bus';

// Types
interface AutomationContext {
  organizationId: string;
  contact?: any;
  deal?: any;
  project?: any;
  triggeredBy?: string;
  triggerData?: Record<string, any>;
}

interface ActionConfig {
  templateId?: string;
  subject?: string;
  body?: string;
  to?: string;
  userId?: string;
  teamId?: string;
  tagId?: string;
  tagName?: string;
  segmentId?: string;
  stageId?: string;
  dealData?: Record<string, any>;
  contactData?: Record<string, any>;
  taskData?: Record<string, any>;
  score?: number;
  condition?: {
    field: string;
    operator: string;
    value: string;
  };
  waitDays?: number;
  waitHours?: number;
  waitMinutes?: number;
}

// ============================================
// AUTOMATION ENGINE
// ============================================

export class AutomationEngine {
  private static instance: AutomationEngine;
  private isProcessing = false;
  private processInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine();
    }
    return AutomationEngine.instance;
  }

  // Setup event listeners for triggers
  private setupEventListeners(): void {
    // Contact events
    eventBus.on('contact.created', (event) => this.handleTrigger('CONTACT_CREATED', event));
    eventBus.on('contact.updated', (event) => this.handleTrigger('CONTACT_UPDATED', event));
    eventBus.on('contact.tag.added', (event) => this.handleTrigger('CONTACT_TAG_ADDED', event));
    eventBus.on('contact.tag.removed', (event) => this.handleTrigger('CONTACT_TAG_REMOVED', event));

    // Deal events
    eventBus.on('deal.created', (event) => this.handleTrigger('DEAL_CREATED', event));
    eventBus.on('deal.stage.changed', (event) => this.handleTrigger('DEAL_STAGE_CHANGED', event));
    eventBus.on('deal.won', (event) => this.handleTrigger('DEAL_WON', event));
    eventBus.on('deal.lost', (event) => this.handleTrigger('DEAL_LOST', event));

    // Project events
    eventBus.on('project.created', (event) => this.handleTrigger('PROJECT_CREATED', event));
    eventBus.on('project.status.changed', (event) => this.handleTrigger('PROJECT_STATUS_CHANGED', event));
    eventBus.on('project.completed', (event) => this.handleTrigger('PROJECT_COMPLETED', event));

    // Communication events
    eventBus.on('email.opened', (event) => this.handleTrigger('EMAIL_OPENED', event));
    eventBus.on('email.clicked', (event) => this.handleTrigger('EMAIL_CLICKED', event));
    eventBus.on('email.replied', (event) => this.handleTrigger('EMAIL_REPLIED', event));
    eventBus.on('sms.received', (event) => this.handleTrigger('SMS_RECEIVED', event));
    eventBus.on('whatsapp.received', (event) => this.handleTrigger('WHATSAPP_RECEIVED', event));

    // Other events
    eventBus.on('form.submitted', (event) => this.handleTrigger('FORM_SUBMITTED', event));
    eventBus.on('appointment.scheduled', (event) => this.handleTrigger('APPOINTMENT_SCHEDULED', event));
    eventBus.on('task.completed', (event) => this.handleTrigger('TASK_COMPLETED', event));
    eventBus.on('invoice.overdue', (event) => this.handleTrigger('INVOICE_OVERDUE', event));

    console.log('[AutomationEngine] Event listeners setup complete');
  }

  // Handle incoming trigger
  private async handleTrigger(trigger: string, event: AutomationEvent): Promise<void> {
    try {
      console.log(`[AutomationEngine] Handling trigger: ${trigger}`, event);

      // Find active automations with this trigger
      const automations = await prisma.automation.findMany({
        where: {
          organizationId: event.organizationId,
          trigger: trigger as any,
          isActive: true
        },
        include: {
          conditions: { orderBy: { order: 'asc' } },
          actions: { orderBy: { order: 'asc' } }
        }
      });

      for (const automation of automations) {
        // Check conditions
        if (!this.evaluateConditions(automation.conditions, event)) {
          console.log(`[AutomationEngine] Conditions not met for automation: ${automation.id}`);
          continue;
        }

        // Check trigger config (e.g., specific tag, specific stage)
        if (!this.matchesTriggerConfig(automation.triggerConfig, event)) {
          console.log(`[AutomationEngine] Trigger config not matched for automation: ${automation.id}`);
          continue;
        }

        // Enroll contact if not already enrolled (for runOnce automations)
        await this.enrollContact(automation, event);
      }
    } catch (error) {
      console.error('[AutomationEngine] Error handling trigger:', error);
    }
  }

  // Evaluate automation conditions
  private evaluateConditions(conditions: any[], event: AutomationEvent): boolean {
    if (!conditions || conditions.length === 0) return true;

    const results: boolean[] = [];

    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(condition.field, event);
      const result = this.evaluateCondition(fieldValue, condition.operator, condition.value);
      results.push(result);
    }

    // Group by logic operator
    let finalResult = results[0];
    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      if (condition.logicOperator === 'OR') {
        finalResult = finalResult || results[i];
      } else {
        finalResult = finalResult && results[i];
      }
    }

    return finalResult;
  }

  // Get field value from event data
  private getFieldValue(field: string, event: AutomationEvent): any {
    const parts = field.split('.');
    let value: any = event.data;

    for (const part of parts) {
      if (value === undefined || value === null) return undefined;
      value = value[part];
    }

    return value;
  }

  // Evaluate single condition
  private evaluateCondition(fieldValue: any, operator: string, conditionValue: string): boolean {
    const value = String(fieldValue || '');
    const compareValue = conditionValue;

    switch (operator) {
      case 'EQUALS':
        return value === compareValue;
      case 'NOT_EQUALS':
        return value !== compareValue;
      case 'CONTAINS':
        return value.toLowerCase().includes(compareValue.toLowerCase());
      case 'NOT_CONTAINS':
        return !value.toLowerCase().includes(compareValue.toLowerCase());
      case 'STARTS_WITH':
        return value.toLowerCase().startsWith(compareValue.toLowerCase());
      case 'ENDS_WITH':
        return value.toLowerCase().endsWith(compareValue.toLowerCase());
      case 'GREATER_THAN':
        return parseFloat(value) > parseFloat(compareValue);
      case 'LESS_THAN':
        return parseFloat(value) < parseFloat(compareValue);
      case 'GREATER_OR_EQUAL':
        return parseFloat(value) >= parseFloat(compareValue);
      case 'LESS_OR_EQUAL':
        return parseFloat(value) <= parseFloat(compareValue);
      case 'IS_EMPTY':
        return !value || value.trim() === '';
      case 'IS_NOT_EMPTY':
        return value && value.trim() !== '';
      case 'IS_TRUE':
        return value === 'true' || value === '1';
      case 'IS_FALSE':
        return value === 'false' || value === '0';
      default:
        return false;
    }
  }

  // Match trigger config (e.g., specific tag, specific stage)
  private matchesTriggerConfig(config: any, event: AutomationEvent): boolean {
    if (!config) return true;

    // Check tag filter
    if (config.tagId && event.data.tagId !== config.tagId) return false;
    if (config.tagName && event.data.tagName !== config.tagName) return false;

    // Check stage filter
    if (config.stageId && event.data.stageId !== config.stageId) return false;
    if (config.fromStageId && event.data.fromStageId !== config.fromStageId) return false;
    if (config.toStageId && event.data.toStageId !== config.toStageId) return false;

    // Check status filter
    if (config.status && event.data.status !== config.status) return false;

    return true;
  }

  // Enroll contact in automation
  private async enrollContact(automation: any, event: AutomationEvent): Promise<void> {
    const contactId = event.data.contactId || event.data.contact?.id || event.data.id;
    const dealId = event.data.dealId || event.data.deal?.id;

    if (!contactId) {
      console.log('[AutomationEngine] No contact ID found, skipping enrollment');
      return;
    }

    // Check if already enrolled (for runOnce)
    if (automation.runOnce) {
      const existing = await prisma.automationEnrollment.findUnique({
        where: {
          automationId_contactId: {
            automationId: automation.id,
            contactId
          }
        }
      });

      if (existing) {
        console.log(`[AutomationEngine] Contact ${contactId} already enrolled in automation ${automation.id}`);
        return;
      }
    }

    // Create enrollment
    const firstAction = automation.actions[0];
    const nextRunAt = firstAction
      ? this.calculateNextRunTime(firstAction.delayMinutes, firstAction.delayType)
      : new Date();

    const enrollment = await prisma.automationEnrollment.create({
      data: {
        automationId: automation.id,
        contactId,
        dealId,
        status: 'ACTIVE',
        currentActionId: firstAction?.id,
        nextRunAt,
        metadata: {
          triggerData: event.data,
          triggeredBy: event.userId
        }
      }
    });

    // Update enrollment count
    await prisma.automation.update({
      where: { id: automation.id },
      data: { enrollmentCount: { increment: 1 } }
    });

    // Log enrollment
    await prisma.automationLog.create({
      data: {
        automationId: automation.id,
        contactId,
        status: 'success',
        message: `Contact enrolled in automation`,
        enrollmentId: enrollment.id
      }
    });

    console.log(`[AutomationEngine] Contact ${contactId} enrolled in automation ${automation.id}`);

    // If no delay, execute first action immediately
    if (firstAction && firstAction.delayMinutes === 0) {
      await this.executeAction(enrollment, firstAction, event.organizationId);
    }
  }

  // Calculate next run time based on delay
  private calculateNextRunTime(delayValue: number, delayType: string): Date {
    const now = new Date();

    switch (delayType) {
      case 'MINUTES':
        return new Date(now.getTime() + delayValue * 60 * 1000);
      case 'HOURS':
        return new Date(now.getTime() + delayValue * 60 * 60 * 1000);
      case 'DAYS':
        return new Date(now.getTime() + delayValue * 24 * 60 * 60 * 1000);
      case 'WEEKS':
        return new Date(now.getTime() + delayValue * 7 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + delayValue * 60 * 1000);
    }
  }

  // Start the processor that runs scheduled actions
  startProcessor(intervalMs = 60000): void {
    if (this.processInterval) {
      console.log('[AutomationEngine] Processor already running');
      return;
    }

    this.processInterval = setInterval(() => this.processScheduledActions(), intervalMs);
    console.log(`[AutomationEngine] Processor started with ${intervalMs}ms interval`);

    // Run immediately
    this.processScheduledActions();
  }

  // Stop the processor
  stopProcessor(): void {
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
      console.log('[AutomationEngine] Processor stopped');
    }
  }

  // Process scheduled actions
  private async processScheduledActions(): Promise<void> {
    if (this.isProcessing) {
      console.log('[AutomationEngine] Already processing, skipping');
      return;
    }

    this.isProcessing = true;
    console.log('[AutomationEngine] Processing scheduled actions...');

    try {
      // Find enrollments that need processing
      const enrollments = await prisma.automationEnrollment.findMany({
        where: {
          status: 'ACTIVE',
          nextRunAt: { lte: new Date() }
        },
        include: {
          automation: {
            include: {
              actions: { orderBy: { order: 'asc' } },
              organization: true
            }
          },
          contact: true,
          deal: true
        },
        take: 100 // Process in batches
      });

      console.log(`[AutomationEngine] Found ${enrollments.length} enrollments to process`);

      for (const enrollment of enrollments) {
        try {
          await this.processEnrollment(enrollment);
        } catch (error) {
          console.error(`[AutomationEngine] Error processing enrollment ${enrollment.id}:`, error);

          // Log error
          await prisma.automationLog.create({
            data: {
              automationId: enrollment.automationId,
              contactId: enrollment.contactId,
              enrollmentId: enrollment.id,
              status: 'failed',
              message: 'Error processing action',
              errorDetails: { error: String(error) }
            }
          });
        }
      }
    } catch (error) {
      console.error('[AutomationEngine] Error in processScheduledActions:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process single enrollment
  private async processEnrollment(enrollment: any): Promise<void> {
    const { automation, contact, deal } = enrollment;
    const currentAction = automation.actions.find((a: any) => a.id === enrollment.currentActionId);

    if (!currentAction) {
      // No more actions, complete enrollment
      await this.completeEnrollment(enrollment.id);
      return;
    }

    // Execute the action
    const success = await this.executeAction(enrollment, currentAction, automation.organizationId);

    if (!success) {
      // Mark as failed
      await prisma.automationEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: 'FAILED',
          exitReason: 'Action execution failed'
        }
      });
      return;
    }

    // Find next action
    const nextAction = this.findNextAction(automation.actions, currentAction, enrollment);

    if (!nextAction) {
      // No more actions, complete enrollment
      await this.completeEnrollment(enrollment.id);
    } else {
      // Schedule next action
      const nextRunAt = this.calculateNextRunTime(nextAction.delayMinutes, nextAction.delayType);

      await prisma.automationEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentActionId: nextAction.id,
          nextRunAt
        }
      });
    }
  }

  // Find next action to execute
  private findNextAction(actions: any[], currentAction: any, enrollment: any): any | null {
    const currentIndex = actions.findIndex(a => a.id === currentAction.id);

    // Check if current action is a condition
    if (currentAction.type === 'CONDITION') {
      const result = this.evaluateActionCondition(currentAction.config, enrollment);
      const branch = result ? 'yes' : 'no';

      // Find first action in the branch
      return actions.find(a =>
        a.parentActionId === currentAction.id &&
        a.conditionBranch === branch
      );
    }

    // Check if we're in a branch and need to exit
    if (currentAction.parentActionId) {
      // Find actions after the parent condition that are not in any branch
      const parentIndex = actions.findIndex(a => a.id === currentAction.parentActionId);
      for (let i = parentIndex + 1; i < actions.length; i++) {
        if (!actions[i].parentActionId && !actions[i].conditionBranch) {
          return actions[i];
        }
      }
      return null;
    }

    // Normal sequential execution
    for (let i = currentIndex + 1; i < actions.length; i++) {
      const action = actions[i];
      // Skip branch actions
      if (!action.parentActionId && !action.conditionBranch) {
        return action;
      }
    }

    return null;
  }

  // Evaluate condition action
  private evaluateActionCondition(config: any, enrollment: any): boolean {
    if (!config?.condition) return true;

    const { field, operator, value } = config.condition;
    const fieldValue = this.getFieldValue(field, { data: { ...enrollment.contact, deal: enrollment.deal } });

    return this.evaluateCondition(fieldValue, operator, value);
  }

  // Execute action
  private async executeAction(enrollment: any, action: any, organizationId: string): Promise<boolean> {
    const config: ActionConfig = action.config || {};
    const { contact, deal } = enrollment;

    console.log(`[AutomationEngine] Executing action ${action.type} for contact ${contact.id}`);

    try {
      switch (action.type) {
        case 'SEND_EMAIL':
          return await this.executeSendEmail(contact, config, organizationId);

        case 'SEND_SMS':
          return await this.executeSendSms(contact, config, organizationId);

        case 'SEND_WHATSAPP':
          return await this.executeSendWhatsApp(contact, config, organizationId);

        case 'CREATE_TASK':
          return await this.executeCreateTask(contact, deal, config, organizationId);

        case 'UPDATE_CONTACT':
          return await this.executeUpdateContact(contact.id, config);

        case 'UPDATE_DEAL':
          return await this.executeUpdateDeal(deal?.id, config);

        case 'ADD_TAG':
          return await this.executeAddTag(contact.id, config, organizationId);

        case 'REMOVE_TAG':
          return await this.executeRemoveTag(contact.id, config);

        case 'MOVE_DEAL_STAGE':
          return await this.executeMoveDealStage(deal?.id, config);

        case 'CREATE_DEAL':
          return await this.executeCreateDeal(contact.id, config, organizationId);

        case 'ASSIGN_USER':
          return await this.executeAssignUser(contact.id, deal?.id, config);

        case 'ADD_SCORE':
          return await this.executeAddScore(contact.id, config.score || 0);

        case 'REMOVE_SCORE':
          return await this.executeAddScore(contact.id, -(config.score || 0));

        case 'SET_SCORE':
          return await this.executeSetScore(contact.id, config.score || 0);

        case 'NOTIFY_USER':
          return await this.executeNotifyUser(contact, deal, config, organizationId);

        case 'NOTIFY_TEAM':
          return await this.executeNotifyTeam(contact, deal, config, organizationId);

        case 'WAIT':
          // Wait is handled by the scheduler
          return true;

        case 'CONDITION':
          // Condition is handled in findNextAction
          return true;

        case 'SPLIT_TEST':
          // TODO: Implement A/B testing
          return true;

        case 'GO_TO':
          // TODO: Implement jump to action
          return true;

        case 'WEBHOOK':
          return await this.executeWebhook(contact, deal, config);

        case 'EXIT':
          await prisma.automationEnrollment.update({
            where: { id: enrollment.id },
            data: {
              status: 'EXITED',
              exitedAt: new Date(),
              exitReason: config.reason || 'Manual exit'
            }
          });
          return true;

        default:
          console.log(`[AutomationEngine] Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`[AutomationEngine] Error executing action ${action.type}:`, error);

      // Log error
      await prisma.automationLog.create({
        data: {
          automationId: enrollment.automationId,
          contactId: contact.id,
          enrollmentId: enrollment.id,
          status: 'failed',
          actionType: action.type,
          actionName: action.name,
          message: `Failed to execute ${action.type}`,
          errorDetails: { error: String(error) }
        }
      });

      return false;
    }
  }

  // ============================================
  // ACTION IMPLEMENTATIONS
  // ============================================

  private async executeSendEmail(contact: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    if (!contact.email) {
      console.log('[AutomationEngine] Contact has no email');
      return false;
    }

    if (!contact.emailOptIn) {
      console.log('[AutomationEngine] Contact has not opted in for emails');
      return false;
    }

    let subject = config.subject || '';
    let body = config.body || '';

    // Load template if specified
    if (config.templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: config.templateId }
      });

      if (template) {
        subject = template.subject;
        body = template.bodyHtml;

        // Update usage count
        await prisma.emailTemplate.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } }
        });
      }
    }

    // Replace merge variables
    subject = this.replaceMergeVariables(subject, contact);
    body = this.replaceMergeVariables(body, contact);

    // Send email
    const result = await sendEmail({
      to: contact.email,
      subject,
      template: 'notification',
      data: {
        recipientName: `${contact.firstName} ${contact.lastName}`,
        title: subject,
        message: body
      }
    });

    return result.success;
  }

  private async executeSendSms(contact: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    const phone = contact.mobile || contact.phone;
    if (!phone) {
      console.log('[AutomationEngine] Contact has no phone number');
      return false;
    }

    if (!contact.smsOptIn) {
      console.log('[AutomationEngine] Contact has not opted in for SMS');
      return false;
    }

    let message = config.body || '';

    // Load template if specified
    if (config.templateId) {
      const template = await prisma.smsTemplate.findUnique({
        where: { id: config.templateId }
      });

      if (template && template.type === 'SMS') {
        message = template.content;

        await prisma.smsTemplate.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } }
        });
      }
    }

    message = this.replaceMergeVariables(message, contact);

    const result = await sendSms({
      to: phone,
      message,
      organizationId
    });

    return result.success;
  }

  private async executeSendWhatsApp(contact: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    const phone = contact.mobile || contact.phone;
    if (!phone) {
      console.log('[AutomationEngine] Contact has no phone number');
      return false;
    }

    let message = config.body || '';
    let templateId: string | undefined;

    // Load template if specified
    if (config.templateId) {
      const template = await prisma.smsTemplate.findUnique({
        where: { id: config.templateId }
      });

      if (template && template.type === 'WHATSAPP') {
        message = template.content;
        templateId = template.whatsappId || undefined;

        await prisma.smsTemplate.update({
          where: { id: template.id },
          data: { usageCount: { increment: 1 } }
        });
      }
    }

    message = this.replaceMergeVariables(message, contact);

    const result = await sendWhatsApp({
      to: phone,
      message,
      templateId,
      organizationId
    });

    return result.success;
  }

  private async executeCreateTask(contact: any, deal: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    const taskData = config.taskData || {};

    await prisma.task.create({
      data: {
        title: this.replaceMergeVariables(taskData.title || 'Attività automatica', contact),
        description: this.replaceMergeVariables(taskData.description || '', contact),
        priority: taskData.priority || 'MEDIUM',
        status: 'TODO',
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        organizationId,
        contactId: contact.id,
        dealId: deal?.id,
        ownerId: config.userId
      }
    });

    return true;
  }

  private async executeUpdateContact(contactId: string, config: ActionConfig): Promise<boolean> {
    const updateData = config.contactData || {};

    await prisma.contact.update({
      where: { id: contactId },
      data: updateData
    });

    return true;
  }

  private async executeUpdateDeal(dealId: string | undefined, config: ActionConfig): Promise<boolean> {
    if (!dealId) return false;

    const updateData = config.dealData || {};

    await prisma.deal.update({
      where: { id: dealId },
      data: updateData
    });

    return true;
  }

  private async executeAddTag(contactId: string, config: ActionConfig, organizationId: string): Promise<boolean> {
    let tagId = config.tagId;

    // Create tag if name provided and tag doesn't exist
    if (!tagId && config.tagName) {
      const existingTag = await prisma.tag.findFirst({
        where: { organizationId, name: config.tagName }
      });

      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const newTag = await prisma.tag.create({
          data: {
            name: config.tagName,
            organizationId
          }
        });
        tagId = newTag.id;
      }
    }

    if (!tagId) return false;

    // Check if already has tag
    const existing = await prisma.contactTag.findFirst({
      where: { contactId, tagId }
    });

    if (!existing) {
      await prisma.contactTag.create({
        data: { contactId, tagId }
      });

      // Emit event for other automations
      const contact = await prisma.contact.findUnique({ where: { id: contactId } });
      const tag = await prisma.tag.findUnique({ where: { id: tagId } });

      if (contact && tag) {
        eventBus.emit('contact.tag.added', {
          organizationId,
          data: {
            contactId,
            tagId,
            tagName: tag.name,
            contact
          }
        });
      }
    }

    return true;
  }

  private async executeRemoveTag(contactId: string, config: ActionConfig): Promise<boolean> {
    if (!config.tagId) return false;

    await prisma.contactTag.deleteMany({
      where: { contactId, tagId: config.tagId }
    });

    return true;
  }

  private async executeMoveDealStage(dealId: string | undefined, config: ActionConfig): Promise<boolean> {
    if (!dealId || !config.stageId) return false;

    const deal = await prisma.deal.findUnique({
      where: { id: dealId },
      include: { stage: true }
    });

    if (!deal) return false;

    await prisma.deal.update({
      where: { id: dealId },
      data: { stageId: config.stageId }
    });

    // Emit event
    eventBus.emit('deal.stage.changed', {
      organizationId: deal.organizationId,
      data: {
        dealId,
        fromStageId: deal.stageId,
        toStageId: config.stageId,
        deal
      }
    });

    return true;
  }

  private async executeCreateDeal(contactId: string, config: ActionConfig, organizationId: string): Promise<boolean> {
    const dealData = config.dealData || {};

    // Get default pipeline and stage
    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId, isDefault: true },
      include: { stages: { orderBy: { order: 'asc' }, take: 1 } }
    });

    if (!pipeline || pipeline.stages.length === 0) return false;

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return false;

    await prisma.deal.create({
      data: {
        title: dealData.title || `Trattativa ${contact.firstName} ${contact.lastName}`,
        value: dealData.value,
        organizationId,
        pipelineId: pipeline.id,
        stageId: pipeline.stages[0].id,
        contactId,
        ownerId: config.userId
      }
    });

    return true;
  }

  private async executeAssignUser(contactId: string, dealId: string | undefined, config: ActionConfig): Promise<boolean> {
    if (!config.userId) return false;

    await prisma.contact.update({
      where: { id: contactId },
      data: { ownerId: config.userId }
    });

    if (dealId) {
      await prisma.deal.update({
        where: { id: dealId },
        data: { ownerId: config.userId }
      });
    }

    return true;
  }

  private async executeAddScore(contactId: string, score: number): Promise<boolean> {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return false;

    const previousScore = contact.leadScore || 0;
    const newScore = previousScore + score;

    await prisma.contact.update({
      where: { id: contactId },
      data: { leadScore: newScore }
    });

    // Log score change
    await prisma.leadScoreHistory.create({
      data: {
        contactId,
        previousScore,
        newScore,
        change: score,
        reason: score > 0 ? 'Automation: Add score' : 'Automation: Remove score'
      }
    });

    // Emit event for score threshold automations
    eventBus.emit('contact.score.changed', {
      organizationId: contact.organizationId,
      data: { contactId, previousScore, newScore, change: score }
    });

    return true;
  }

  private async executeSetScore(contactId: string, score: number): Promise<boolean> {
    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) return false;

    const previousScore = contact.leadScore || 0;

    await prisma.contact.update({
      where: { id: contactId },
      data: { leadScore: score }
    });

    await prisma.leadScoreHistory.create({
      data: {
        contactId,
        previousScore,
        newScore: score,
        change: score - previousScore,
        reason: 'Automation: Set score'
      }
    });

    return true;
  }

  private async executeNotifyUser(contact: any, deal: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    if (!config.userId) return false;

    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Automazione',
        message: this.replaceMergeVariables(config.body || 'Notifica automazione', contact),
        organizationId,
        userId: config.userId,
        data: { contactId: contact.id, dealId: deal?.id }
      }
    });

    return true;
  }

  private async executeNotifyTeam(contact: any, deal: any, config: ActionConfig, organizationId: string): Promise<boolean> {
    // Get all users in organization
    const users = await prisma.user.findMany({
      where: { organizationId, isActive: true }
    });

    for (const user of users) {
      await prisma.notification.create({
        data: {
          type: 'SYSTEM',
          title: 'Automazione',
          message: this.replaceMergeVariables(config.body || 'Notifica automazione', contact),
          organizationId,
          userId: user.id,
          data: { contactId: contact.id, dealId: deal?.id }
        }
      });
    }

    return true;
  }

  private async executeWebhook(contact: any, deal: any, config: ActionConfig): Promise<boolean> {
    const url = (config as any).webhookUrl;
    if (!url) return false;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          deal,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[AutomationEngine] Webhook error:', error);
      return false;
    }
  }

  // Replace merge variables in text
  private replaceMergeVariables(text: string, contact: any): string {
    if (!text) return '';

    const variables: Record<string, string> = {
      '{{firstName}}': contact.firstName || '',
      '{{lastName}}': contact.lastName || '',
      '{{fullName}}': `${contact.firstName || ''} ${contact.lastName || ''}`.trim(),
      '{{email}}': contact.email || '',
      '{{phone}}': contact.phone || '',
      '{{mobile}}': contact.mobile || '',
      '{{company}}': contact.company?.name || '',
      '{{jobTitle}}': contact.jobTitle || '',
      '{{city}}': contact.city || '',
      '{{today}}': new Date().toLocaleDateString('it-IT'),
      '{{now}}': new Date().toLocaleString('it-IT')
    };

    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'gi'), value);
    }

    return result;
  }

  // Complete enrollment
  private async completeEnrollment(enrollmentId: string): Promise<void> {
    await prisma.automationEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        currentActionId: null,
        nextRunAt: null
      }
    });

    console.log(`[AutomationEngine] Enrollment ${enrollmentId} completed`);
  }

  // Manual enrollment API
  async enrollContactManually(
    automationId: string,
    contactId: string,
    dealId?: string
  ): Promise<{ success: boolean; enrollmentId?: string; error?: string }> {
    try {
      const automation = await prisma.automation.findUnique({
        where: { id: automationId },
        include: { actions: { orderBy: { order: 'asc' } } }
      });

      if (!automation) {
        return { success: false, error: 'Automazione non trovata' };
      }

      if (!automation.isActive) {
        return { success: false, error: 'Automazione non attiva' };
      }

      // Check existing enrollment
      const existing = await prisma.automationEnrollment.findUnique({
        where: {
          automationId_contactId: { automationId, contactId }
        }
      });

      if (existing && automation.runOnce) {
        return { success: false, error: 'Contatto già iscritto' };
      }

      // Create enrollment
      const firstAction = automation.actions[0];
      const enrollment = await prisma.automationEnrollment.create({
        data: {
          automationId,
          contactId,
          dealId,
          status: 'ACTIVE',
          currentActionId: firstAction?.id,
          nextRunAt: firstAction
            ? this.calculateNextRunTime(firstAction.delayMinutes, firstAction.delayType)
            : new Date(),
          metadata: { manual: true }
        }
      });

      await prisma.automation.update({
        where: { id: automationId },
        data: { enrollmentCount: { increment: 1 } }
      });

      return { success: true, enrollmentId: enrollment.id };
    } catch (error) {
      console.error('[AutomationEngine] Manual enrollment error:', error);
      return { success: false, error: 'Errore durante l\'iscrizione' };
    }
  }

  // Remove contact from automation
  async removeContactFromAutomation(
    automationId: string,
    contactId: string,
    reason?: string
  ): Promise<boolean> {
    try {
      await prisma.automationEnrollment.updateMany({
        where: { automationId, contactId, status: 'ACTIVE' },
        data: {
          status: 'EXITED',
          exitedAt: new Date(),
          exitReason: reason || 'Removed manually'
        }
      });
      return true;
    } catch (error) {
      console.error('[AutomationEngine] Remove contact error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const automationEngine = AutomationEngine.getInstance();

export default automationEngine;
