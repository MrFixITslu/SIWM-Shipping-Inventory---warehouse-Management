
import React, { useState, useMemo } from 'react';
import { ColumnDefinition } from '@/types';
import { ChevronUpIcon, ChevronDownIcon } from '@/constants';

interface TableProps<T> {
  columns: ColumnDefinition<T, keyof T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode; // Actions per row (e.g., Edit, Delete buttons)
  rowClassName?: (item: T) => string; // For applying dynamic classes to rows
}

type SortConfig<T> = {
  key: keyof T | null;
  direction: 'ascending' | 'descending';
};

const TableInner = <T extends Record<string, any>>(
  { columns, data, onRowClick, actions, rowClassName }: TableProps<T>
): React.ReactElement => {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({ key: null, direction: 'ascending' });

  const sortedData = useMemo(() => {
    // Ensure data is an array before attempting to sort.
    const sortableData = Array.isArray(data) ? [...data] : [];
    if (!sortConfig.key) {
      return sortableData;
    }
    const sorted = sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      // Add more type comparisons if needed
      return String(aValue).localeCompare(String(bValue));
    });

    return sortConfig.direction === 'ascending' ? sorted : sorted.reverse();
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: keyof T) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronDownIcon className="h-4 w-4 text-secondary-400 dark:text-secondary-500 opacity-50 group-hover:opacity-100" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ChevronUpIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
    );
  };

  return (
    <div className="overflow-x-auto shadow-card rounded-xl border border-border bg-surface">
      <table className="min-w-full divide-y divide-border text-sm font-sans">
        <thead className="bg-background dark:bg-secondary-700">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-semibold text-text-secondary dark:text-secondary-300 uppercase tracking-wider select-none ${column.sortable ? 'cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 group transition-colors duration-150' : ''}`}
                onClick={() => column.sortable && requestSort(column.key)}
                tabIndex={column.sortable ? 0 : -1}
                aria-sort={sortConfig.key === column.key ? (sortConfig.direction === 'ascending' ? 'ascending' : 'descending') : undefined}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && <span className="ml-1">{getSortIcon(column.key)}</span>}
                </div>
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary dark:text-secondary-300 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-surface dark:bg-secondary-800 divide-y divide-border">
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-text-secondary dark:text-secondary-400">
                No data available.
              </td>
            </tr>
          ) : (
            sortedData.map((item, index) => (
              <tr 
                key={item.id || `row-${index}`}
                className={`transition-colors duration-150 focus-within:bg-primary-50/40 dark:focus-within:bg-primary-900/10 ${onRowClick ? 'cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/10' : 'hover:bg-primary-50 dark:hover:bg-primary-900/10'} ${rowClassName ? rowClassName(item) : ''}`}
                onClick={() => onRowClick?.(item)}
                tabIndex={0}
                aria-label={columns.map(col => String(item[col.key])).join(' ')}
              >
                {columns.map((column) => (
                  <td key={`${item.id}-${String(column.key)}`} className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-secondary-100 align-middle">
                    {column.render ? column.render(item) : String(item[column.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-text-primary dark:text-secondary-100 align-middle">
                    <div className="flex space-x-2">{actions(item)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

// Memoize the Table component for performance.
// It will only re-render if its props (columns, data, onRowClick, actions) have changed.
const Table = React.memo(TableInner) as typeof TableInner;

export default Table;