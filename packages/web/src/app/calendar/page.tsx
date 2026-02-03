'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  Filter,
  Settings,
  Repeat,
  List,
  Grid3X3
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  type: string;
  status: string;
  location?: string;
  isOnline?: boolean;
  onlineMeetingUrl?: string;
  color: string;
  contact?: { firstName: string; lastName: string };
  project?: { code: string; name: string };
}

const eventTypes = [
  { type: 'MEETING', label: 'Riunione', color: '#3B82F6' },
  { type: 'CALL', label: 'Telefonata', color: '#10B981' },
  { type: 'SITE_VISIT', label: 'Sopralluogo', color: '#8B5CF6' },
  { type: 'INSTALLATION', label: 'Installazione', color: '#F59E0B' },
  { type: 'MAINTENANCE', label: 'Manutenzione', color: '#EF4444' },
  { type: 'TRAINING', label: 'Formazione', color: '#EC4899' },
  { type: 'DEMO', label: 'Demo', color: '#06B6D4' },
  { type: 'FOLLOW_UP', label: 'Follow-up', color: '#84CC16' },
  { type: 'DEADLINE', label: 'Scadenza', color: '#EF4444' },
];

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Sopralluogo - Rossi Mario',
    description: 'Sopralluogo per impianto FV residenziale',
    startDate: new Date(),
    endDate: new Date(Date.now() + 3600000),
    allDay: false,
    type: 'SITE_VISIT',
    status: 'CONFIRMED',
    location: 'Via Roma 123, Milano',
    color: '#8B5CF6',
    contact: { firstName: 'Mario', lastName: 'Rossi' }
  },
  {
    id: '2',
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
    id: '3',
    title: 'Installazione impianto',
    description: 'Installazione impianto FV 6kW',
    startDate: new Date(Date.now() + 172800000),
    endDate: new Date(Date.now() + 172800000 + 28800000),
    allDay: true,
    type: 'INSTALLATION',
    status: 'CONFIRMED',
    location: 'Via Verdi 45, Roma',
    color: '#F59E0B',
    project: { code: 'PRJ-2024-001', name: 'Impianto FV Residenziale' }
  },
  {
    id: '4',
    title: 'Riunione team tecnico',
    startDate: new Date(Date.now() + 259200000),
    endDate: new Date(Date.now() + 259200000 + 3600000),
    allDay: false,
    type: 'MEETING',
    status: 'CONFIRMED',
    isOnline: true,
    color: '#3B82F6'
  },
  {
    id: '5',
    title: 'Scadenza preventivo Bianchi',
    startDate: new Date(Date.now() + 432000000),
    endDate: new Date(Date.now() + 432000000),
    allDay: true,
    type: 'DEADLINE',
    status: 'CONFIRMED',
    color: '#EF4444'
  }
];

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events] = useState<CalendarEvent[]>(mockEvents);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calendar helpers
  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Previous month padding
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const navigateMonth = (direction: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  };

  const monthDays = getMonthDays(currentDate);

  // Upcoming events for sidebar
  const upcomingEvents = events
    .filter(e => new Date(e.startDate) >= today)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendario</h1>
            <p className="text-gray-600">Gestisci appuntamenti e scadenze</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Sincronizza
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Evento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <h2 className="text-xl font-semibold">
                      {MONTHS_IT[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                      Oggi
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex border rounded-lg overflow-hidden">
                      <Button
                        variant={view === 'month' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('month')}
                        className="rounded-none"
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={view === 'week' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('week')}
                        className="rounded-none"
                      >
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={view === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setView('list')}
                        className="rounded-none"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {view === 'month' && (
                  <div className="border rounded-lg overflow-hidden">
                    {/* Week days header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b">
                      {DAYS_IT.map(day => (
                        <div key={day} className="p-3 text-center text-sm font-medium text-gray-600">
                          {day}
                        </div>
                      ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7">
                      {monthDays.map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="min-h-[100px] border-b border-r bg-gray-50" />;
                        }

                        const dayEvents = getEventsForDate(date);
                        const isToday = date.toDateString() === today.toDateString();
                        const isSelected = selectedDate?.toDateString() === date.toDateString();

                        return (
                          <div
                            key={date.toISOString()}
                            className={`min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors ${
                              isToday ? 'bg-blue-50' : 'hover:bg-gray-50'
                            } ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                            onClick={() => setSelectedDate(date)}
                          >
                            <div className={`text-sm font-medium p-1 ${
                              isToday
                                ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
                                : 'text-gray-900'
                            }`}>
                              {date.getDate()}
                            </div>
                            <div className="space-y-1 mt-1">
                              {dayEvents.slice(0, 3).map(event => (
                                <div
                                  key={event.id}
                                  className="text-xs p-1 rounded truncate text-white"
                                  style={{ backgroundColor: event.color }}
                                  title={event.title}
                                >
                                  {!event.allDay && (
                                    <span className="font-medium mr-1">
                                      {formatTime(new Date(event.startDate))}
                                    </span>
                                  )}
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 3 && (
                                <div className="text-xs text-gray-500 p-1">
                                  +{dayEvents.length - 3} altri
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {view === 'list' && (
                  <div className="space-y-2">
                    {events
                      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
                      .map(event => (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <div
                            className="w-1 h-12 rounded-full"
                            style={{ backgroundColor: event.color }}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium">{event.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {new Date(event.startDate).toLocaleDateString('it-IT')}
                              </span>
                              {!event.allDay && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(new Date(event.startDate))} - {formatTime(new Date(event.endDate))}
                                </span>
                              )}
                              {event.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {event.location}
                                </span>
                              )}
                              {event.isOnline && (
                                <span className="flex items-center gap-1">
                                  <Video className="h-3 w-3" />
                                  Online
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {eventTypes.find(t => t.type === event.type)?.label || event.type}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mini Calendar */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Selezione rapida</CardTitle>
              </CardHeader>
              <CardContent>
                <Input type="date" className="w-full" />
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Prossimi eventi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nessun evento in programma
                    </p>
                  ) : (
                    upcomingEvents.map(event => (
                      <div
                        key={event.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <div
                          className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.startDate).toLocaleDateString('it-IT', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })}
                            {!event.allDay && ` • ${formatTime(new Date(event.startDate))}`}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Types Legend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Tipi di evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {eventTypes.map(type => (
                    <div key={type.type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      />
                      <span className="text-sm text-gray-600">{type.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Calendar Sync */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Sincronizzazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <img src="/google-calendar.svg" alt="" className="w-4 h-4 mr-2" />
                    Google Calendar
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <img src="/outlook.svg" alt="" className="w-4 h-4 mr-2" />
                    Outlook
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Sincronizza il tuo calendario con Google o Outlook
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
