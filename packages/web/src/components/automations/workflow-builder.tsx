'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
interface AutomationAction {
  id: string;
  type: ActionType;
  name: string;
  config: Record<string, any>;
  delayMinutes: number;
  delayType: 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS';
  order: number;
  parentActionId?: string;
  conditionBranch?: 'yes' | 'no';
}

interface AutomationCondition {
  id: string;
  field: string;
  operator: string;
  value: string;
  logicOperator: 'AND' | 'OR';
  order: number;
}

interface Automation {
  name: string;
  description: string;
  trigger: string;
  triggerConfig: Record<string, any>;
  isActive: boolean;
  runOnce: boolean;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
}

type ActionType =
  | 'SEND_EMAIL'
  | 'SEND_SMS'
  | 'SEND_WHATSAPP'
  | 'CREATE_TASK'
  | 'UPDATE_CONTACT'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'MOVE_DEAL_STAGE'
  | 'CREATE_DEAL'
  | 'ADD_SCORE'
  | 'NOTIFY_USER'
  | 'WAIT'
  | 'CONDITION'
  | 'EXIT';

// Constants
const TRIGGERS = [
  { value: 'CONTACT_CREATED', label: 'Nuovo contatto creato', icon: '👤' },
  { value: 'CONTACT_UPDATED', label: 'Contatto aggiornato', icon: '✏️' },
  { value: 'CONTACT_TAG_ADDED', label: 'Tag aggiunto al contatto', icon: '🏷️' },
  { value: 'DEAL_CREATED', label: 'Nuova trattativa creata', icon: '💼' },
  { value: 'DEAL_STAGE_CHANGED', label: 'Cambio fase trattativa', icon: '📊' },
  { value: 'DEAL_WON', label: 'Trattativa vinta', icon: '🎉' },
  { value: 'DEAL_LOST', label: 'Trattativa persa', icon: '❌' },
  { value: 'PROJECT_CREATED', label: 'Nuovo progetto creato', icon: '📁' },
  { value: 'PROJECT_COMPLETED', label: 'Progetto completato', icon: '✅' },
  { value: 'EMAIL_OPENED', label: 'Email aperta', icon: '📧' },
  { value: 'EMAIL_CLICKED', label: 'Link cliccato in email', icon: '🔗' },
  { value: 'FORM_SUBMITTED', label: 'Form inviato', icon: '📝' },
  { value: 'APPOINTMENT_SCHEDULED', label: 'Appuntamento fissato', icon: '📅' },
  { value: 'TASK_COMPLETED', label: 'Attività completata', icon: '☑️' },
  { value: 'INVOICE_OVERDUE', label: 'Fattura scaduta', icon: '⚠️' },
  { value: 'MANUAL', label: 'Attivazione manuale', icon: '🖐️' },
];

const ACTIONS: { type: ActionType; label: string; icon: string; category: string }[] = [
  // Communication
  { type: 'SEND_EMAIL', label: 'Invia Email', icon: '📧', category: 'Comunicazione' },
  { type: 'SEND_SMS', label: 'Invia SMS', icon: '📱', category: 'Comunicazione' },
  { type: 'SEND_WHATSAPP', label: 'Invia WhatsApp', icon: '💬', category: 'Comunicazione' },
  // CRM
  { type: 'CREATE_TASK', label: 'Crea Attività', icon: '✅', category: 'CRM' },
  { type: 'UPDATE_CONTACT', label: 'Aggiorna Contatto', icon: '👤', category: 'CRM' },
  { type: 'ADD_TAG', label: 'Aggiungi Tag', icon: '🏷️', category: 'CRM' },
  { type: 'REMOVE_TAG', label: 'Rimuovi Tag', icon: '🗑️', category: 'CRM' },
  { type: 'MOVE_DEAL_STAGE', label: 'Sposta Fase Trattativa', icon: '📊', category: 'CRM' },
  { type: 'CREATE_DEAL', label: 'Crea Trattativa', icon: '💼', category: 'CRM' },
  { type: 'ADD_SCORE', label: 'Aggiungi Punteggio', icon: '⭐', category: 'CRM' },
  // Notifications
  { type: 'NOTIFY_USER', label: 'Notifica Utente', icon: '🔔', category: 'Notifiche' },
  // Flow Control
  { type: 'WAIT', label: 'Attendi', icon: '⏱️', category: 'Controllo Flusso' },
  { type: 'CONDITION', label: 'Condizione (If/Then)', icon: '🔀', category: 'Controllo Flusso' },
  { type: 'EXIT', label: 'Esci dall\'automazione', icon: '🚪', category: 'Controllo Flusso' },
];

