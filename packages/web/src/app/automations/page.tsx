'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  isActive: boolean;
  runOnce: boolean;
  enrollmentCount: number;
  createdAt: string;
  owner?: { firstName: string; lastName: string };
  _count?: { actions: number; enrollments: number };
}

const TRIGGER_LABELS: Record<string, string> = {
  CONTACT_CREATED: 'Nuovo contatto',
  CONTACT_UPDATED: 'Contatto aggiornato',
  CONTACT_TAG_ADDED: 'Tag aggiunto',
  CONTACT_TAG_REMOVED: 'Tag rimosso',
  CONTACT_SCORE_CHANGED: 'Punteggio cambiato',
  DEAL_CREATED: 'Nuova trattativa',
  DEAL_STAGE_CHANGED: 'Cambio fase trattativa',
  DEAL_WON: 'Trattativa vinta',
  DEAL_LOST: 'Trattativa persa',
  PROJECT_CREATED: 'Nuovo progetto',
  PROJECT_STATUS_CHANGED: 'Cambio stato progetto',
  PROJECT_COMPLETED: 'Progetto completato',
  EMAIL_OPENED: 'Email aperta',
  EMAIL_CLICKED: 'Link cliccato in email',
  FORM_SUBMITTED: 'Form inviato',
  APPOINTMENT_SCHEDULED: 'Appuntamento fissato',
  TASK_COMPLETED: 'Attività completata',
  INVOICE_OVERDUE: 'Fattura scaduta',
  MANUAL: 'Attivazione manuale',
  SCHEDULE: 'Programmata'
};

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchAutomations();
  }, []);

  const fetchAutomations = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/automations');
      // const data = await response.json();
      // setAutomations(data.automations);

      // Mock data for now
      setAutomations([
        {
          id: '1',
          name: 'Benvenuto Nuovo Lead',
          description: 'Invia email di benvenuto ai nuovi contatti',
          trigger: 'CONTACT_CREATED',
          isActive: true,
          runOnce: true,
          enrollmentCount: 156,
          createdAt: new Date().toISOString(),
          _count: { actions: 3, enrollments: 156 }
        },
        {
          id: '2',
          name: 'Follow-up Trattativa',
          description: 'Invia promemoria quando una trattativa cambia fase',
          trigger: 'DEAL_STAGE_CHANGED',
          isActive: true,
          runOnce: false,
          enrollmentCount: 42,
          createdAt: new Date().toISOString(),
          _count: { actions: 5, enrollments: 42 }
        },
        {
          id: '3',
          name: 'Re-engagement Lead Freddi',
          description: 'Sequenza email per riattivare lead inattivi',
          trigger: 'MANUAL',
          isActive: false,
          runOnce: true,
          enrollmentCount: 0,
          createdAt: new Date().toISOString(),
          _count: { actions: 7, enrollments: 0 }
        }
      ]);
    } catch (error) {
      console.error('Error fetching automations:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async (id: string, isActive: boolean) => {
    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/automations/${id}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ isActive: !isActive })
      // });

      setAutomations(prev =>
        prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a)
      );
    } catch (error) {
      console.error('Error toggling automation:', error);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa automazione?')) return;

    try {
      // TODO: Replace with actual API call
      // await fetch(`/api/automations/${id}`, { method: 'DELETE' });

      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting automation:', error);
    }
  };

  const filteredAutomations = automations.filter(automation => {
    if (filter === 'active' && !automation.isActive) return false;
    if (filter === 'inactive' && automation.isActive) return false;
    if (searchQuery && !automation.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automazioni</h1>
          <p className="text-gray-600 mt-1">
            Crea flussi automatizzati per email, SMS e WhatsApp
          </p>
        </div>
        <Link
          href="/automations/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuova Automazione
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Totale Automazioni</div>
          <div className="text-2xl font-bold text-gray-900">{automations.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Attive</div>
          <div className="text-2xl font-bold text-green-600">
            {automations.filter(a => a.isActive).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Contatti Iscritti</div>
          <div className="text-2xl font-bold text-blue-600">
            {automations.reduce((sum, a) => sum + a.enrollmentCount, 0)}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="text-sm text-gray-500">Azioni Totali</div>
          <div className="text-2xl font-bold text-purple-600">
            {automations.reduce((sum, a) => sum + (a._count?.actions || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Cerca automazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Tutte
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Attive
          </button>
          <button
            onClick={() => setFilter('inactive')}
            className={`px-4 py-2 rounded-lg ${filter === 'inactive' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Inattive
          </button>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {filteredAutomations.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna automazione trovata</h3>
            <p className="text-gray-500 mb-4">Crea la tua prima automazione per iniziare</p>
            <Link
              href="/automations/new"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Crea Automazione
            </Link>
          </div>
        ) : (
          filteredAutomations.map(automation => (
            <div
              key={automation.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {automation.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      automation.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {automation.isActive ? 'Attiva' : 'Inattiva'}
                    </span>
                    {automation.runOnce && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                        Una sola volta
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {automation.description || 'Nessuna descrizione'}
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Trigger: {TRIGGER_LABELS[automation.trigger] || automation.trigger}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span>{automation._count?.actions || 0} azioni</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{automation.enrollmentCount} iscritti</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAutomation(automation.id, automation.isActive)}
                    className={`p-2 rounded-lg transition ${
                      automation.isActive
                        ? 'text-green-600 hover:bg-green-50'
                        : 'text-gray-400 hover:bg-gray-50'
                    }`}
                    title={automation.isActive ? 'Disattiva' : 'Attiva'}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {automation.isActive ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      )}
                    </svg>
                  </button>
                  <Link
                    href={`/automations/${automation.id}`}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Modifica"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => deleteAutomation(automation.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Elimina"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Templates Section */}
      <div className="mt-12">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Template Pronti</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              name: 'Benvenuto Lead',
              description: 'Email automatica di benvenuto per nuovi lead',
              trigger: 'CONTACT_CREATED',
              actions: ['Email di benvenuto', 'Attendi 2 giorni', 'Email follow-up']
            },
            {
              name: 'Recupero Lead Inattivo',
              description: 'Sequenza per riattivare lead che non rispondono',
              trigger: 'MANUAL',
              actions: ['Email 1', 'Attendi 3 giorni', 'SMS reminder', 'Attendi 7 giorni', 'Email finale']
            },
            {
              name: 'Post-Vendita',
              description: 'Follow-up dopo la chiusura di una trattativa',
              trigger: 'DEAL_WON',
              actions: ['Email ringraziamento', 'Attendi 7 giorni', 'Richiesta recensione']
            }
          ].map((template, index) => (
            <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1 mb-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {TRIGGER_LABELS[template.trigger]}
                </div>
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  {template.actions.length} azioni
                </div>
              </div>
              <Link
                href={`/automations/new?template=${index}`}
                className="block text-center py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                Usa Template
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
