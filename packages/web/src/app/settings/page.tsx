'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Users,
  Shield,
  Bell,
  Palette,
  Database,
  Mail,
  Globe,
  Key,
  CreditCard,
  FileText,
  Save,
  Upload,
  Trash2,
  Plus,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

// Organization Settings
function OrganizationSettings() {
  const [org, setOrg] = useState({
    name: 'Solar Tech Italia SRL',
    vatNumber: 'IT12345678901',
    fiscalCode: '12345678901',
    address: 'Via Roma 123',
    city: 'Milano',
    province: 'MI',
    postalCode: '20100',
    country: 'Italia',
    phone: '+39 02 1234567',
    email: 'info@solartech.it',
    pec: 'solartech@pec.it',
    website: 'https://www.solartech.it'
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informazioni Azienda</CardTitle>
          <CardDescription>Dati anagrafici e fiscali dell'organizzazione</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Ragione Sociale</label>
              <Input value={org.name} onChange={e => setOrg({...org, name: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Partita IVA</label>
              <Input value={org.vatNumber} onChange={e => setOrg({...org, vatNumber: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Codice Fiscale</label>
              <Input value={org.fiscalCode} onChange={e => setOrg({...org, fiscalCode: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Telefono</label>
              <Input value={org.phone} onChange={e => setOrg({...org, phone: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Indirizzo</label>
              <Input value={org.address} onChange={e => setOrg({...org, address: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">CAP</label>
              <Input value={org.postalCode} onChange={e => setOrg({...org, postalCode: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Città</label>
              <Input value={org.city} onChange={e => setOrg({...org, city: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Provincia</label>
              <Input value={org.province} onChange={e => setOrg({...org, province: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Paese</label>
              <Input value={org.country} onChange={e => setOrg({...org, country: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input value={org.email} onChange={e => setOrg({...org, email: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">PEC</label>
              <Input value={org.pec} onChange={e => setOrg({...org, pec: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-medium">Sito Web</label>
              <Input value={org.website} onChange={e => setOrg({...org, website: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button><Save className="h-4 w-4 mr-2" />Salva Modifiche</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo Aziendale</CardTitle>
          <CardDescription>Carica il logo per documenti e fatture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed">
              <Building2 className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Carica Logo</Button>
              <p className="text-sm text-gray-500">PNG, JPG o SVG. Max 2MB.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Users Management
function UsersSettings() {
  const users = [
    { id: '1', name: 'Mario Rossi', email: 'mario@solartech.it', role: 'ADMIN', status: 'active' },
    { id: '2', name: 'Laura Bianchi', email: 'laura@solartech.it', role: 'SALES_MANAGER', status: 'active' },
    { id: '3', name: 'Giuseppe Verdi', email: 'giuseppe@solartech.it', role: 'TECHNICIAN', status: 'active' },
    { id: '4', name: 'Anna Neri', email: 'anna@solartech.it', role: 'SALES_REP', status: 'inactive' },
  ];

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      'ADMIN': 'bg-red-100 text-red-800',
      'SALES_MANAGER': 'bg-blue-100 text-blue-800',
      'TECHNICIAN': 'bg-green-100 text-green-800',
      'SALES_REP': 'bg-purple-100 text-purple-800'
    };
    const labels: Record<string, string> = {
      'ADMIN': 'Amministratore',
      'SALES_MANAGER': 'Resp. Vendite',
      'TECHNICIAN': 'Tecnico',
      'SALES_REP': 'Commerciale'
    };
    return <Badge className={colors[role] || 'bg-gray-100'}>{labels[role] || role}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Utenti</CardTitle>
            <CardDescription>Gestisci gli utenti del sistema</CardDescription>
          </div>
          <Button><Plus className="h-4 w-4 mr-2" />Nuovo Utente</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">{user.name.split(' ').map(n => n[0]).join('')}</span>
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getRoleBadge(user.role)}
                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                  {user.status === 'active' ? 'Attivo' : 'Inattivo'}
                </Badge>
                <Button variant="ghost" size="sm">Modifica</Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Security Settings
function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cambio Password</CardTitle>
          <CardDescription>Aggiorna la password del tuo account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Password Attuale</label>
            <div className="relative">
              <Input type={showPassword ? 'text' : 'password'} />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Nuova Password</label>
            <Input type="password" />
          </div>
          <div>
            <label className="text-sm font-medium">Conferma Password</label>
            <Input type="password" />
          </div>
          <Button>Aggiorna Password</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Autenticazione a Due Fattori</CardTitle>
          <CardDescription>Aggiungi un livello di sicurezza extra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">2FA non attiva</p>
              <p className="text-sm text-gray-500">Proteggi il tuo account con l'autenticazione a due fattori</p>
            </div>
            <Button variant="outline">Attiva 2FA</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessioni Attive</CardTitle>
          <CardDescription>Dispositivi attualmente connessi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Chrome su Windows</p>
                <p className="text-sm text-gray-500">Milano, Italia - Sessione corrente</p>
              </div>
              <Badge className="bg-green-100 text-green-800">Attiva</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Safari su iPhone</p>
                <p className="text-sm text-gray-500">Milano, Italia - 2 ore fa</p>
              </div>
              <Button variant="ghost" size="sm">Disconnetti</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Notification Settings
function NotificationSettings() {
  const [prefs, setPrefs] = useState({
    emailDeals: true,
    emailTasks: true,
    emailProjects: false,
    pushDeals: true,
    pushTasks: false,
    pushProjects: true,
    digestDaily: false,
    digestWeekly: true
  });

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-200'}`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferenze Notifiche</CardTitle>
        <CardDescription>Scegli come ricevere le notifiche</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="font-medium mb-3">Notifiche Email</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Nuove trattative e aggiornamenti</span>
              <Toggle checked={prefs.emailDeals} onChange={() => setPrefs({...prefs, emailDeals: !prefs.emailDeals})} />
            </div>
            <div className="flex items-center justify-between">
              <span>Task assegnati e scadenze</span>
              <Toggle checked={prefs.emailTasks} onChange={() => setPrefs({...prefs, emailTasks: !prefs.emailTasks})} />
            </div>
            <div className="flex items-center justify-between">
              <span>Aggiornamenti commesse</span>
              <Toggle checked={prefs.emailProjects} onChange={() => setPrefs({...prefs, emailProjects: !prefs.emailProjects})} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Notifiche Push</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Nuove trattative</span>
              <Toggle checked={prefs.pushDeals} onChange={() => setPrefs({...prefs, pushDeals: !prefs.pushDeals})} />
            </div>
            <div className="flex items-center justify-between">
              <span>Promemoria task</span>
              <Toggle checked={prefs.pushTasks} onChange={() => setPrefs({...prefs, pushTasks: !prefs.pushTasks})} />
            </div>
            <div className="flex items-center justify-between">
              <span>Stato commesse</span>
              <Toggle checked={prefs.pushProjects} onChange={() => setPrefs({...prefs, pushProjects: !prefs.pushProjects})} />
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-3">Riepilogo</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Riepilogo giornaliero</span>
              <Toggle checked={prefs.digestDaily} onChange={() => setPrefs({...prefs, digestDaily: !prefs.digestDaily})} />
            </div>
            <div className="flex items-center justify-between">
              <span>Riepilogo settimanale</span>
              <Toggle checked={prefs.digestWeekly} onChange={() => setPrefs({...prefs, digestWeekly: !prefs.digestWeekly})} />
            </div>
          </div>
        </div>

        <Button><Save className="h-4 w-4 mr-2" />Salva Preferenze</Button>
      </CardContent>
    </Card>
  );
}

// Billing Settings
function BillingSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Piano Attuale</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
            <div>
              <h3 className="text-lg font-semibold">Piano Professional</h3>
              <p className="text-sm text-gray-500">10 utenti inclusi, storage illimitato</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">€99/mese</p>
              <Button variant="outline" size="sm" className="mt-2">Cambia Piano</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Metodo di Pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-gray-400" />
              <div>
                <p className="font-medium">Visa •••• 4242</p>
                <p className="text-sm text-gray-500">Scade 12/2025</p>
              </div>
            </div>
            <Button variant="ghost">Modifica</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storico Fatture</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { date: '01/02/2024', amount: '€99.00', status: 'Pagata' },
              { date: '01/01/2024', amount: '€99.00', status: 'Pagata' },
              { date: '01/12/2023', amount: '€99.00', status: 'Pagata' },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{invoice.date}</p>
                  <p className="text-sm text-gray-500">{invoice.amount}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800">{invoice.status}</Badge>
                  <Button variant="ghost" size="sm"><FileText className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('organization');

  const tabs = [
    { id: 'organization', label: 'Azienda', icon: Building2 },
    { id: 'users', label: 'Utenti', icon: Users },
    { id: 'security', label: 'Sicurezza', icon: Shield },
    { id: 'notifications', label: 'Notifiche', icon: Bell },
    { id: 'billing', label: 'Fatturazione', icon: CreditCard },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
          <p className="text-gray-600">Gestisci le impostazioni dell'account e dell'organizzazione</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="md:w-64 space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'organization' && <OrganizationSettings />}
            {activeTab === 'users' && <UsersSettings />}
            {activeTab === 'security' && <SecuritySettings />}
            {activeTab === 'notifications' && <NotificationSettings />}
            {activeTab === 'billing' && <BillingSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
