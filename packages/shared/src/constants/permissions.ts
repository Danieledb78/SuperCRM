// Role-based permissions system

export const MODULES = {
  CONTACTS: 'contacts',
  COMPANIES: 'companies',
  DEALS: 'deals',
  QUOTES: 'quotes',
  INVOICES: 'invoices',
  PRODUCTS: 'products',
  PROJECTS: 'projects',
  SUPPLIERS: 'suppliers',
  PURCHASE_ORDERS: 'purchase_orders',
  WAREHOUSE: 'warehouse',
  DDT: 'ddt',
  CAMPAIGNS: 'campaigns',
  AUTOMATIONS: 'automations',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  USERS: 'users',
} as const;

export const ACTIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
} as const;

export type Module = (typeof MODULES)[keyof typeof MODULES];
export type Action = (typeof ACTIONS)[keyof typeof ACTIONS];
export type Permission = `${Module}:${Action}`;

// Full access to everything
const FULL_ACCESS: Permission[] = Object.values(MODULES).flatMap((module) =>
  Object.values(ACTIONS).map((action) => `${module}:${action}` as Permission)
);

// Read-only access to everything
const READ_ONLY_ACCESS: Permission[] = Object.values(MODULES).map(
  (module) => `${module}:view` as Permission
);

// Role permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // System roles - full access
  SUPER_ADMIN: FULL_ACCESS,
  ADMIN: FULL_ACCESS,

  // Executive roles
  CEO: FULL_ACCESS,

  COO: [
    ...FULL_ACCESS.filter(
      (p) => !p.startsWith('settings:') && !p.startsWith('users:')
    ),
    'settings:view',
    'users:view',
  ],

  CFO: [
    // Financial modules
    'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:approve', 'invoices:export',
    'quotes:view', 'quotes:approve', 'quotes:export',
    'purchase_orders:view', 'purchase_orders:approve', 'purchase_orders:export',
    'projects:view', 'projects:export',
    'reports:view', 'reports:export',
    // Read-only for others
    'contacts:view', 'companies:view', 'deals:view', 'products:view',
    'suppliers:view', 'warehouse:view', 'ddt:view',
    'users:view', 'settings:view',
  ],

  CTO: [
    // Technical modules
    'projects:view', 'projects:create', 'projects:edit', 'projects:approve',
    'products:view', 'products:create', 'products:edit',
    'warehouse:view',
    'ddt:view', 'ddt:create', 'ddt:edit',
    'suppliers:view',
    // Read-only for others
    'contacts:view', 'companies:view', 'deals:view',
    'quotes:view', 'invoices:view', 'purchase_orders:view',
    'reports:view', 'users:view',
  ],

  // Department heads
  PURCHASING_DIRECTOR: [
    // Purchasing modules
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete',
    'purchase_orders:view', 'purchase_orders:create', 'purchase_orders:edit', 'purchase_orders:approve',
    'warehouse:view', 'warehouse:create', 'warehouse:edit',
    'products:view', 'products:create', 'products:edit',
    'ddt:view', 'ddt:create', 'ddt:edit',
    // Read-only for others
    'projects:view', 'contacts:view', 'companies:view',
    'quotes:view', 'invoices:view', 'reports:view',
  ],

  SALES_DIRECTOR: [
    // Sales modules
    'contacts:view', 'contacts:create', 'contacts:edit', 'contacts:delete', 'contacts:export',
    'companies:view', 'companies:create', 'companies:edit', 'companies:delete', 'companies:export',
    'deals:view', 'deals:create', 'deals:edit', 'deals:delete', 'deals:approve', 'deals:export',
    'quotes:view', 'quotes:create', 'quotes:edit', 'quotes:approve', 'quotes:export',
    'campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:approve',
    'reports:view', 'reports:export',
    // Read-only for others
    'products:view', 'projects:view', 'invoices:view',
    'users:view',
  ],

  // Management roles
  SALES_MANAGER: [
    'contacts:view', 'contacts:create', 'contacts:edit', 'contacts:export',
    'companies:view', 'companies:create', 'companies:edit', 'companies:export',
    'deals:view', 'deals:create', 'deals:edit', 'deals:export',
    'quotes:view', 'quotes:create', 'quotes:edit',
    'campaigns:view', 'campaigns:create', 'campaigns:edit',
    'products:view',
    'reports:view',
  ],

  TECHNICAL_MANAGER: [
    'projects:view', 'projects:create', 'projects:edit',
    'products:view', 'products:create', 'products:edit',
    'warehouse:view',
    'ddt:view', 'ddt:create', 'ddt:edit',
    'suppliers:view',
    'contacts:view', 'companies:view',
    'quotes:view',
  ],

  PROJECT_MANAGER: [
    'projects:view', 'projects:create', 'projects:edit',
    'products:view',
    'warehouse:view',
    'ddt:view', 'ddt:create',
    'suppliers:view',
    'contacts:view', 'companies:view',
    'quotes:view', 'invoices:view',
  ],

  WAREHOUSE_MANAGER: [
    'warehouse:view', 'warehouse:create', 'warehouse:edit',
    'products:view', 'products:create', 'products:edit',
    'ddt:view', 'ddt:create', 'ddt:edit',
    'suppliers:view',
    'purchase_orders:view',
    'projects:view',
  ],

  // Operational roles
  SALES_AGENT: [
    'contacts:view', 'contacts:create', 'contacts:edit',
    'companies:view', 'companies:create', 'companies:edit',
    'deals:view', 'deals:create', 'deals:edit',
    'quotes:view', 'quotes:create',
    'products:view',
    'campaigns:view',
  ],

  TECHNICIAN: [
    'projects:view', 'projects:edit',
    'products:view',
    'warehouse:view',
    'ddt:view', 'ddt:create',
    'contacts:view', 'companies:view',
  ],

  INSTALLER: [
    'projects:view',
    'products:view',
    'warehouse:view',
    'ddt:view',
  ],

  ACCOUNTANT: [
    'invoices:view', 'invoices:create', 'invoices:edit', 'invoices:export',
    'quotes:view', 'quotes:export',
    'purchase_orders:view', 'purchase_orders:export',
    'contacts:view', 'companies:view',
    'projects:view',
    'reports:view', 'reports:export',
  ],

  SECRETARY: [
    'contacts:view', 'contacts:create', 'contacts:edit',
    'companies:view', 'companies:create', 'companies:edit',
    'deals:view',
    'quotes:view',
    'invoices:view',
    'projects:view',
    'ddt:view',
  ],

  // External roles (portal access)
  SUPPLIER: [
    'purchase_orders:view',
    'products:view',
    'ddt:view',
  ],

  SUBCONTRACTOR: [
    'projects:view',
    'ddt:view',
  ],

  CUSTOMER: [
    'quotes:view',
    'invoices:view',
    'projects:view',
  ],

  // Default user
  USER: READ_ONLY_ACCESS,
};

