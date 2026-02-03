import { EventEmitter } from 'events';

// Event types
export interface AutomationEvent {
  organizationId: string;
  userId?: string;
  data: Record<string, any>;
  timestamp?: Date;
}

export type EventName =
  // Contact events
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'contact.tag.added'
  | 'contact.tag.removed'
  | 'contact.score.changed'
  | 'contact.status.changed'
  // Deal events
  | 'deal.created'
  | 'deal.updated'
  | 'deal.deleted'
  | 'deal.stage.changed'
  | 'deal.won'
  | 'deal.lost'
  | 'deal.value.changed'
  // Project events
  | 'project.created'
  | 'project.updated'
  | 'project.status.changed'
  | 'project.completed'
  // Communication events
  | 'email.sent'
  | 'email.opened'
  | 'email.clicked'
  | 'email.replied'
  | 'email.bounced'
  | 'sms.sent'
  | 'sms.delivered'
  | 'sms.received'
  | 'whatsapp.sent'
  | 'whatsapp.delivered'
  | 'whatsapp.read'
  | 'whatsapp.received'
  // Task events
  | 'task.created'
  | 'task.completed'
  | 'task.overdue'
  // Form events
  | 'form.submitted'
  // Appointment events
  | 'appointment.scheduled'
  | 'appointment.cancelled'
  | 'appointment.completed'
  // Invoice events
  | 'invoice.created'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.overdue'
  // Quote events
  | 'quote.created'
  | 'quote.sent'
  | 'quote.accepted'
  | 'quote.rejected'
  // Custom events
  | 'custom.event';

// Event bus class
class EventBus extends EventEmitter {
  private static instance: EventBus;
  private eventLog: Array<{
    name: EventName;
    event: AutomationEvent;
    timestamp: Date;
  }> = [];
  private maxLogSize = 1000;

  private constructor() {
    super();
    this.setMaxListeners(100); // Allow many listeners for automations
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // Emit event with logging
  emit(name: EventName, event: AutomationEvent): boolean {
    const eventWithTimestamp = {
      ...event,
      timestamp: new Date()
    };

    // Log event
    this.logEvent(name, eventWithTimestamp);

    console.log(`[EventBus] Emitting: ${name}`, {
      organizationId: event.organizationId,
      dataKeys: Object.keys(event.data)
    });

    return super.emit(name, eventWithTimestamp);
  }

  // Subscribe to event
  on(name: EventName, listener: (event: AutomationEvent) => void): this {
    console.log(`[EventBus] New listener for: ${name}`);
    return super.on(name, listener);
  }

  // Unsubscribe from event
  off(name: EventName, listener: (event: AutomationEvent) => void): this {
    console.log(`[EventBus] Removing listener for: ${name}`);
    return super.off(name, listener);
  }

  // Subscribe to event once
  once(name: EventName, listener: (event: AutomationEvent) => void): this {
    return super.once(name, listener);
  }

  // Log event for debugging/analytics
  private logEvent(name: EventName, event: AutomationEvent): void {
    this.eventLog.push({
      name,
      event,
      timestamp: new Date()
    });

    // Keep log size in check
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize / 2);
    }
  }

  // Get recent events (for debugging)
  getRecentEvents(limit = 50): Array<{
    name: EventName;
    event: AutomationEvent;
    timestamp: Date;
  }> {
    return this.eventLog.slice(-limit);
  }

  // Get events by organization
  getEventsByOrganization(
    organizationId: string,
    limit = 50
  ): Array<{
    name: EventName;
    event: AutomationEvent;
    timestamp: Date;
  }> {
    return this.eventLog
      .filter(e => e.event.organizationId === organizationId)
      .slice(-limit);
  }

  // Clear event log
  clearEventLog(): void {
    this.eventLog = [];
  }
}

// Export singleton
export const eventBus = EventBus.getInstance();

// ============================================
// HELPER FUNCTIONS TO EMIT EVENTS
// ============================================

// Contact events
export function emitContactCreated(organizationId: string, contact: any, userId?: string): void {
  eventBus.emit('contact.created', {
    organizationId,
    userId,
    data: { contact, contactId: contact.id }
  });
}

export function emitContactUpdated(organizationId: string, contact: any, changes: any, userId?: string): void {
  eventBus.emit('contact.updated', {
    organizationId,
    userId,
    data: { contact, contactId: contact.id, changes }
  });
}

export function emitContactTagAdded(organizationId: string, contactId: string, tag: any, userId?: string): void {
  eventBus.emit('contact.tag.added', {
    organizationId,
    userId,
    data: { contactId, tagId: tag.id, tagName: tag.name }
  });
}

export function emitContactTagRemoved(organizationId: string, contactId: string, tag: any, userId?: string): void {
  eventBus.emit('contact.tag.removed', {
    organizationId,
    userId,
    data: { contactId, tagId: tag.id, tagName: tag.name }
  });
}

export function emitContactStatusChanged(
  organizationId: string,
  contact: any,
  previousStatus: string,
  userId?: string
): void {
  eventBus.emit('contact.status.changed', {
    organizationId,
    userId,
    data: {
      contact,
      contactId: contact.id,
      previousStatus,
      newStatus: contact.status
    }
  });
}

