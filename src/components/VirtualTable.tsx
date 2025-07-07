import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface ColumnDefinition<T, K extends keyof T> {
  key: K;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
}

interface VirtualTableProps<T extends { id: string | number }> {
  columns: ColumnDefinition<T, keyof T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  rowClassName?: (item: T) => string;
  rowHeight?: number;
  containerHeight?: number;
  sortConfig?: { key: keyof T | null; direction: 'ascending' | 'descending' };
  onSort?: (key: keyof T) => void;
}

interface SortConfig<T> {
  key: keyof T | null;
  direction: 'ascending' | 'descending';
}

const VirtualTable = <T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  actions,
  rowClassName,
  rowHeight = 48,
  containerHeight = 600,
  sortConfig,
  onSort
}: VirtualTableProps<T>) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sortState, setSortState] = useState<SortConfig<T>>({ key: null, direction: 'ascending' });

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, data.length);
  const visibleData = data.slice(startIndex, endIndex);

  // Calculate total height and offset
  const totalHeight = data.length * rowHeight;
  const offsetY = startIndex * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const requestSort = useCallback((key: keyof T) => {
    if (onSort) {
      onSort(key);
    } else {
      let direction: 'ascending' | 'descending' = 'ascending';
      if (sortState.key === key && sortState.direction === 'ascending') {
        direction = 'descending';
      }
      setSortState({ key, direction });
    }
  }, [sortState, onSort]);

  const getSortIcon = useCallback((columnKey: keyof T) => {
    const currentSort = sortConfig || sortState;
    if (currentSort.key !== columnKey) {
      return <ChevronDownIcon className="h-4 w-4 text-secondary-400 dark:text-secondary-500 opacity-50 group-hover:opacity-100" />;
    }
    return currentSort.direction === 'ascending' ? (
      <ChevronUpIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
    ) : (
      <ChevronDownIcon className="h-4 w-4 text-primary-500 dark:text-primary-400" />
    );
  }, [sortConfig, sortState]);

  const sortedData = useMemo(() => {
    const currentSort = sortConfig || sortState;
    if (!currentSort.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[currentSort.key!];
      const bValue = b[currentSort.key!];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue);
      }
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return aValue - bValue;
      }
      return String(aValue).localeCompare(String(bValue));
    });
  }, [data, sortConfig, sortState]);

  return (
    <div className="border border-secondary-200 dark:border-secondary-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {columns.map((column) => (
            <div
              key={String(column.key)}
              className={`flex items-center justify-between ${
                column.sortable ? 'cursor-pointer hover:text-primary-600 dark:hover:text-primary-400' : ''
              }`}
              onClick={() => column.sortable && requestSort(column.key)}
              style={{ gridColumn: `span ${column.width ? 'auto' : '1'}` }}
            >
              <span>{column.header}</span>
              {column.sortable && getSortIcon(column.key)}
            </div>
          ))}
          {actions && <div className="text-center">Actions</div>}
        </div>
      </div>

      {/* Virtual Scrolling Container */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleData.map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <div
                  key={item.id}
                  className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-secondary-100 dark:border-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-700/50 transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${rowClassName ? rowClassName(item) : ''}`}
                  style={{ height: rowHeight }}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="flex items-center overflow-hidden"
                      style={{ gridColumn: `span ${column.width ? 'auto' : '1'}` }}
                    >
                      {column.render ? column.render(item) : String(item[column.key] || '')}
                    </div>
                  ))}
                  {actions && (
                    <div className="flex items-center justify-center">
                      {actions(item)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualTable); 