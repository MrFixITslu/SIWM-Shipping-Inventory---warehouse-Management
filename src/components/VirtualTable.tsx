import React, { useState, useCallback, useMemo, useRef } from 'react';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface VirtualTableProps<T> {
  data: T[];
  columns: Column<T>[];
  height?: number;
  rowHeight?: number;
  sortable?: boolean;
  filterable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  selectable?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  height = 400,
  rowHeight = 48,
  sortable = true,
  filterable = true,
  pagination = false,
  pageSize = 50,
  onRowClick,
  onSelectionChange,
  selectable = false,
  loading = false,
  emptyMessage = 'No data available',
  className = '',
}: VirtualTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const [filters, setFilters] = useState<Record<keyof T, string>>({} as Record<keyof T, string>);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [scrollTop, setScrollTop] = useState(0);

  const parentRef = useRef<HTMLDivElement>(null);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply filters
    if (filterable) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter(row => {
            const cellValue = row[key as keyof T];
            if (cellValue == null) return false;
            return String(cellValue).toLowerCase().includes(value.toLowerCase());
          });
        }
      });
    }

    // Apply sorting
    if (sortable && sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];

        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;

        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, sortConfig, filterable, sortable]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination) return processedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return processedData.slice(startIndex, endIndex);
  }, [processedData, pagination, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (!pagination) return 1;
    return Math.ceil(processedData.length / pageSize);
  }, [processedData.length, pagination, pageSize]);

  // Simple virtualization
  const visibleCount = Math.ceil(height / rowHeight);
  const startIndex = Math.floor(scrollTop / rowHeight);
  const endIndex = Math.min(startIndex + visibleCount + 2, paginatedData.length);
  const visibleData = paginatedData.slice(startIndex, endIndex);

  // Column width calculations
  const columnWidths = useMemo(() => {
    const totalWidth = parentRef.current?.clientWidth || 800;
    const fixedWidthColumns = columns.filter(col => col.width);
    const flexibleColumns = columns.filter(col => !col.width);
    
    const fixedWidth = fixedWidthColumns.reduce((sum, col) => sum + (col.width || 0), 0);
    const flexibleWidth = flexibleColumns.length > 0 
      ? (totalWidth - fixedWidth) / flexibleColumns.length 
      : 0;

    return columns.map(col => col.width || flexibleWidth);
  }, [columns]);

  // Event handlers
  const handleSort = useCallback((key: keyof T) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleFilter = useCallback((key: keyof T, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  }, []);

  const handleRowSelect = useCallback((index: number, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(index);
    } else {
      newSelectedRows.delete(index);
    }
    setSelectedRows(newSelectedRows);
    
    const selectedData = Array.from(newSelectedRows).map(i => paginatedData[i]);
    onSelectionChange?.(selectedData);
  }, [selectedRows, paginatedData, onSelectionChange]);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const allIndices = new Set(paginatedData.map((_, index) => index));
      setSelectedRows(allIndices);
      onSelectionChange?.(paginatedData);
    } else {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    }
  }, [paginatedData, onSelectionChange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Render functions
  const renderHeader = useCallback(() => (
    <div className="flex bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
      {selectable && (
        <div className="flex items-center justify-center px-4 py-3 border-r border-gray-200 dark:border-gray-600" style={{ width: 48 }}>
          <input
            type="checkbox"
            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-600"
          />
        </div>
      )}
      {columns.map((column, index) => (
        <div
          key={String(column.key)}
          className={`flex items-center px-4 py-3 border-r border-gray-200 dark:border-gray-600 ${
            column.sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600' : ''
          }`}
          style={{ width: columnWidths[index] }}
          onClick={() => column.sortable && handleSort(column.key)}
        >
          <div className={`flex-1 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}>
            <span className="font-medium text-gray-900 dark:text-gray-100">{column.header}</span>
            {column.sortable && sortConfig.key === column.key && (
              <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  ), [columns, columnWidths, sortConfig, selectable, selectedRows, paginatedData, handleSort, handleSelectAll]);

  const renderFilters = useCallback(() => (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
      {selectable && <div style={{ width: 48 }} />}
      {columns.map((column, index) => (
        <div
          key={String(column.key)}
          className="px-4 py-2 border-r border-gray-200 dark:border-gray-600"
          style={{ width: columnWidths[index] }}
        >
          {column.filterable && (
            <input
              type="text"
              placeholder={`Filter ${column.header}...`}
              value={filters[column.key] || ''}
              onChange={(e) => handleFilter(column.key, e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          )}
        </div>
      ))}
    </div>
  ), [columns, columnWidths, filters, selectable, handleFilter]);

  const renderRow = useCallback((row: T, index: number) => {
    const isSelected = selectedRows.has(index);

    return (
      <div
        key={index}
        className={`flex border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 ${
          onRowClick ? 'cursor-pointer' : ''
        } ${isSelected ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
        onClick={() => onRowClick?.(row, index)}
        style={{ height: rowHeight }}
      >
        {selectable && (
          <div className="flex items-center justify-center px-4 py-3 border-r border-gray-200 dark:border-gray-600" style={{ width: 48 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => handleRowSelect(index, e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 dark:border-gray-600"
            />
          </div>
        )}
        {columns.map((column, colIndex) => (
          <div
            key={String(column.key)}
            className={`px-4 py-3 border-r border-gray-200 dark:border-gray-600 ${
              column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'
            }`}
            style={{ width: columnWidths[colIndex] }}
          >
            {column.render 
              ? column.render(row[column.key], row)
              : String(row[column.key] ?? '')
            }
          </div>
        ))}
      </div>
    );
  }, [columns, columnWidths, selectedRows, onRowClick, selectable, handleRowSelect, rowHeight]);

  const renderPagination = useCallback(() => {
    if (!pagination) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} results
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  }, [pagination, currentPage, pageSize, processedData.length, totalPages]);

  if (loading) {
    return (
      <div className={`border border-gray-200 dark:border-gray-600 rounded-lg ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }

  if (processedData.length === 0) {
    return (
      <div className={`border border-gray-200 dark:border-gray-600 rounded-lg ${className}`}>
        <div className="flex items-center justify-center py-8">
          <span className="text-gray-500 dark:text-gray-400">{emptyMessage}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-600 rounded-lg ${className}`}>
      {renderHeader()}
      {filterable && renderFilters()}
      <div 
        ref={parentRef}
        className="overflow-auto"
        style={{ height }}
        onScroll={handleScroll}
      >
        <div style={{ height: paginatedData.length * rowHeight }}>
          <div style={{ transform: `translateY(${startIndex * rowHeight}px)` }}>
            {visibleData.map((row, index) => renderRow(row, startIndex + index))}
          </div>
        </div>
      </div>
      {renderPagination()}
    </div>
  );
} 