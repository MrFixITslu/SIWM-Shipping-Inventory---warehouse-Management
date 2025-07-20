import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TableColumn {
  key: string;
  header: string;
  render?: (item: any) => React.ReactNode;
  className?: string;
}

interface InteractiveTableProps {
  data: any[];
  columns: TableColumn[];
  title: string;
  icon?: React.ElementType;
  emptyMessage?: string;
  onRowClick?: (item: any) => void;
  href?: string;
  maxRows?: number;
}

const InteractiveTable: React.FC<InteractiveTableProps> = ({
  data,
  columns,
  title,
  icon: Icon,
  emptyMessage = "No data available",
  onRowClick,
  href,
  maxRows,
}) => {
  const navigate = useNavigate();
  const displayData = maxRows ? data.slice(0, maxRows) : data;

  const handleRowClick = (item: any) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (href) {
      navigate(href);
    }
  };

  const isClickable = onRowClick || href;

  return (
    <div className="bg-white dark:bg-secondary-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-secondary-800 dark:text-secondary-200 flex items-center">
            {Icon && <Icon className="h-6 w-6 mr-2" />}
            {title}
            {data.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 rounded-full">
                {data.length}
              </span>
            )}
          </h3>
          {isClickable && (
            <div className="text-xs text-secondary-500 dark:text-secondary-400">
              Click to view details
            </div>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        {displayData.length > 0 ? (
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead className="bg-secondary-50 dark:bg-secondary-700/50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-400 uppercase tracking-wider ${
                      column.className || ''
                    }`}
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700">
              {displayData.map((item, index) => (
                <tr
                  key={item.id || index}
                  className={`
                    group transition-all duration-200
                    ${isClickable ? 'cursor-pointer hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 dark:hover:from-primary-900/20 dark:hover:to-secondary-700/20' : 'hover:bg-secondary-50 dark:hover:bg-secondary-700'}
                    ${isClickable ? 'hover:shadow-md' : ''}
                  `}
                  onClick={() => isClickable && handleRowClick(item)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                        column.className || ''
                      } ${
                        isClickable
                          ? 'group-hover:text-primary-600 dark:group-hover:text-primary-400'
                          : ''
                      }`}
                    >
                      {column.render ? column.render(item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="text-secondary-400 dark:text-secondary-500">
              <svg
                className="mx-auto h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium text-secondary-500 dark:text-secondary-400">
                {emptyMessage}
              </p>
            </div>
          </div>
        )}
      </div>

      {maxRows && data.length > maxRows && (
        <div className="px-6 py-3 bg-secondary-50 dark:bg-secondary-700/50 border-t border-secondary-200 dark:border-secondary-700">
          <div className="text-sm text-secondary-600 dark:text-secondary-400 text-center">
            Showing {maxRows} of {data.length} items
            {isClickable && (
              <button
                onClick={() => isClickable && handleRowClick(null)}
                className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                View all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveTable; 