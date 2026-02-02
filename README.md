# SuperCRM

CRM e Gestionale completo per aziende di impianti elettrici e fotovoltaici.
Un mix tra **VTE CRM** e **GoHighLevel** con funzionalità specifiche per il settore.

## Funzionalità Principali

### CRM (stile VTE)
- **Contatti & Lead** - Gestione completa contatti con status, tag e campi personalizzati
- **Aziende** - Anagrafica clienti con dati fiscali italiani (P.IVA, CF, SDI, PEC)
- **Trattative** - Pipeline vendite con fasi personalizzabili
- **Preventivi** - Creazione preventivi con conversione in fatture
- **Fatturazione** - Fatture, note di credito, proforma con supporto fatturazione elettronica

### Marketing Automation (stile GoHighLevel)
- **Campagne** - Email, SMS, WhatsApp marketing
- **Automazioni** - Workflow automatici basati su trigger
- **Pipeline Visuali** - Kanban board per gestione lead e deal

### Gestione Commesse (Sistema Kanban)
- **Vista Tecnica** - Materiali, progetti, permessi
- **Vista Amministrativa** - Pagamenti, incassi, fatture
- **Vista Fornitori** - Ordini, consegne, DDT
- **Vista Installazione** - Programmazione lavori, team, tempi

### Magazzino & Fornitori
- **Prodotti** - Catalogo prodotti con prezzi e IVA
- **Fornitori** - Anagrafica fornitori materiale elettrico/fotovoltaico
- **Magazzino** - Gestione scorte multi-magazzino
- **Ordini di Acquisto** - Ordini a fornitori con tracciamento consegne
- **DDT** - Documenti di trasporto in entrata e uscita

### Report & Documenti
- **Report Personalizzati** - Creazione report su qualsiasi entità
- **Grafici** - Dashboard con KPI e grafici interattivi
- **Template Documenti** - Template personalizzabili per PDF
- **Generazione PDF** - Preventivi, fatture, DDT, ordini

## Stack Tecnologico

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: Next.js 14 + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Monorepo**: pnpm workspaces

## Struttura Progetto

```
SuperCRM/
├── packages/
│   ├── api/          # Backend Express API
│   ├── web/          # Frontend Next.js (da completare)
│   ├── database/     # Schema Prisma e client
│   └── shared/       # Tipi e utility condivisi
├── package.json      # Root package
└── pnpm-workspace.yaml
```

## Installazione

```bash
# Installa dipendenze
pnpm install

# Configura variabili ambiente
cp .env.example .env

# Genera client Prisma
pnpm db:generate

# Applica migrazioni database
pnpm db:push

# Avvia in sviluppo
pnpm dev
```

## Variabili Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/supercrm"
API_PORT=3001
JWT_SECRET=your-secret-key
```

## API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Profilo utente

### CRM
- `/api/contacts` - Gestione contatti
- `/api/companies` - Gestione aziende
- `/api/deals` - Gestione trattative
- `/api/pipelines` - Pipeline e fasi

### Vendite
- `/api/quotes` - Preventivi
- `/api/invoices` - Fatture
- `/api/products` - Prodotti

### Fornitori & Magazzino
- `/api/suppliers` - Fornitori
- `/api/purchase-orders` - Ordini di acquisto
- `/api/warehouses` - Magazzini e stock
- `/api/ddt` - Documenti di trasporto

### Commesse
- `/api/projects` - Gestione commesse con Kanban

### Marketing
- `/api/campaigns` - Campagne marketing
- `/api/automations` - Automazioni

### Report & Documenti
- `/api/reports` - Report personalizzati
- `/api/templates` - Template documenti
- `/api/documents` - Generazione PDF

## Ruoli Utente

| Ruolo | Descrizione |
|-------|-------------|
| SUPER_ADMIN | Amministratore sistema |
| CEO | Amministratore Delegato |
| COO | Direttore Operativo |
| CFO | Direttore Finanziario |
| CTO | Direttore Tecnico |
| PURCHASING_DIRECTOR | Direttore Acquisti |
| SALES_DIRECTOR | Direttore Commerciale |
| SALES_MANAGER | Responsabile Commerciale |
| SALES_AGENT | Agente Commerciale |
| TECHNICIAN | Tecnico |
| INSTALLER | Installatore |
| ACCOUNTANT | Contabile |
| SUPPLIER | Fornitore (accesso portale) |
| SUBCONTRACTOR | Sub appaltatore |

## Prossimi Sviluppi

- [ ] Frontend Next.js completo
- [ ] Dashboard interattive
- [ ] Integrazione fatturazione elettronica SDI
- [ ] App mobile
- [ ] Integrazione calendario Google/Outlook
- [ ] Notifiche push
- [ ] API per integrazioni esterne

## Licenza

Proprietario - Tutti i diritti riservati
