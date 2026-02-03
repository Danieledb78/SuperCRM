'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/data-table/data-table';
import {
  Users,
  Truck,
  Plus,
  Search,
  Mail,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  FileText,
  MessageSquare,
  ExternalLink,
  MoreVertical,
  RefreshCw,
  Eye,
  Settings,
  Ban,
  Key
} from 'lucide-react';

interface PortalAccess {
  id: string;
  type: 'CUSTOMER' | 'SUPPLIER';
  email: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'EXPIRED';
  name: string;
  company?: string;
  permissions: string[];
  lastLoginAt?: string;
  invitedAt?: string;
  createdAt: string;
}

const mockPortalAccesses: PortalAccess[] = [
  {
    id: 'pa_1',
    type: 'CUSTOMER',
    email: 'mario.rossi@email.it',
    status: 'ACTIVE',
    name: 'Mario Rossi',
    company: 'Rossi SRL',
    permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES'],
    lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 2592000000).toISOString()
  },
  {
    id: 'pa_2',
    type: 'SUPPLIER',
    email: 'forniture@panelsolar.it',
    status: 'ACTIVE',
    name: 'Giuseppe Verdi',
    company: 'Panel Solar Italia',
    permissions: ['VIEW_ORDERS', 'UPDATE_DELIVERY', 'SEND_MESSAGES', 'UPLOAD_DOCUMENTS'],
    lastLoginAt: new Date(Date.now() - 3600000).toISOString(),
    createdAt: new Date(Date.now() - 5184000000).toISOString()
  },
  {
    id: 'pa_3',
    type: 'CUSTOMER',
    email: 'info@bianchi-costruzioni.it',
    status: 'PENDING',
    name: 'Luigi Bianchi',
    company: 'Bianchi Costruzioni',
    permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS'],
    invitedAt: new Date(Date.now() - 172800000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'pa_4',
    type: 'SUPPLIER',
    email: 'vendite@inverterplus.com',
    status: 'ACTIVE',
    name: 'Anna Neri',
    company: 'Inverter Plus',
    permissions: ['VIEW_ORDERS', 'UPDATE_DELIVERY', 'SEND_MESSAGES'],
    lastLoginAt: new Date(Date.now() - 604800000).toISOString(),
    createdAt: new Date(Date.now() - 7776000000).toISOString()
  },
  {
    id: 'pa_5',
    type: 'CUSTOMER',
    email: 'marco.ferrari@gmail.com',
    status: 'SUSPENDED',
    name: 'Marco Ferrari',
    permissions: ['VIEW_PROJECTS'],
    createdAt: new Date(Date.now() - 10368000000).toISOString()
  },
  {
    id: 'pa_6',
    type: 'CUSTOMER',
    email: 'laura.conti@azienda.it',
    status: 'PENDING',
    name: 'Laura Conti',
    company: 'Conti Immobiliare',
    permissions: ['VIEW_PROJECTS', 'VIEW_DOCUMENTS', 'SEND_MESSAGES'],
    invitedAt: new Date(Date.now() - 259200000).toISOString(),
    createdAt: new Date(Date.now() - 259200000).toISOString()
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return <Badge className="bg-green-100 text-green-800">Attivo</Badge>;
    case 'PENDING':
      return <Badge className="bg-yellow-100 text-yellow-800">In attesa</Badge>;
    case 'SUSPENDED':
      return <Badge className="bg-red-100 text-red-800">Sospeso</Badge>;
    case 'EXPIRED':
      return <Badge className="bg-gray-100 text-gray-800">Scaduto</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const formatTimeAgo = (dateString?: string) => {
  if (!dateString) return 'Mai';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return 'Oggi';
  if (diffDays === 1) return 'Ieri';
  if (diffDays < 7) return `${diffDays} giorni fa`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
  return date.toLocaleDateString('it-IT');
};

export default function PortalPage() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [accesses] = useState<PortalAccess[]>(mockPortalAccesses);

  const customers = accesses.filter(a => a.type === 'CUSTOMER');
  const suppliers = accesses.filter(a => a.type === 'SUPPLIER');
  const pending = accesses.filter(a => a.status === 'PENDING');

  const filteredAccesses = accesses.filter(access => {
    const matchesSearch =
      access.name.toLowerCase().includes(search.toLowerCase()) ||
      access.email.toLowerCase().includes(search.toLowerCase()) ||
      access.company?.toLowerCase().includes(search.toLowerCase());

    if (activeTab === 'customers') return matchesSearch && access.type === 'CUSTOMER';
    if (activeTab === 'suppliers') return matchesSearch && access.type === 'SUPPLIER';
    if (activeTab === 'pending') return matchesSearch && access.status === 'PENDING';
    return matchesSearch;
  });

  const columns = [
    {
      key: 'name',
      label: 'Utente',
      sortable: true,
      render: (value: string, row: PortalAccess) => (
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
              row.type === 'CUSTOMER' ? 'bg-blue-500' : 'bg-purple-500'
            }`}>
              {row.type === 'CUSTOMER' ? <Users className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
            </div>
            <div>
              <p className="font-medium">{value}</p>
              <p className="text-sm text-gray-500">{row.email}</p>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'company',
      label: 'Azienda',
      sortable: true,
      render: (value: string) => value || '-'
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (value: string) => (
        <Badge variant="outline">
          {value === 'CUSTOMER' ? 'Cliente' : 'Fornitore'}
        </Badge>
      )
    },
    {
      key: 'status',
      label: 'Stato',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'lastLoginAt',
      label: 'Ultimo accesso',
      sortable: true,
      render: (value: string, row: PortalAccess) => (
        <span className="text-sm text-gray-500">
          {row.status === 'PENDING' ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Invito inviato {formatTimeAgo(row.invitedAt)}
            </span>
          ) : (
            formatTimeAgo(value)
          )}
        </span>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (_: any, row: PortalAccess) => (
        <div className="flex items-center gap-1">
          {row.status === 'PENDING' && (
            <Button variant="ghost" size="sm" title="Reinvia invito">
              <Send className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm" title="Visualizza">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Impostazioni">
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Altro">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Portali Esterni</h1>
            <p className="text-gray-600">Gestisci gli accessi ai portali clienti e fornitori</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurazione
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Invita Utente
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-gray-500">Clienti</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{suppliers.length}</p>
                  <p className="text-sm text-gray-500">Fornitori</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {accesses.filter(a => a.status === 'ACTIVE').length}
                  </p>
                  <p className="text-sm text-gray-500">Attivi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pending.length}</p>
                  <p className="text-sm text-gray-500">In attesa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:border-blue-300 cursor-pointer transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">Messaggi</h3>
                  <p className="text-sm text-gray-500">3 messaggi non letti</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-blue-300 cursor-pointer transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">Documenti</h3>
                  <p className="text-sm text-gray-500">456 documenti condivisi</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:border-blue-300 cursor-pointer transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ExternalLink className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">Vai al Portale</h3>
                  <p className="text-sm text-gray-500">Apri portale clienti</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access List */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">
                    Tutti ({accesses.length})
                  </TabsTrigger>
                  <TabsTrigger value="customers">
                    Clienti ({customers.length})
                  </TabsTrigger>
                  <TabsTrigger value="suppliers">
                    Fornitori ({suppliers.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    In attesa ({pending.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca utente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredAccesses}
              columns={columns}
              searchable={false}
              pageSize={10}
            />
          </CardContent>
        </Card>

        {/* Pending Invitations Alert */}
        {pending.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      {pending.length} inviti in attesa di accettazione
                    </p>
                    <p className="text-sm text-yellow-700">
                      Gli inviti scadono dopo 7 giorni. Considera di reinviare gli inviti più vecchi.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reinvia tutti
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
