
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

const TableInner = <T extends { id: string | number }>(
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
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
        <thead className="bg-secondary-50 dark:bg-secondary-700">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider ${column.sortable ? 'cursor-pointer hover:bg-secondary-100 dark:hover:bg-secondary-600 group' : ''}`}
                onClick={() => column.sortable && requestSort(column.key)}
              >
                <div className="flex items-center">
                  {column.header}
                  {column.sortable && <span className="ml-1">{getSortIcon(column.key)}</span>}
                </div>
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-8 text-center text-secondary-500 dark:text-secondary-400">
                No data available.
              </td>
            </tr>
          ) : (
            sortedData.map((item) => (
              <tr 
                key={item.id}
                className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50' : 'hover:bg-secondary-50 dark:hover:bg-secondary-700/50'} ${rowClassName ? rowClassName(item) : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td key={`${item.id}-${String(column.key)}`} className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
                    {column.render ? column.render(item) : String(item[column.key] ?? '')}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-700 dark:text-secondary-300">
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