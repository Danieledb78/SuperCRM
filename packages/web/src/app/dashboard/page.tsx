'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Building2,
  Handshake,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  FileText,
  FolderKanban,
  Euro,
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

// Demo data
const stats = [
  {
    title: 'Contatti',
    value: 1234,
    change: 12.5,
    icon: Users,
    href: '/contacts',
  },
  {
    title: 'Aziende',
    value: 456,
    change: 8.2,
    icon: Building2,
    href: '/companies',
  },
  {
    title: 'Trattative Aperte',
    value: 89,
    change: -3.1,
    icon: Handshake,
    href: '/deals',
  },
  {
    title: 'Fatturato Mese',
    value: 125000,
    change: 15.3,
    icon: Euro,
    href: '/invoices',
    isCurrency: true,
  },
];

const recentDeals = [
  { id: '1', title: 'Impianto FV 10kW', company: 'Mario Rossi SRL', value: 25000, stage: 'Proposta', date: new Date() },
  { id: '2', title: 'Ristrutturazione Elettrica', company: 'Bianchi SpA', value: 15000, stage: 'Negoziazione', date: new Date(Date.now() - 86400000) },
  { id: '3', title: 'Impianto Accumulo 5kWh', company: 'Verdi & Co', value: 8000, stage: 'Qualificazione', date: new Date(Date.now() - 172800000) },
];

const recentProjects = [
  { id: '1', code: 'COM-2024-001', name: 'Impianto FV Residenziale', status: 'IN_PROGRESS', phase: 'Installazione' },
  { id: '2', code: 'COM-2024-002', name: 'Revamping Impianto', status: 'APPROVED', phase: 'Tecnico' },
  { id: '3', code: 'COM-2024-003', name: 'Nuovo Impianto Industriale', status: 'QUOTED', phase: 'Preventivo' },
];

const upcomingTasks = [
  { id: '1', title: 'Sopralluogo cliente Rossi', dueDate: new Date(Date.now() + 86400000), priority: 'HIGH' },
  { id: '2', title: 'Preparare preventivo FV', dueDate: new Date(Date.now() + 172800000), priority: 'MEDIUM' },
  { id: '3', title: 'Chiamare fornitore pannelli', dueDate: new Date(Date.now() + 259200000), priority: 'LOW' },
];

export default function DashboardPage() {
  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">
                        {stat.isCurrency ? formatCurrency(stat.value) : stat.value.toLocaleString('it-IT')}
                      </p>
                    </div>
                    <div className={`rounded-full p-3 ${stat.change >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <stat.icon className={`h-5 w-5 ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${stat.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                    <span>{Math.abs(stat.change)}% vs mese scorso</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Deals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Trattative Recenti</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/deals">Vedi tutte</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-muted-foreground">{deal.company}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(deal.value)}</p>
                      <Badge variant="info" className="mt-1">{deal.stage}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Commesse Attive</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">Vedi tutte</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <FolderKanban className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{project.code}</p>
                        <p className="text-sm text-muted-foreground">{project.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={project.status === 'IN_PROGRESS' ? 'info' : 'secondary'}>
                        {project.phase}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Attivita in Scadenza</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/tasks">Vedi tutte</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" />
                    <div className="flex-1">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {formatRelativeTime(task.dueDate)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        task.priority === 'HIGH' ? 'destructive' :
                        task.priority === 'MEDIUM' ? 'warning' : 'secondary'
                      }
                    >
                      {task.priority === 'HIGH' ? 'Alta' : task.priority === 'MEDIUM' ? 'Media' : 'Bassa'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Azioni Rapide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                  <Link href="/contacts/new">
                    <Users className="h-5 w-5 mb-2" />
                    Nuovo Contatto
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                  <Link href="/deals/new">
                    <Handshake className="h-5 w-5 mb-2" />
                    Nuova Trattativa
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                  <Link href="/quotes/new">
                    <FileText className="h-5 w-5 mb-2" />
                    Nuovo Preventivo
                  </Link>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col" asChild>
                  <Link href="/projects/new">
                    <FolderKanban className="h-5 w-5 mb-2" />
                    Nuova Commessa
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
