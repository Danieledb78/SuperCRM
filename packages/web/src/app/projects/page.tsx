'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { KanbanBoard, KanbanItem, KanbanColumnDef } from '@/components/kanban/kanban-board';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  List,
  LayoutGrid,
  Calendar,
  User,
  Euro,
  Sun,
  Wrench,
  FileText,
  Truck,
  Hammer,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

// Kanban view types
type KanbanView = 'TECHNICAL' | 'ADMINISTRATIVE' | 'SUPPLIER' | 'INSTALLATION';

// Column definitions for each view
const viewColumns: Record<KanbanView, KanbanColumnDef[]> = {
  TECHNICAL: [
    { id: 'SURVEY', title: 'Sopralluogo', color: '#6B7280' },
    { id: 'DESIGN', title: 'Progettazione', color: '#3B82F6' },
    { id: 'PERMITS', title: 'Permessi', color: '#F59E0B' },
    { id: 'READY', title: 'Pronto', color: '#10B981' },
  ],
  ADMINISTRATIVE: [
    { id: 'QUOTE_PENDING', title: 'Preventivo', color: '#6B7280' },
    { id: 'QUOTE_SENT', title: 'Inviato', color: '#3B82F6' },
    { id: 'APPROVED', title: 'Approvato', color: '#10B981' },
    { id: 'INVOICED', title: 'Fatturato', color: '#8B5CF6' },
    { id: 'PAID', title: 'Pagato', color: '#22C55E' },
  ],
  SUPPLIER: [
    { id: 'TO_ORDER', title: 'Da Ordinare', color: '#6B7280' },
    { id: 'ORDERED', title: 'Ordinato', color: '#3B82F6' },
    { id: 'PARTIAL', title: 'Parziale', color: '#F59E0B' },
    { id: 'RECEIVED', title: 'Ricevuto', color: '#10B981' },
  ],
  INSTALLATION: [
    { id: 'SCHEDULED', title: 'Programmato', color: '#6B7280' },
    { id: 'IN_PROGRESS', title: 'In Corso', color: '#3B82F6' },
    { id: 'TESTING', title: 'Collaudo', color: '#F59E0B' },
    { id: 'COMPLETED', title: 'Completato', color: '#10B981' },
  ],
};

const viewIcons: Record<KanbanView, React.ElementType> = {
  TECHNICAL: Wrench,
  ADMINISTRATIVE: FileText,
  SUPPLIER: Truck,
  INSTALLATION: Hammer,
};

const viewLabels: Record<KanbanView, string> = {
  TECHNICAL: 'Tecnico',
  ADMINISTRATIVE: 'Amministrativo',
  SUPPLIER: 'Fornitori',
  INSTALLATION: 'Installazione',
};

