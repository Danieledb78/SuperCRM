import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
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
} from '../controllers/calendar.controller';

const router = Router();

// OAuth callback (no auth required - handled via state token)
router.get('/oauth/callback', oauthCallback);

// All other routes require authentication
router.use(authenticate);

// ============================================
// CALENDAR EVENTS
// ============================================

// Get events for date range
router.get('/events', getEvents);

// Get event types
router.get('/event-types', getEventTypes);

// Get single event
router.get('/events/:id', getEvent);

// Create event
router.post('/events', createEvent);

// Update event
router.put('/events/:id', updateEvent);

// Delete event
router.delete('/events/:id', deleteEvent);

// ============================================
// PARTICIPANTS
// ============================================

// Add participant to event
router.post('/events/:id/participants', addParticipant);

// Remove participant from event
router.delete('/events/:id/participants/:participantId', removeParticipant);

// Update participant response
router.patch('/events/:id/participants/:participantId/response', updateParticipantResponse);

// ============================================
// CALENDAR SYNC
// ============================================

// Get sync settings
router.get('/sync/settings', getSyncSettings);

// Connect external calendar
router.post('/sync/connect', connectCalendar);

// Disconnect calendar
router.delete('/sync/:provider', disconnectCalendar);

// Trigger sync
router.post('/sync/:provider', syncCalendar);

// ============================================
// AVAILABILITY
// ============================================

// Get user availability
router.get('/availability/:userId', getAvailability);

// Find available slot for multiple participants
router.post('/availability/find-slot', findAvailableSlot);

export default router;
