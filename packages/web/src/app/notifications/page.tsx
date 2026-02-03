'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Info,
  MessageSquare,
  Package,
  Clock
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isRead: boolean;
  createdAt: string;
  link?: string;
  entityType?: string;
  entityId?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'TASK_ASSIGNED',
    title: 'Nuovo task assegnato',
    message: 'Ti è stato assegnato il task "Preparare preventivo cliente Rossi"',
    priority: 'HIGH',
    isRead: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    entityType: 'task',
    entityId: 't1'
  },
  {
    id: '2',
    type: 'DEAL_WON',
    title: 'Trattativa vinta!',
    message: 'La trattativa "Impianto FV 10kW - Bianchi" è stata vinta!',
    priority: 'NORMAL',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    entityType: 'deal',
    entityId: 'd1'
  },
  {
    id: '3',
    type: 'EVENT_REMINDER',
    title: 'Promemoria evento',
    message: 'Sopralluogo presso Via Roma 123 tra 1 ora',
    priority: 'HIGH',
    isRead: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    entityType: 'event',
    entityId: 'e1'
  },
  {
    id: '4',
    type: 'DOCUMENT_SHARED',
    title: 'Documento condiviso',
    message: 'Marco Verdi ha condiviso "Preventivo_2024_001.pdf" con te',
    priority: 'NORMAL',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    entityType: 'document',
    entityId: 'doc1'
  },
  {
    id: '5',
    type: 'COMMENT_ADDED',
    title: 'Nuovo commento',
    message: 'Luigi Neri ha commentato sul progetto "FV Residenziale Milano"',
    priority: 'LOW',
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    entityType: 'project',
    entityId: 'p1'
  },
  {
    id: '6',
    type: 'ORDER_DELIVERED',
    title: 'Ordine consegnato',
    message: 'L\'ordine PO-2024-0042 da Panel Solar è stato consegnato',
    priority: 'NORMAL',
    isRead: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    entityType: 'order',
    entityId: 'ord1'
  }
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'TASK_ASSIGNED':
    case 'TASK_DUE':
      return <Clock className="h-5 w-5" />;
    case 'DEAL_WON':
    case 'DEAL_LOST':
    case 'DEAL_STAGE_CHANGED':
      return <FileText className="h-5 w-5" />;
    case 'EVENT_REMINDER':
    case 'EVENT_INVITATION':
      return <Calendar className="h-5 w-5" />;
    case 'DOCUMENT_SHARED':
      return <FileText className="h-5 w-5" />;
    case 'COMMENT_ADDED':
    case 'MENTION':
      return <MessageSquare className="h-5 w-5" />;
    case 'ORDER_DELIVERED':
    case 'ORDER_STATUS':
      return <Package className="h-5 w-5" />;
    case 'CONTACT_ASSIGNED':
      return <User className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'URGENT':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'HIGH':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'NORMAL':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'LOW':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} min fa`;
  if (diffHours < 24) return `${diffHours} ore fa`;
  if (diffDays < 7) return `${diffDays} giorni fa`;
  return date.toLocaleDateString('it-IT');
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [activeTab, setActiveTab] = useState('all');

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'read') return n.isRead;
    return true;
  });

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifiche</h1>
            <p className="text-gray-600">
              {unreadCount > 0
                ? `Hai ${unreadCount} notifiche non lette`
                : 'Nessuna notifica non letta'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Segna tutte come lette
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Preferenze
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bell className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                  <p className="text-sm text-gray-500">Totali</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unreadCount}</p>
                  <p className="text-sm text-gray-500">Non lette</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => n.priority === 'HIGH' || n.priority === 'URGENT').length}
                  </p>
                  <p className="text-sm text-gray-500">Alta priorità</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {notifications.filter(n => n.isRead).length}
                  </p>
                  <p className="text-sm text-gray-500">Lette</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">
                  Tutte ({notifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread">
                  Non lette ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="read">
                  Lette ({notifications.filter(n => n.isRead).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nessuna notifica</p>
                </div>
              ) : (
                filteredNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                        <Badge className={getPriorityColor(notification.priority)}>
                          {notification.priority === 'URGENT' && 'Urgente'}
                          {notification.priority === 'HIGH' && 'Alta'}
                          {notification.priority === 'NORMAL' && 'Normale'}
                          {notification.priority === 'LOW' && 'Bassa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