// Demo projects data
const projects: (KanbanItem & {
  code: string;
  customer: string;
  value: number;
  powerKw: number;
  manager: string;
  startDate: string;
  technicalPhase: string;
  administrativePhase: string;
  supplierPhase: string;
  installationPhase: string;
})[] = [
  {
    id: '1',
    columnId: 'DESIGN',
    title: 'Impianto FV Residenziale 6kW',
    code: 'COM-2024-001',
    customer: 'Mario Rossi',
    value: 15000,
    powerKw: 6,
    manager: 'Giuseppe Verdi',
    startDate: '2024-01-15',
    technicalPhase: 'DESIGN',
    administrativePhase: 'APPROVED',
    supplierPhase: 'ORDERED',
    installationPhase: 'SCHEDULED',
  },
  {
    id: '2',
    columnId: 'PERMITS',
    title: 'Impianto FV Industriale 50kW',
    code: 'COM-2024-002',
    customer: 'Bianchi SpA',
    value: 85000,
    powerKw: 50,
    manager: 'Anna Neri',
    startDate: '2024-01-20',
    technicalPhase: 'PERMITS',
    administrativePhase: 'QUOTE_SENT',
    supplierPhase: 'TO_ORDER',
    installationPhase: 'SCHEDULED',
  },
  {
    id: '3',
    columnId: 'SURVEY',
    title: 'Accumulo Residenziale 10kWh',
    code: 'COM-2024-003',
    customer: 'Luigi Verdi',
    value: 12000,
    powerKw: 0,
    manager: 'Giuseppe Verdi',
    startDate: '2024-02-01',
    technicalPhase: 'SURVEY',
    administrativePhase: 'QUOTE_PENDING',
    supplierPhase: 'TO_ORDER',
    installationPhase: 'SCHEDULED',
  },
  {
    id: '4',
    columnId: 'READY',
    title: 'Revamping Impianto 20kW',
    code: 'COM-2024-004',
    customer: 'Gialli SRL',
    value: 25000,
    powerKw: 20,
    manager: 'Anna Neri',
    startDate: '2024-01-10',
    technicalPhase: 'READY',
    administrativePhase: 'INVOICED',
    supplierPhase: 'RECEIVED',
    installationPhase: 'IN_PROGRESS',
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<KanbanView>('TECHNICAL');
  const [displayMode, setDisplayMode] = useState<'kanban' | 'list'>('kanban');

  // Transform projects for current view
  const getKanbanItems = (): KanbanItem[] => {
    return projects.map((project) => {
      let columnId: string;
      switch (currentView) {
        case 'TECHNICAL':
          columnId = project.technicalPhase;
          break;
        case 'ADMINISTRATIVE':
          columnId = project.administrativePhase;
          break;
        case 'SUPPLIER':
          columnId = project.supplierPhase;
          break;
        case 'INSTALLATION':
          columnId = project.installationPhase;
          break;
        default:
          columnId = project.technicalPhase;
      }
      return { ...project, columnId };
    });
  };

  const handleDragEnd = (itemId: string, sourceColumnId: string, targetColumnId: string) => {
    console.log(`Moving ${itemId} from ${sourceColumnId} to ${targetColumnId}`);
    // In real implementation, call API to update project phase
  };

  const handleProjectClick = (item: KanbanItem) => {
    router.push(`/projects/${item.id}`);
  };

  const renderProjectCard = (item: KanbanItem) => {
    const project = item as typeof projects[0];
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {project.code}
          </Badge>
          {project.powerKw > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Sun className="h-3 w-3" />
              {project.powerKw}kW
            </div>
          )}
        </div>
        <p className="font-medium text-sm">{project.title}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="h-3 w-3" />
          {project.customer}
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-xs font-medium text-primary">
            <Euro className="h-3 w-3" />
            {formatCurrency(project.value)}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(project.startDate)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout title="Commesse">
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          {/* View Tabs */}
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
            {(Object.keys(viewColumns) as KanbanView[]).map((view) => {
              const Icon = viewIcons[view];
              return (
                <Button
                  key={view}
                  variant={currentView === view ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setCurrentView(view)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {viewLabels[view]}
                </Button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <Button
                variant={displayMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('kanban')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={displayMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDisplayMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button onClick={() => router.push('/projects/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Commessa
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Totale Commesse</p>
              <p className="text-2xl font-bold">{projects.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Valore Totale</p>
              <p className="text-2xl font-bold">{formatCurrency(projects.reduce((sum, p) => sum + p.value, 0))}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Potenza Totale</p>
              <p className="text-2xl font-bold">{projects.reduce((sum, p) => sum + p.powerKw, 0)} kW</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Installazione</p>
              <p className="text-2xl font-bold">
                {projects.filter((p) => p.installationPhase === 'IN_PROGRESS').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        {displayMode === 'kanban' && (
          <KanbanBoard
            columns={viewColumns[currentView]}
            items={getKanbanItems()}
            onDragEnd={handleDragEnd}
            onItemClick={handleProjectClick}
            renderCard={renderProjectCard}
          />
        )}

        {/* List View */}
        {displayMode === 'list' && (
          <Card>
            <CardContent className="p-0">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Codice</th>
                    <th>Titolo</th>
                    <th>Cliente</th>
                    <th>Valore</th>
                    <th>Potenza</th>
                    <th>Fase {viewLabels[currentView]}</th>
                    <th>Data Inizio</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => (
                    <tr
                      key={project.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <td>
                        <Badge variant="outline">{project.code}</Badge>
                      </td>
                      <td className="font-medium">{project.title}</td>
                      <td>{project.customer}</td>
                      <td>{formatCurrency(project.value)}</td>
                      <td>{project.powerKw > 0 ? `${project.powerKw} kW` : '-'}</td>
                      <td>
                        <Badge variant="info">
                          {viewColumns[currentView].find(
                            (c) => c.id === project[`${currentView.toLowerCase()}Phase` as keyof typeof project]
                          )?.title}
                        </Badge>
                      </td>
                      <td>{formatDate(project.startDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
