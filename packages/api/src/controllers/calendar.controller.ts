import { Request, Response } from 'express';
import prisma, { handlePrismaError } from '../lib/prisma';

// Calendar Controller - Gestione eventi e appuntamenti

// ============================================
// CALENDAR EVENTS
// ============================================

// Get events for date range
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { start, end, type, contactId, companyId, projectId } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const where: any = {
      organizationId,
      startDate: { gte: new Date(start as string) },
      endDate: { lte: new Date(end as string) },
      OR: [
        { ownerId: userId },
        { isPrivate: false },
        { participants: { some: { userId } } }
      ]
    };

    if (type) where.type = type;
    if (contactId) where.contactId = contactId;
    if (companyId) where.companyId = companyId;
    if (projectId) where.projectId = projectId;

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        owner: { select: { id: true, firstName: true, lastName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        project: { select: { id: true, code: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Get single event
export const getEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user!;

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id,
        organizationId,
        OR: [
          { ownerId: userId },
          { isPrivate: false },
          { participants: { some: { userId } } }
        ]
      },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, email: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        company: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
        project: { select: { id: true, code: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

// Create event
export const createEvent = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const {
      title,
      description,
      startDate,
      endDate,
      allDay,
      type,
      location,
      locationUrl,
      isOnline,
      onlineMeetingUrl,
      color,
      isPrivate,
      reminders,
      contactId,
      companyId,
      dealId,
      projectId,
      participants
    } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        error: 'Title, start date, and end date are required'
      });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        type: type || 'MEETING',
        status: 'CONFIRMED',
        location,
        locationUrl,
        isOnline: isOnline || false,
        onlineMeetingUrl,
        color,
        isPrivate: isPrivate || false,
        reminders: reminders || [],
        contactId,
        companyId,
        dealId,
        projectId,
        organizationId,
        ownerId: userId,
        participants: participants?.length ? {
          create: participants.map((p: any) => ({
            email: p.email,
            name: p.name,
            isOptional: p.isOptional || false,
            responseStatus: 'NEEDS_ACTION',
            isOrganizer: false,
            userId: p.userId
          }))
        } : undefined
      },
      include: {
        participants: true,
        contact: { select: { id: true, firstName: true, lastName: true } },
        project: { select: { id: true, code: true, name: true } }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user!;
    const updates = req.body;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, organizationId, ownerId: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: { ...updates, updatedAt: new Date() },
      include: { participants: true }
    });

    res.json(event);
  } catch (error) {
    console.error('Error updating event:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user!;

    const existing = await prisma.calendarEvent.findFirst({
      where: { id, organizationId, ownerId: userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Event not found or unauthorized' });
    }

    await prisma.eventParticipant.deleteMany({ where: { eventId: id } });
    await prisma.calendarEvent.delete({ where: { id } });

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// ============================================
// PARTICIPANTS
// ============================================

export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, isOptional, userId: participantUserId } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const participant = await prisma.eventParticipant.create({
      data: {
        eventId: id,
        email,
        name,
        isOptional: isOptional || false,
        responseStatus: 'NEEDS_ACTION',
        isOrganizer: false,
        userId: participantUserId
      }
    });

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { id, participantId } = req.params;

    await prisma.eventParticipant.delete({
      where: { id: participantId, eventId: id }
    });

    res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Error removing participant:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

export const updateParticipantResponse = async (req: Request, res: Response) => {
  try {
    const { id, participantId } = req.params;
    const { responseStatus } = req.body;

    if (!['ACCEPTED', 'DECLINED', 'TENTATIVE'].includes(responseStatus)) {
      return res.status(400).json({ error: 'Invalid response status' });
    }

    const participant = await prisma.eventParticipant.update({
      where: { id: participantId, eventId: id },
      data: { responseStatus, respondedAt: new Date() }
    });

    res.json(participant);
  } catch (error) {
    console.error('Error updating response:', error);
    const { status, message } = handlePrismaError(error);
    res.status(status).json({ error: message });
  }
};

// ============================================
// CALENDAR SYNC
// ============================================

export const getSyncSettings = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;

    const syncs = await prisma.calendarSync.findMany({ where: { userId } });

    const settings: any = {
      google: { connected: false },
      outlook: { connected: false }
    };

    syncs.forEach(sync => {
      const provider = sync.provider.toLowerCase();
      settings[provider] = {
        connected: true,
        email: sync.externalEmail,
        calendarId: sync.externalCalendarId,
        lastSyncAt: sync.lastSyncAt,
        syncDirection: sync.syncDirection
      };
    });

    res.json(settings);
  } catch (error) {
    console.error('Error fetching sync settings:', error);
    res.status(500).json({ error: 'Failed to fetch sync settings' });
  }
};

export const connectCalendar = async (req: Request, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const { provider } = req.body;

    let authUrl = '';

    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const redirectUri = `${process.env.API_BASE_URL}/api/calendar/oauth/callback`;
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ].join(' ');

      authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=google:${organizationId}:${userId}&access_type=offline&prompt=consent`;
    } else if (provider === 'outlook') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = `${process.env.API_BASE_URL}/api/calendar/oauth/callback`;
      const scopes = ['openid', 'offline_access', 'https://graph.microsoft.com/Calendars.ReadWrite'].join(' ');

      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&state=outlook:${organizationId}:${userId}`;
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({ authUrl, provider });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    res.status(500).json({ error: 'Failed to connect calendar' });
  }
};

