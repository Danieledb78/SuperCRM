'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Users,
  Building2,
  Handshake,
  FileText,
  Receipt,
  Package,
  Truck,
  Warehouse,
  ClipboardList,
  FolderKanban,
  BarChart3,
  Settings,
  Plug,
  Mail,
  Bot,
  Webhook,
  ChevronDown,
  Sun,
  LogOut,
  Bell,
  Calendar,
  Globe,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  children?: NavItem[];
  roles?: string[];
}

const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'CRM',
    href: '/crm',
    icon: Users,
    children: [
      { title: 'Contatti', href: '/contacts', icon: Users },
      { title: 'Aziende', href: '/companies', icon: Building2 },
      { title: 'Trattative', href: '/deals', icon: Handshake },
    ],
  },
  {
    title: 'Vendite',
    href: '/sales',
    icon: FileText,
    children: [
      { title: 'Preventivi', href: '/quotes', icon: FileText },
      { title: 'Fatture', href: '/invoices', icon: Receipt },
      { title: 'Prodotti', href: '/products', icon: Package },
    ],
  },
  {
    title: 'Commesse',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    title: 'Calendario',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Acquisti',
    href: '/purchasing',
    icon: Truck,
    children: [
      { title: 'Fornitori', href: '/suppliers', icon: Truck },
      { title: 'Ordini', href: '/purchase-orders', icon: ClipboardList },
      { title: 'Listini', href: '/pricelists', icon: FileText },
    ],
  },
  {
    title: 'Magazzino',
    href: '/warehouse',
    icon: Warehouse,
    children: [
      { title: 'Giacenze', href: '/warehouse', icon: Warehouse },
      { title: 'DDT', href: '/ddt', icon: FileText },
    ],
  },
  {
    title: 'Report',
    href: '/reports',
    icon: BarChart3,
  },
  {
    title: 'Integrazioni',
    href: '/integrations',
    icon: Plug,
    children: [
      { title: 'Connessioni', href: '/integrations', icon: Plug },
      { title: 'Email', href: '/integrations/email', icon: Mail },
      { title: 'AI Assistant', href: '/integrations/ai', icon: Bot },
      { title: 'Webhooks', href: '/integrations/webhooks', icon: Webhook },
    ],
  },
  {
    title: 'Portali',
    href: '/portal',
    icon: Globe,
  },
  {
    title: 'Impostazioni',
    href: '/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'ADMIN', 'CEO'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (title: string) => {
    setExpandedItems((prev) =>
      prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]
    );
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Sun className="h-8 w-8 text-primary" />
          <span className="text-xl font-bold">SuperCRM</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            // Check role access
            if (item.roles && user && !item.roles.includes(user.role)) {
              return null;
            }

            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.title);
            const active = isActive(item.href);

            return (
              <li key={item.title}>
                {hasChildren ? (
                  <>
                    <button
                      onClick={() => toggleExpand(item.title)}
                      className={cn(
                        'sidebar-item w-full justify-between',
                        active && 'bg-primary/10 text-primary'
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </span>
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>
                    {isExpanded && (
                      <ul className="ml-4 mt-1 space-y-1 border-l pl-4">
                        {item.children?.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className={cn(
                                'sidebar-item',
                                isActive(child.href) && 'active'
                              )}
                            >
                              <child.icon className="h-4 w-4" />
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={cn('sidebar-item', active && 'active')}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : 'Utente'}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.organization?.name || 'Organizzazione'}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Esci"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