const CONDITION_OPERATORS = [
  { value: 'EQUALS', label: 'uguale a' },
  { value: 'NOT_EQUALS', label: 'diverso da' },
  { value: 'CONTAINS', label: 'contiene' },
  { value: 'NOT_CONTAINS', label: 'non contiene' },
  { value: 'STARTS_WITH', label: 'inizia con' },
  { value: 'ENDS_WITH', label: 'finisce con' },
  { value: 'GREATER_THAN', label: 'maggiore di' },
  { value: 'LESS_THAN', label: 'minore di' },
  { value: 'IS_EMPTY', label: 'è vuoto' },
  { value: 'IS_NOT_EMPTY', label: 'non è vuoto' },
];

const CONDITION_FIELDS = [
  { value: 'contact.email', label: 'Email contatto' },
  { value: 'contact.phone', label: 'Telefono contatto' },
  { value: 'contact.city', label: 'Città contatto' },
  { value: 'contact.source', label: 'Origine contatto' },
  { value: 'contact.status', label: 'Stato contatto' },
  { value: 'contact.leadScore', label: 'Punteggio lead' },
  { value: 'deal.value', label: 'Valore trattativa' },
  { value: 'deal.status', label: 'Stato trattativa' },
];

// Props
interface WorkflowBuilderProps {
  templateId?: string | null;
  automationId?: string;
  onSave: (automation: Automation) => Promise<void>;
  saving?: boolean;
}

