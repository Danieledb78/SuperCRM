'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DataTable, Column } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Download, Upload, MoreHorizontal, Mail, Phone } from 'lucide-react';
import { formatDate, getInitials, STATUS_LABELS } from '@/lib/utils';

// Demo data
const contacts = [
  {
    id: '1',
    firstName: 'Mario',
    lastName: 'Rossi',
    email: 'mario.rossi@email.it',
    phone: '+39 333 1234567',
    company: 'Rossi SRL',
    status: 'CUSTOMER',
    createdAt: '2024-01-15',
    avatar: null,
  },
  {
    id: '2',
    firstName: 'Luigi',
    lastName: 'Bianchi',
    email: 'luigi.bianchi@email.it',
    phone: '+39 334 7654321',
    company: 'Bianchi SpA',
    status: 'PROSPECT',
    createdAt: '2024-01-20',
    avatar: null,
  },
  {
    id: '3',
    firstName: 'Anna',
    lastName: 'Verdi',
    email: 'anna.verdi@email.it',
    phone: '+39 335 9876543',
    company: 'Verdi & Co',
    status: 'LEAD',
    createdAt: '2024-01-25',
    avatar: null,
  },
  {
    id: '4',
    firstName: 'Giuseppe',
    lastName: 'Neri',
    email: 'giuseppe.neri@email.it',
    phone: '+39 336 1234567',
    company: 'Neri Group',
    status: 'CUSTOMER',
    createdAt: '2024-01-28',
    avatar: null,
  },
  {
    id: '5',
    firstName: 'Francesca',
    lastName: 'Gialli',
    email: 'francesca.gialli@email.it',
    phone: '+39 337 9876543',
    company: null,
    status: 'LEAD',
    createdAt: '2024-02-01',
    avatar: null,
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'CUSTOMER':
      return 'success';
    case 'PROSPECT':
      return 'warning';
    case 'LEAD':
      return 'info';
    case 'CHURNED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export default function ContactsPage() {
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const columns: Column<typeof contacts[0]>[] = [
    {
      key: 'name',
      header: 'Nome',
      sortable: true,
      render: (contact) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={contact.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {getInitials(contact.firstName, contact.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{contact.firstName} {contact.lastName}</p>
            {contact.company && (
              <p className="text-sm text-muted-foreground">{contact.company}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (contact) => (
        <a
          href={`mailto:${contact.email}`}
          className="flex items-center gap-1 text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Mail className="h-3 w-3" />
          {contact.email}
        </a>
      ),
    },
    {
      key: 'phone',
      header: 'Telefono',
      render: (contact) => (
        <a
          href={`tel:${contact.phone}`}
          className="flex items-center gap-1 hover:text-primary"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="h-3 w-3" />
          {contact.phone}
        </a>
      ),
    },
    {
      key: 'status',
      header: 'Stato',
      sortable: true,
      render: (contact) => (
        <Badge variant={getStatusBadgeVariant(contact.status) as any}>
          {STATUS_LABELS[contact.status] || contact.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Data Creazione',
      sortable: true,
      render: (contact) => formatDate(contact.createdAt),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (contact) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            // Show dropdown menu
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  const handleRowClick = (contact: typeof contacts[0]) => {
    router.push(`/contacts/${contact.id}`);
  };

  const handleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedRows.length === contacts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(contacts.map((c) => c.id));
    }
  };

  return (
    <DashboardLayout title="Contatti">
      <DataTable
        data={contacts}
        columns={columns}
        searchPlaceholder="Cerca contatti..."
        searchFields={['firstName', 'lastName', 'email', 'company']}
        onRowClick={handleRowClick}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        actions={
          <>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importa
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Esporta
            </Button>
            <Button size="sm" onClick={() => router.push('/contacts/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Contatto
            </Button>
          </>
        }
      />
    </DashboardLayout>
  );
}