export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/settings/calendar?error=${oauthError}`);
    }

    const [provider, organizationId, userId] = (state as string).split(':');

    await prisma.calendarSync.create({
      data: {
        provider: provider.toUpperCase() as any,
        externalCalendarId: 'primary',
        externalEmail: '',
        accessToken: code as string,
        refreshToken: '',
        tokenExpiry: new Date(Date.now() + 3600000),
        syncDirection: 'BOTH',
        isActive: true,
        userId,
        organizationId
      }
    });

    res.redirect('/settings/calendar?success=connected');
  } catch (error) {
    console.error('Error in calendar OAuth callback:', error);
    res.redirect('/settings/calendar?error=oauth_failed');
  }
};

export const disconnectCalendar = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { id: userId } = req.user!;

    await prisma.calendarSync.deleteMany({
      where: { userId, provider: provider.toUpperCase() as any }
    });

    res.json({ success: true, message: `${provider} calendar disconnected` });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
};

export const syncCalendar = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { id: userId } = req.user!;
    const { fullSync } = req.body;

    const sync = await prisma.calendarSync.findFirst({
      where: { userId, provider: provider.toUpperCase() as any, isActive: true }
    });

    if (!sync) {
      return res.status(404).json({ error: 'Calendar not connected' });
    }

    await prisma.calendarSync.update({
      where: { id: sync.id },
      data: { lastSyncAt: new Date(), lastSyncToken: fullSync ? null : sync.lastSyncToken }
    });

    res.json({
      success: true,
      provider,
      syncType: fullSync ? 'full' : 'incremental',
      eventsImported: 0,
      eventsExported: 0,
      syncedAt: new Date()
    });
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
};

// ============================================
// EVENT TYPES
// ============================================

export const getEventTypes = async (_req: Request, res: Response) => {
  try {
    const types = [
      { type: 'MEETING', label: 'Riunione', icon: 'users', color: '#3B82F6' },
      { type: 'CALL', label: 'Telefonata', icon: 'phone', color: '#10B981' },
      { type: 'SITE_VISIT', label: 'Sopralluogo', icon: 'map-pin', color: '#8B5CF6' },
      { type: 'INSTALLATION', label: 'Installazione', icon: 'tool', color: '#F59E0B' },
      { type: 'MAINTENANCE', label: 'Manutenzione', icon: 'wrench', color: '#EF4444' },
      { type: 'TRAINING', label: 'Formazione', icon: 'book', color: '#EC4899' },
      { type: 'DEMO', label: 'Demo', icon: 'presentation', color: '#06B6D4' },
      { type: 'FOLLOW_UP', label: 'Follow-up', icon: 'repeat', color: '#84CC16' },
      { type: 'DEADLINE', label: 'Scadenza', icon: 'alert-circle', color: '#EF4444' },
      { type: 'REMINDER', label: 'Promemoria', icon: 'bell', color: '#6B7280' },
      { type: 'OTHER', label: 'Altro', icon: 'calendar', color: '#6B7280' }
    ];

    res.json(types);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
};

// ============================================
// AVAILABILITY
// ============================================

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;
    const { organizationId } = req.user!;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const events = await prisma.calendarEvent.findMany({
      where: {
        organizationId,
        OR: [{ ownerId: userId }, { participants: { some: { userId } } }],
        startDate: { gte: new Date(start as string) },
        endDate: { lte: new Date(end as string) },
        status: { not: 'CANCELLED' }
      },
      select: { startDate: true, endDate: true, allDay: true }
    });

    const busySlots = events.map(e => ({
      start: e.startDate,
      end: e.endDate,
      allDay: e.allDay
    }));

    res.json({
      userId,
      busySlots,
      workingHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const findAvailableSlot = async (req: Request, res: Response) => {
  try {
    const { participantIds, duration, preferredStart, preferredEnd } = req.body;
    const { organizationId } = req.user!;

    if (!participantIds?.length || !duration) {
      return res.status(400).json({ error: 'Participant IDs and duration are required' });
    }

    const startDate = preferredStart ? new Date(preferredStart) : new Date();
    const endDate = preferredEnd ? new Date(preferredEnd) : new Date(Date.now() + 7 * 86400000);

    const events = await prisma.calendarEvent.findMany({
      where: {
        organizationId,
        OR: participantIds.flatMap((id: string) => [
          { ownerId: id },
          { participants: { some: { userId: id } } }
        ]),
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        status: { not: 'CANCELLED' }
      },
      select: { startDate: true, endDate: true },
      orderBy: { startDate: 'asc' }
    });

    const suggestedStart = new Date(startDate);
    suggestedStart.setHours(10, 0, 0, 0);
    if (suggestedStart < new Date()) {
      suggestedStart.setDate(suggestedStart.getDate() + 1);
    }

    res.json({
      suggestedSlots: [{
        start: suggestedStart,
        end: new Date(suggestedStart.getTime() + duration * 60000)
      }]
    });
  } catch (error) {
    console.error('Error finding available slot:', error);
    res.status(500).json({ error: 'Failed to find slot' });
  }
};

export default {
  getEvents, getEvent, createEvent, updateEvent, deleteEvent,
  addParticipant, removeParticipant, updateParticipantResponse,
  getSyncSettings, connectCalendar, oauthCallback, disconnectCalendar, syncCalendar,
  getEventTypes, getAvailability, findAvailableSlot
};
