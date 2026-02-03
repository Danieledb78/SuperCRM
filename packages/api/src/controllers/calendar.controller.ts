import { Request, Response } from 'express';

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

    const filters: any = { organizationId };
    if (type) filters.type = type;
    if (contactId) filters.contactId = contactId;
    if (companyId) filters.companyId = companyId;
    if (projectId) filters.projectId = projectId;

    // Demo events
    const events = [
      {
        id: 'evt_1',
        title: 'Sopralluogo - Rossi Mario',
        description: 'Sopralluogo per impianto FV residenziale',
        startDate: new Date(),
        endDate: new Date(Date.now() + 3600000),
        allDay: false,
        type: 'SITE_VISIT',
        status: 'CONFIRMED',
        location: 'Via Roma 123, Milano',
        color: '#3B82F6',
        contact: { id: 'c1', firstName: 'Mario', lastName: 'Rossi' },
        participants: [
          { email: 'tecnico@azienda.it', name: 'Giuseppe Verdi', responseStatus: 'ACCEPTED' }
        ]
      },
      {
        id: 'evt_2',
        title: 'Call con fornitore pannelli',
        description: 'Discussione prezzi nuova fornitura',
        startDate: new Date(Date.now() + 86400000),
        endDate: new Date(Date.now() + 86400000 + 1800000),
        allDay: false,
        type: 'CALL',
        status: 'CONFIRMED',
        isOnline: true,
        onlineMeetingUrl: 'https://meet.example.com/abc',
        color: '#10B981'
      },
      {
        id: 'evt_3',
        title: 'Installazione impianto COM-2024-001',
        description: 'Installazione impianto FV 6kW',
        startDate: new Date(Date.now() + 172800000),
        endDate: new Date(Date.now() + 172800000 + 28800000),
        allDay: true,
        type: 'INSTALLATION',
        status: 'CONFIRMED',
        location: 'Via Verdi 45, Roma',
        color: '#F59E0B',
        project: { id: 'p1', code: 'COM-2024-001', name: 'Impianto FV Residenziale' }
      }
    ];

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

    res.json({
      id,
      title: 'Sopralluogo',
      description: 'Sopralluogo tecnico',
      startDate: new Date(),
      endDate: new Date(Date.now() + 3600000),
      type: 'SITE_VISIT',
      status: 'CONFIRMED',
      participants: []
    });
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

    const event = {
      id: `evt_${Date.now()}`,
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
      reminders,
      contactId,
      companyId,
      dealId,
      projectId,
      organizationId,
      ownerId: userId,
      participants: participants || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // In production:
    // 1. Save to database
    // 2. Create participant records
    // 3. Send invitations
    // 4. Create reminders

    res.status(201).json(event);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update event
export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Notify participants of changes if needed

    res.json({
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notifyParticipants } = req.query;

    // Cancel and notify participants if requested

    res.json({ message: 'Event deleted' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// ============================================
// PARTICIPANTS
// ============================================

// Add participant
export const addParticipant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, isOptional } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const participant = {
      id: `part_${Date.now()}`,
      eventId: id,
      email,
      name,
      isOptional: isOptional || false,
      responseStatus: 'NEEDS_ACTION',
      isOrganizer: false,
      createdAt: new Date()
    };

    // Send invitation email

    res.status(201).json(participant);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Failed to add participant' });
  }
};

// Remove participant
export const removeParticipant = async (req: Request, res: Response) => {
  try {
    const { id, participantId } = req.params;

    res.json({ message: 'Participant removed' });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ error: 'Failed to remove participant' });
  }
};

// Update participant response
export const updateParticipantResponse = async (req: Request, res: Response) => {
  try {
    const { id, participantId } = req.params;
    const { responseStatus } = req.body;

    if (!['ACCEPTED', 'DECLINED', 'TENTATIVE'].includes(responseStatus)) {
      return res.status(400).json({ error: 'Invalid response status' });
    }

    res.json({
      id: participantId,
      eventId: id,
      responseStatus,
      respondedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating response:', error);
    res.status(500).json({ error: 'Failed to update response' });
  }
};

// ============================================
// CALENDAR SYNC
// ============================================

// Get sync settings
export const getSyncSettings = async (req: Request, res: Response) => {
  try {
    const { id: userId } = req.user!;

    res.json({
      google: { connected: false },
      outlook: { connected: false }
    });
  } catch (error) {
    console.error('Error fetching sync settings:', error);
    res.status(500).json({ error: 'Failed to fetch sync settings' });
  }
};

// Connect external calendar
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
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=google:${organizationId}:${userId}&` +
        `access_type=offline&` +
        `prompt=consent`;
    } else if (provider === 'outlook') {
      const clientId = process.env.MICROSOFT_CLIENT_ID;
      const redirectUri = `${process.env.API_BASE_URL}/api/calendar/oauth/callback`;
      const scopes = [
        'openid',
        'offline_access',
        'https://graph.microsoft.com/Calendars.ReadWrite'
      ].join(' ');

      authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=${clientId}&` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `state=outlook:${organizationId}:${userId}`;
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    res.json({ authUrl, provider });
  } catch (error) {
    console.error('Error connecting calendar:', error);
    res.status(500).json({ error: 'Failed to connect calendar' });
  }
};

// OAuth callback
export const oauthCallback = async (req: Request, res: Response) => {
  try {
    const { code, state, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(`/settings/calendar?error=${oauthError}`);
    }

    // Parse state: provider:organizationId:userId
    const [provider, organizationId, userId] = (state as string).split(':');

    // Exchange code for tokens and save

    res.redirect('/settings/calendar?success=connected');
  } catch (error) {
    console.error('Error in calendar OAuth callback:', error);
    res.redirect('/settings/calendar?error=oauth_failed');
  }
};

// Disconnect calendar
export const disconnectCalendar = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;

    res.json({ success: true, message: `${provider} calendar disconnected` });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
};

// Sync calendar
export const syncCalendar = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { fullSync } = req.body;

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

// Get event types
export const getEventTypes = async (req: Request, res: Response) => {
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

// Get user availability
export const getAvailability = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end dates are required' });
    }

    // Return busy times
    res.json({
      userId,
      busySlots: [],
      workingHours: {
        start: '09:00',
        end: '18:00',
        days: [1, 2, 3, 4, 5] // Mon-Fri
      }
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// Find available slot
export const findAvailableSlot = async (req: Request, res: Response) => {
  try {
    const { participantIds, duration, preferredStart, preferredEnd } = req.body;

    // Find common available time
    res.json({
      suggestedSlots: [
        {
          start: new Date(Date.now() + 86400000),
          end: new Date(Date.now() + 86400000 + duration * 60000)
        }
      ]
    });
  } catch (error) {
    console.error('Error finding available slot:', error);
    res.status(500).json({ error: 'Failed to find slot' });
  }
};

export default {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  addParticipant,
  removeParticipant,
  updateParticipantResponse,
  getSyncSettings,
  connectCalendar,
  oauthCallback,
  disconnectCalendar,
  syncCalendar,
  getEventTypes,
  getAvailability,
  findAvailableSlot
};