export default function WorkflowBuilder({ templateId, automationId, onSave, saving }: WorkflowBuilderProps) {
  const [step, setStep] = useState<'trigger' | 'actions' | 'review'>('trigger');
  const [automation, setAutomation] = useState<Automation>({
    name: '',
    description: '',
    trigger: '',
    triggerConfig: {},
    isActive: false,
    runOnce: true,
    conditions: [],
    actions: []
  });
  const [showActionSelector, setShowActionSelector] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (templateId) {
      loadTemplate(templateId);
    }
  }, [templateId]);

  const loadTemplate = (id: string) => {
    const templates: Record<string, Partial<Automation>> = {
      '0': {
        name: 'Benvenuto Lead',
        description: 'Email automatica di benvenuto per nuovi lead',
        trigger: 'CONTACT_CREATED',
        runOnce: true,
        actions: [
          {
            id: '1',
            type: 'SEND_EMAIL',
            name: 'Email di benvenuto',
            config: {
              subject: 'Benvenuto in {{companyName}}!',
              body: 'Ciao {{firstName}},\n\nGrazie per averci contattato...'
            },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 0
          },
          {
            id: '2',
            type: 'WAIT',
            name: 'Attendi 2 giorni',
            config: {},
            delayMinutes: 2,
            delayType: 'DAYS',
            order: 1
          },
          {
            id: '3',
            type: 'SEND_EMAIL',
            name: 'Email follow-up',
            config: {
              subject: 'Come possiamo aiutarti?',
              body: 'Ciao {{firstName}},\n\nVolevamo assicurarci che tu abbia ricevuto...'
            },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 2
          }
        ]
      },
      '1': {
        name: 'Recupero Lead Inattivo',
        description: 'Sequenza per riattivare lead che non rispondono',
        trigger: 'MANUAL',
        runOnce: true,
        actions: [
          {
            id: '1',
            type: 'SEND_EMAIL',
            name: 'Prima email',
            config: { subject: 'Ci manchi!', body: '...' },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 0
          },
          {
            id: '2',
            type: 'WAIT',
            name: 'Attendi 3 giorni',
            config: {},
            delayMinutes: 3,
            delayType: 'DAYS',
            order: 1
          },
          {
            id: '3',
            type: 'SEND_SMS',
            name: 'SMS reminder',
            config: { message: 'Ciao {{firstName}}, hai visto la nostra email?' },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 2
          }
        ]
      },
      '2': {
        name: 'Post-Vendita',
        description: 'Follow-up dopo la chiusura di una trattativa',
        trigger: 'DEAL_WON',
        runOnce: true,
        actions: [
          {
            id: '1',
            type: 'SEND_EMAIL',
            name: 'Email ringraziamento',
            config: { subject: 'Grazie per la fiducia!', body: '...' },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 0
          },
          {
            id: '2',
            type: 'WAIT',
            name: 'Attendi 7 giorni',
            config: {},
            delayMinutes: 7,
            delayType: 'DAYS',
            order: 1
          },
          {
            id: '3',
            type: 'SEND_EMAIL',
            name: 'Richiesta recensione',
            config: { subject: 'Come è stata la tua esperienza?', body: '...' },
            delayMinutes: 0,
            delayType: 'MINUTES',
            order: 2
          }
        ]
      }
    };

    const template = templates[id];
    if (template) {
      setAutomation(prev => ({ ...prev, ...template }));
      setStep('actions');
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addAction = (type: ActionType) => {
    const actionInfo = ACTIONS.find(a => a.type === type);
    const newAction: AutomationAction = {
      id: generateId(),
      type,
      name: actionInfo?.label || type,
      config: getDefaultConfig(type),
      delayMinutes: 0,
      delayType: 'MINUTES',
      order: automation.actions.length
    };

    setAutomation(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }));
    setShowActionSelector(false);
    setEditingActionId(newAction.id);
  };

  const getDefaultConfig = (type: ActionType): Record<string, any> => {
    switch (type) {
      case 'SEND_EMAIL':
        return { subject: '', body: '', templateId: '' };
      case 'SEND_SMS':
        return { message: '' };
      case 'SEND_WHATSAPP':
        return { message: '', templateId: '' };
      case 'CREATE_TASK':
        return { title: '', description: '', priority: 'MEDIUM' };
      case 'ADD_TAG':
      case 'REMOVE_TAG':
        return { tagId: '', tagName: '' };
      case 'ADD_SCORE':
        return { score: 10 };
      case 'WAIT':
        return {};
      case 'CONDITION':
        return { condition: { field: '', operator: 'EQUALS', value: '' } };
      case 'NOTIFY_USER':
        return { userId: '', message: '' };
      default:
        return {};
    }
  };

  const updateAction = (id: string, updates: Partial<AutomationAction>) => {
    setAutomation(prev => ({
      ...prev,
      actions: prev.actions.map(a => a.id === id ? { ...a, ...updates } : a)
    }));
  };

  const deleteAction = (id: string) => {
    setAutomation(prev => ({
      ...prev,
      actions: prev.actions.filter(a => a.id !== id).map((a, i) => ({ ...a, order: i }))
    }));
    if (editingActionId === id) {
      setEditingActionId(null);
    }
  };

  const moveAction = (id: string, direction: 'up' | 'down') => {
    const index = automation.actions.findIndex(a => a.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === automation.actions.length - 1)
    ) {
      return;
    }

    const newActions = [...automation.actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];

    setAutomation(prev => ({
      ...prev,
      actions: newActions.map((a, i) => ({ ...a, order: i }))
    }));
  };

  const addCondition = () => {
    const newCondition: AutomationCondition = {
      id: generateId(),
      field: 'contact.email',
      operator: 'IS_NOT_EMPTY',
      value: '',
      logicOperator: 'AND',
      order: automation.conditions.length
    };
    setAutomation(prev => ({
      ...prev,
      conditions: [...prev.conditions, newCondition]
    }));
  };

  const updateCondition = (id: string, updates: Partial<AutomationCondition>) => {
    setAutomation(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const deleteCondition = (id: string) => {
    setAutomation(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }));
  };

  const handleSave = async () => {
    if (!automation.name.trim()) {
      alert('Inserisci un nome per l\'automazione');
      return;
    }
    if (!automation.trigger) {
      alert('Seleziona un trigger');
      return;
    }
    if (automation.actions.length === 0) {
      alert('Aggiungi almeno un\'azione');
      return;
    }

    await onSave(automation);
  };

  const renderTriggerStep = () => (
    <div className="p-6 space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nome automazione *
        </label>
        <input
          type="text"
          value={automation.name}
          onChange={(e) => setAutomation(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="Es: Benvenuto nuovi lead"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descrizione
        </label>
        <textarea
          value={automation.description}
          onChange={(e) => setAutomation(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="Descrivi cosa fa questa automazione"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Seleziona il trigger *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TRIGGERS.map(trigger => (
            <button
              key={trigger.value}
              onClick={() => setAutomation(prev => ({ ...prev, trigger: trigger.value }))}
              className={`p-4 border rounded-lg text-left transition ${
                automation.trigger === trigger.value
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-2xl mb-2 block">{trigger.icon}</span>
              <span className="font-medium text-gray-900">{trigger.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conditions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Condizioni di ingresso (opzionale)
          </label>
          <button
            onClick={addCondition}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            + Aggiungi condizione
          </button>
        </div>
        {automation.conditions.length > 0 ? (
          <div className="space-y-2">
            {automation.conditions.map((condition, index) => (
              <div key={condition.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                {index > 0 && (
                  <select
                    value={condition.logicOperator}
                    onChange={(e) => updateCondition(condition.id, { logicOperator: e.target.value as 'AND' | 'OR' })}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="AND">E</option>
                    <option value="OR">O</option>
                  </select>
                )}
                <select
                  value={condition.field}
                  onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                >
                  {CONDITION_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={condition.operator}
                  onChange={(e) => updateCondition(condition.id, { operator: e.target.value })}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {CONDITION_OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {!['IS_EMPTY', 'IS_NOT_EMPTY'].includes(condition.operator) && (
                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    placeholder="Valore"
                  />
                )}
                <button
                  onClick={() => deleteCondition(condition.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">
            Nessuna condizione - tutti i contatti che attivano il trigger entreranno nell'automazione
          </p>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={automation.runOnce}
            onChange={(e) => setAutomation(prev => ({ ...prev, runOnce: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Esegui una sola volta per contatto
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setStep('actions')}
          disabled={!automation.trigger || !automation.name.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continua
        </button>
      </div>
    </div>
  );

  const renderActionsStep = () => (
    <div className="flex-1 flex overflow-hidden">
      {/* Actions List */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Azioni del workflow</h2>
          <button
            onClick={() => setStep('trigger')}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            ← Modifica trigger
          </button>
        </div>

        {/* Trigger display */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="font-medium">
              Trigger: {TRIGGERS.find(t => t.value === automation.trigger)?.label || automation.trigger}
            </span>
          </div>
        </div>

        {/* Actions flow */}
        <div className="space-y-3">
          {automation.actions.map((action, index) => {
            const actionInfo = ACTIONS.find(a => a.type === action.type);
            return (
              <div key={action.id}>
                {/* Connector line */}
                {index > 0 && (
                  <div className="flex justify-center my-2">
                    <div className="w-0.5 h-6 bg-gray-300"></div>
                  </div>
                )}

                {/* Action card */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer transition ${
                    editingActionId === action.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setEditingActionId(action.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{actionInfo?.icon}</span>
                      <div>
                        <div className="font-medium text-gray-900">{action.name}</div>
                        <div className="text-sm text-gray-500">
                          {action.type === 'WAIT' ? (
                            `Attendi ${action.delayMinutes} ${
                              action.delayType === 'MINUTES' ? 'minuti' :
                              action.delayType === 'HOURS' ? 'ore' :
                              action.delayType === 'DAYS' ? 'giorni' : 'settimane'
                            }`
                          ) : action.type === 'SEND_EMAIL' ? (
                            action.config.subject || 'Email non configurata'
                          ) : action.type === 'SEND_SMS' || action.type === 'SEND_WHATSAPP' ? (
                            action.config.message?.substring(0, 50) || 'Messaggio non configurato'
                          ) : (
                            actionInfo?.label
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); moveAction(action.id, 'up'); }}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); moveAction(action.id, 'down'); }}
                        disabled={index === automation.actions.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteAction(action.id); }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add action button */}
          <div className="flex justify-center my-4">
            <button
              onClick={() => setShowActionSelector(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Aggiungi azione
            </button>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => setStep('trigger')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Indietro
          </button>
          <button
            onClick={() => setStep('review')}
            disabled={automation.actions.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Rivedi e Salva
          </button>
        </div>
      </div>

      {/* Action Editor Sidebar */}
      {editingActionId && (
        <div className="w-96 border-l bg-gray-50 p-6 overflow-y-auto">
          {renderActionEditor()}
        </div>
      )}

      {/* Action Selector Modal */}
      {showActionSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Aggiungi Azione</h3>
              <button
                onClick={() => setShowActionSelector(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {['Comunicazione', 'CRM', 'Notifiche', 'Controllo Flusso'].map(category => (
                <div key={category} className="mb-6">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{category}</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {ACTIONS.filter(a => a.category === category).map(action => (
                      <button
                        key={action.type}
                        onClick={() => addAction(action.type)}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition text-left"
                      >
                        <span className="text-2xl">{action.icon}</span>
                        <span className="font-medium text-gray-900">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderActionEditor = () => {
    const action = automation.actions.find(a => a.id === editingActionId);
    if (!action) return null;

    const actionInfo = ACTIONS.find(a => a.type === action.type);

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>{actionInfo?.icon}</span>
            {actionInfo?.label}
          </h3>
          <button
            onClick={() => setEditingActionId(null)}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome azione</label>
            <input
              type="text"
              value={action.name}
              onChange={(e) => updateAction(action.id, { name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          {/* Action-specific configuration */}
          {action.type === 'SEND_EMAIL' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Oggetto</label>
                <input
                  type="text"
                  value={action.config.subject || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, subject: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Es: Benvenuto {{firstName}}!"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Corpo email</label>
                <textarea
                  value={action.config.body || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, body: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={6}
                  placeholder="Scrivi il contenuto dell'email..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usa variabili: {'{{firstName}}'}, {'{{lastName}}'}, {'{{email}}'}, {'{{company}}'}
                </p>
              </div>
            </>
          )}

          {(action.type === 'SEND_SMS' || action.type === 'SEND_WHATSAPP') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messaggio</label>
              <textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, message: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                placeholder="Scrivi il messaggio..."
                maxLength={action.type === 'SEND_SMS' ? 160 : 1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {action.config.message?.length || 0}/{action.type === 'SEND_SMS' ? 160 : 1000} caratteri
              </p>
            </div>
          )}

          {action.type === 'CREATE_TASK' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titolo attività</label>
                <input
                  type="text"
                  value={action.config.title || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, title: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priorità</label>
                <select
                  value={action.config.priority || 'MEDIUM'}
                  onChange={(e) => updateAction(action.id, {
                    config: { ...action.config, priority: e.target.value }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="LOW">Bassa</option>
                  <option value="MEDIUM">Media</option>
                  <option value="HIGH">Alta</option>
                  <option value="URGENT">Urgente</option>
                </select>
              </div>
            </>
          )}

          {(action.type === 'ADD_TAG' || action.type === 'REMOVE_TAG') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome tag</label>
              <input
                type="text"
                value={action.config.tagName || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, tagName: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Es: cliente-attivo"
              />
            </div>
          )}

          {action.type === 'ADD_SCORE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punteggio da aggiungere</label>
              <input
                type="number"
                value={action.config.score || 0}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, score: parseInt(e.target.value) || 0 }
                })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          )}

          {action.type === 'WAIT' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Durata</label>
                <input
                  type="number"
                  value={action.delayMinutes}
                  onChange={(e) => updateAction(action.id, {
                    delayMinutes: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                  min={0}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unità</label>
                <select
                  value={action.delayType}
                  onChange={(e) => updateAction(action.id, {
                    delayType: e.target.value as any
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="MINUTES">Minuti</option>
                  <option value="HOURS">Ore</option>
                  <option value="DAYS">Giorni</option>
                  <option value="WEEKS">Settimane</option>
                </select>
              </div>
            </div>
          )}

          {action.type === 'CONDITION' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campo</label>
                <select
                  value={action.config.condition?.field || ''}
                  onChange={(e) => updateAction(action.id, {
                    config: {
                      ...action.config,
                      condition: { ...action.config.condition, field: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="">Seleziona campo</option>
                  {CONDITION_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Operatore</label>
                <select
                  value={action.config.condition?.operator || 'EQUALS'}
                  onChange={(e) => updateAction(action.id, {
                    config: {
                      ...action.config,
                      condition: { ...action.config.condition, operator: e.target.value }
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {CONDITION_OPERATORS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              {!['IS_EMPTY', 'IS_NOT_EMPTY'].includes(action.config.condition?.operator || '') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valore</label>
                  <input
                    type="text"
                    value={action.config.condition?.value || ''}
                    onChange={(e) => updateAction(action.id, {
                      config: {
                        ...action.config,
                        condition: { ...action.config.condition, value: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {action.type === 'NOTIFY_USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Messaggio notifica</label>
              <textarea
                value={action.config.message || ''}
                onChange={(e) => updateAction(action.id, {
                  config: { ...action.config, message: e.target.value }
                })}
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Messaggio da mostrare nella notifica..."
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviewStep = () => (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 mb-6">Rivedi Automazione</h2>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Informazioni generali</h3>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Nome</dt>
            <dd className="font-medium">{automation.name}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Trigger</dt>
            <dd className="font-medium">
              {TRIGGERS.find(t => t.value === automation.trigger)?.label || automation.trigger}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Descrizione</dt>
            <dd className="font-medium">{automation.description || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Esecuzione</dt>
            <dd className="font-medium">{automation.runOnce ? 'Una sola volta' : 'Ogni volta'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Flusso azioni ({automation.actions.length})</h3>
        <div className="space-y-3">
          {automation.actions.map((action, index) => {
            const actionInfo = ACTIONS.find(a => a.type === action.type);
            return (
              <div key={action.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                  {index + 1}
                </div>
                <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>{actionInfo?.icon}</span>
                    <span className="font-medium">{action.name}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={automation.isActive}
            onChange={(e) => setAutomation(prev => ({ ...prev, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">
            Attiva automazione subito dopo il salvataggio
          </span>
        </label>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep('actions')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Modifica Azioni
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Salvataggio...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salva Automazione
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/automations" className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <h1 className="text-xl font-bold text-gray-900">
            {automationId ? 'Modifica Automazione' : 'Nuova Automazione'}
          </h1>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {['trigger', 'actions', 'review'].map((s, i) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-blue-600 text-white'
                    : ['trigger', 'actions', 'review'].indexOf(step) > i
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                }`}
              >
                {['trigger', 'actions', 'review'].indexOf(step) > i ? '✓' : i + 1}
              </div>
              {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-1"></div>}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {step === 'trigger' && renderTriggerStep()}
        {step === 'actions' && renderActionsStep()}
        {step === 'review' && renderReviewStep()}
      </div>
    </div>
  );
}