// Helper functions
export const hasPermission = (
  role: string,
  module: Module,
  action: Action
): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(`${module}:${action}` as Permission);
};

export const getModulePermissions = (role: string, module: Module): Action[] => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return Object.values(ACTIONS).filter((action) =>
    permissions.includes(`${module}:${action}` as Permission)
  );
};

export const canAccess = (role: string, module: Module): boolean => {
  return hasPermission(role, module, 'view');
};

// Role hierarchy for display
export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Amministratore',
  ADMIN: 'Amministratore',
  CEO: 'Amministratore Delegato (CEO)',
  COO: 'Direttore Operativo (COO)',
  CFO: 'Direttore Finanziario (CFO)',
  CTO: 'Direttore Tecnico (CTO)',
  PURCHASING_DIRECTOR: 'Direttore Ufficio Acquisti',
  SALES_DIRECTOR: 'Direttore Commerciale',
  SALES_MANAGER: 'Responsabile Commerciale',
  TECHNICAL_MANAGER: 'Responsabile Tecnico',
  PROJECT_MANAGER: 'Responsabile Commesse',
  WAREHOUSE_MANAGER: 'Responsabile Magazzino',
  SALES_AGENT: 'Agente Commerciale',
  TECHNICIAN: 'Tecnico',
  INSTALLER: 'Installatore',
  ACCOUNTANT: 'Contabile',
  SECRETARY: 'Segreteria',
  SUPPLIER: 'Fornitore',
  SUBCONTRACTOR: 'Sub Appaltatore',
  CUSTOMER: 'Cliente',
  USER: 'Utente',
};

export const ROLE_GROUPS = {
  EXECUTIVE: ['CEO', 'COO', 'CFO', 'CTO'],
  MANAGEMENT: ['PURCHASING_DIRECTOR', 'SALES_DIRECTOR', 'SALES_MANAGER', 'TECHNICAL_MANAGER', 'PROJECT_MANAGER', 'WAREHOUSE_MANAGER'],
  OPERATIONAL: ['SALES_AGENT', 'TECHNICIAN', 'INSTALLER', 'ACCOUNTANT', 'SECRETARY'],
  EXTERNAL: ['SUPPLIER', 'SUBCONTRACTOR', 'CUSTOMER'],
  SYSTEM: ['SUPER_ADMIN', 'ADMIN'],
};
