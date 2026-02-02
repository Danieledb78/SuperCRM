'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: string[];
  pageSize?: number;
  onRowClick?: (item: T) => void;
  selectedRows?: string[];
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  idField?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  actions?: React.ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  searchPlaceholder = 'Cerca...',
  searchFields = [],
  pageSize = 10,
  onRowClick,
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  idField = 'id',
  isLoading = false,
  emptyMessage = 'Nessun risultato trovato',
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data
  const filteredData = useMemo(() => {
    if (!search) return data;

    const searchLower = search.toLowerCase();
    const fieldsToSearch = searchFields.length > 0 ? searchFields : columns.map((c) => c.key);

    return data.filter((item) =>
      fieldsToSearch.some((field) => {
        const value = item[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, search, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      const comparison = String(aValue).localeCompare(String(bValue), 'it', { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const allSelected = paginatedData.length > 0 && paginatedData.every((item) => selectedRows.includes(item[idField]));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        {searchable && (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-9"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          {actions}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {onSelectRow && (
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={onSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(column.className, column.sortable && 'cursor-pointer select-none')}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {column.sortable && (
                        <span className="text-muted-foreground">
                          {sortColumn === column.key ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-4 w-4" />
                            ) : (
                              <ArrowDown className="h-4 w-4" />
                            )
                          ) : (
                            <ArrowUpDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr
                    key={item[idField]}
                    className={cn(onRowClick && 'cursor-pointer')}
                    onClick={() => onRowClick?.(item)}
                  >
                    {onSelectRow && (
                      <td onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item[idField])}
                          onChange={() => onSelectRow(item[idField])}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td key={column.key} className={column.className}>
                        {column.render ? column.render(item) : item[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedData.length)} di{' '}
            {sortedData.length} risultati
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => prev - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-3 text-sm">
              Pagina {currentPage} di {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage((prev) => prev + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
