import { z } from 'zod';

// Event Types
export const EventType = z.enum([
  'MEETING',
  'CALL',
  'SITE_VISIT',
  'INSTALLATION',
  'MAINTENANCE',
  'TRAINING',
  'DEMO',
  'FOLLOW_UP',
  'DEADLINE',
  'REMINDER',
  'OTHER'
]);

export const EventStatus = z.enum([
  'CONFIRMED',
  'TENTATIVE',
  'CANCELLED'
]);

export const ResponseStatus = z.enum([
  'NEEDS_ACTION',
  'ACCEPTED',
  'DECLINED',
  'TENTATIVE'
]);

export const CalendarProvider = z.enum(['GOOGLE', 'OUTLOOK']);
export const SyncDirection = z.enum(['IMPORT', 'EXPORT', 'BOTH']);

// Get events query
export const getEventsSchema = z.object({
  query: z.object({
    start: z.string().datetime('Data inizio non valida'),
    end: z.string().datetime('Data fine non valida'),
    type: EventType.optional(),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    projectId: z.string().optional()
  })
});

// Get single event
export const getEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto')
  })
});

// Create event
export const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Titolo richiesto').max(200),
    description: z.string().max(2000).optional(),
    startDate: z.string().datetime('Data inizio non valida'),
    endDate: z.string().datetime('Data fine non valida'),
    allDay: z.boolean().optional().default(false),
    type: EventType.optional().default('MEETING'),
    location: z.string().max(500).optional(),
    locationUrl: z.string().url().optional().nullable(),
    isOnline: z.boolean().optional().default(false),
    onlineMeetingUrl: z.string().url().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isPrivate: z.boolean().optional().default(false),
    reminders: z.array(z.number()).optional().default([]),
    contactId: z.string().optional(),
    companyId: z.string().optional(),
    dealId: z.string().optional(),
    projectId: z.string().optional(),
    participants: z.array(z.object({
      email: z.string().email('Email partecipante non valida'),
      name: z.string().optional(),
      isOptional: z.boolean().optional().default(false),
      userId: z.string().optional()
    })).optional()
  }).refine(
    data => new Date(data.endDate) > new Date(data.startDate),
    { message: 'La data di fine deve essere successiva alla data di inizio' }
  )
});

// Update event
export const updateEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto')
  }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    allDay: z.boolean().optional(),
    type: EventType.optional(),
    status: EventStatus.optional(),
    location: z.string().max(500).optional(),
    locationUrl: z.string().url().optional().nullable(),
    isOnline: z.boolean().optional(),
    onlineMeetingUrl: z.string().url().optional().nullable(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isPrivate: z.boolean().optional(),
    reminders: z.array(z.number()).optional()
  })
});

// Delete event
export const deleteEventSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto')
  }),
  query: z.object({
    notifyParticipants: z.string().optional()
  })
});

// Add participant
export const addParticipantSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto')
  }),
  body: z.object({
    email: z.string().email('Email non valida'),
    name: z.string().optional(),
    isOptional: z.boolean().optional().default(false),
    userId: z.string().optional()
  })
});

// Remove participant
export const removeParticipantSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto'),
    participantId: z.string().min(1, 'ID partecipante richiesto')
  })
});

// Update participant response
export const updateParticipantResponseSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID evento richiesto'),
    participantId: z.string().min(1, 'ID partecipante richiesto')
  }),
  body: z.object({
    responseStatus: ResponseStatus
  })
});

// Connect calendar
export const connectCalendarSchema = z.object({
  body: z.object({
    provider: z.enum(['google', 'outlook'])
  })
});

// Get availability
export const getAvailabilitySchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'ID utente richiesto')
  }),
  query: z.object({
    start: z.string().datetime('Data inizio non valida'),
    end: z.string().datetime('Data fine non valida')
  })
});

// Find available slot
export const findAvailableSlotSchema = z.object({
  body: z.object({
    participantIds: z.array(z.string()).min(1, 'Almeno un partecipante richiesto'),
    duration: z.number().min(15, 'Durata minima 15 minuti').max(480, 'Durata massima 8 ore'),
    preferredStart: z.string().datetime().optional(),
    preferredEnd: z.string().datetime().optional()
  })
});

export default {
  getEventsSchema,
  getEventSchema,
  createEventSchema,
  updateEventSchema,
  deleteEventSchema,
  addParticipantSchema,
  removeParticipantSchema,
  updateParticipantResponseSchema,
  connectCalendarSchema,
  getAvailabilitySchema,
  findAvailableSlotSchema
};