// Deal events
export function emitDealCreated(organizationId: string, deal: any, userId?: string): void {
  eventBus.emit('deal.created', {
    organizationId,
    userId,
    data: { deal, dealId: deal.id, contactId: deal.contactId }
  });
}

export function emitDealStageChanged(
  organizationId: string,
  deal: any,
  fromStageId: string,
  toStageId: string,
  userId?: string
): void {
  eventBus.emit('deal.stage.changed', {
    organizationId,
    userId,
    data: {
      deal,
      dealId: deal.id,
      contactId: deal.contactId,
      fromStageId,
      toStageId
    }
  });
}

export function emitDealWon(organizationId: string, deal: any, userId?: string): void {
  eventBus.emit('deal.won', {
    organizationId,
    userId,
    data: { deal, dealId: deal.id, contactId: deal.contactId, value: deal.value }
  });
}

export function emitDealLost(organizationId: string, deal: any, reason?: string, userId?: string): void {
  eventBus.emit('deal.lost', {
    organizationId,
    userId,
    data: { deal, dealId: deal.id, contactId: deal.contactId, lostReason: reason }
  });
}

// Project events
export function emitProjectCreated(organizationId: string, project: any, userId?: string): void {
  eventBus.emit('project.created', {
    organizationId,
    userId,
    data: { project, projectId: project.id, contactId: project.clientContactId }
  });
}

export function emitProjectStatusChanged(
  organizationId: string,
  project: any,
  previousStatus: string,
  userId?: string
): void {
  eventBus.emit('project.status.changed', {
    organizationId,
    userId,
    data: {
      project,
      projectId: project.id,
      contactId: project.clientContactId,
      previousStatus,
      newStatus: project.status
    }
  });
}

export function emitProjectCompleted(organizationId: string, project: any, userId?: string): void {
  eventBus.emit('project.completed', {
    organizationId,
    userId,
    data: { project, projectId: project.id, contactId: project.clientContactId }
  });
}

// Communication events
export function emitEmailSent(organizationId: string, data: {
  contactId: string;
  to: string;
  subject: string;
  messageId?: string;
}): void {
  eventBus.emit('email.sent', {
    organizationId,
    data
  });
}

export function emitEmailOpened(organizationId: string, data: {
  contactId: string;
  messageId: string;
  openedAt: Date;
}): void {
  eventBus.emit('email.opened', {
    organizationId,
    data
  });
}

export function emitEmailClicked(organizationId: string, data: {
  contactId: string;
  messageId: string;
  url: string;
  clickedAt: Date;
}): void {
  eventBus.emit('email.clicked', {
    organizationId,
    data
  });
}

export function emitSmsReceived(organizationId: string, data: {
  contactId: string;
  from: string;
  message: string;
}): void {
  eventBus.emit('sms.received', {
    organizationId,
    data
  });
}

export function emitWhatsAppReceived(organizationId: string, data: {
  contactId: string;
  from: string;
  message: string;
  messageType?: string;
}): void {
  eventBus.emit('whatsapp.received', {
    organizationId,
    data
  });
}

// Task events
export function emitTaskCreated(organizationId: string, task: any, userId?: string): void {
  eventBus.emit('task.created', {
    organizationId,
    userId,
    data: { task, taskId: task.id, contactId: task.contactId }
  });
}

export function emitTaskCompleted(organizationId: string, task: any, userId?: string): void {
  eventBus.emit('task.completed', {
    organizationId,
    userId,
    data: { task, taskId: task.id, contactId: task.contactId }
  });
}

// Form events
export function emitFormSubmitted(organizationId: string, data: {
  formId: string;
  contactId?: string;
  submission: Record<string, any>;
}): void {
  eventBus.emit('form.submitted', {
    organizationId,
    data
  });
}

// Appointment events
export function emitAppointmentScheduled(organizationId: string, appointment: any, userId?: string): void {
  eventBus.emit('appointment.scheduled', {
    organizationId,
    userId,
    data: { appointment, appointmentId: appointment.id, contactId: appointment.contactId }
  });
}

// Invoice events
export function emitInvoiceCreated(organizationId: string, invoice: any, userId?: string): void {
  eventBus.emit('invoice.created', {
    organizationId,
    userId,
    data: { invoice, invoiceId: invoice.id, contactId: invoice.contactId }
  });
}

export function emitInvoicePaid(organizationId: string, invoice: any): void {
  eventBus.emit('invoice.paid', {
    organizationId,
    data: { invoice, invoiceId: invoice.id, contactId: invoice.contactId }
  });
}

export function emitInvoiceOverdue(organizationId: string, invoice: any): void {
  eventBus.emit('invoice.overdue', {
    organizationId,
    data: { invoice, invoiceId: invoice.id, contactId: invoice.contactId }
  });
}

// Quote events
export function emitQuoteAccepted(organizationId: string, quote: any): void {
  eventBus.emit('quote.accepted', {
    organizationId,
    data: { quote, quoteId: quote.id, contactId: quote.contactId }
  });
}

export function emitQuoteRejected(organizationId: string, quote: any, reason?: string): void {
  eventBus.emit('quote.rejected', {
    organizationId,
    data: { quote, quoteId: quote.id, contactId: quote.contactId, reason }
  });
}

// Custom event
export function emitCustomEvent(organizationId: string, eventName: string, data: any): void {
  eventBus.emit('custom.event', {
    organizationId,
    data: { eventName, ...data }
  });
}

export default eventBus;
