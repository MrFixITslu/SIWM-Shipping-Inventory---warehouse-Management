
import React, { useState, useEffect, useCallback } from 'react';
import Modal from './Modal';
import Table from './Table';
import { ReportDefinition, ReportFilter, ColumnDefinition, InventoryItem } from '@/types';
import { reportingService } from '@/services/reportingService'; // Assuming service exists
import { LoadingSpinner } from './icons/LoadingSpinner';
import Papa from 'papaparse'; // For CSV export

const TAILWIND_INPUT_CLASSES = "shadow-sm appearance-none border border-secondary-300 bg-white text-secondary-900 rounded-md px-3 py-2 dark:border-secondary-600 dark:bg-secondary-700 dark:text-secondary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm";


interface ReportViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportDefinition: ReportDefinition | null;
}

const ReportViewerModal: React.FC<ReportViewerModalProps> = ({ isOpen, onClose, reportDefinition }) => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async (filtersToApply: Record<string, any>) => {
    if (!reportDefinition || !reportDefinition.sampleDataKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await reportingService.getReportData(reportDefinition.sampleDataKey, filtersToApply);
      setReportData(data);
    } catch (err: any) {
      console.error("Error fetching report data:", err);
      let userFriendlyError = `An unexpected error occurred while fetching report: ${reportDefinition.name}. Please try again.`;
      if (err.message) {
        if (err.message.toLowerCase().includes("failed to fetch")) {
            userFriendlyError = "Could not connect to the server to fetch report data. Please check your network or server status.";
        } else {
            userFriendlyError = `Error fetching report: ${err.message}.`;
        }
      }
      setError(userFriendlyError);
      setReportData([]); 
    } finally {
      setIsLoading(false);
    }
  }, [reportDefinition]);

  useEffect(() => {
    if (isOpen && reportDefinition) {
      const initialFilters = {}; // Start with fresh filters
      setAppliedFilters(initialFilters);
      fetchReportData(initialFilters);
    } else {
      setReportData([]); 
      setAppliedFilters({});
      setError(null);
    }
  }, [isOpen, reportDefinition, fetchReportData]);

  const handleFilterChange = (filterId: string, value: any) => {
    setAppliedFilters(prev => ({ ...prev, [filterId]: value }));
  };
  
  const handleApplyFilters = () => {
    fetchReportData(appliedFilters); 
  };

  const handleExportCSV = () => {
    if (!reportData.length || !reportDefinition) return;
    const csv = Papa.unparse(reportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportDefinition.id}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    alert('PDF export is not yet implemented. This would typically involve a library like jsPDF.');
  };

  if (!reportDefinition) return null;

  const renderFilters = () => {
    if (!Array.isArray(reportDefinition.filters) || reportDefinition.filters.length === 0) return null;
    return (
      <div className="mb-4 p-4 border border-secondary-200 dark:border-secondary-700 rounded-lg bg-secondary-50 dark:bg-secondary-800/30">
        <h4 className="text-md font-semibold mb-2 text-secondary-700 dark:text-secondary-300">Filters</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {reportDefinition.filters.map((filter: ReportFilter) => (
            <div key={filter.id}>
              <label htmlFor={filter.id} className="block text-xs font-medium text-secondary-600 dark:text-secondary-400 mb-1">
                {filter.label}
              </label>
              {filter.type === 'select' && (
                <select
                  id={filter.id}
                  value={appliedFilters[filter.id] || filter.defaultValue || ''}
                  onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                  className={`${TAILWIND_INPUT_CLASSES} w-full`}
                >
                  <option value="">All</option>
                  {(filter.options || []).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              )}
              {filter.type === 'text' && (
                 <input
                    type="text"
                    id={filter.id}
                    value={appliedFilters[filter.id] || filter.defaultValue || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className={`${TAILWIND_INPUT_CLASSES} w-full`}
                    placeholder={`Enter ${filter.label.toLowerCase()}`}
                  />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 text-right">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm"
            >
              Apply Filters
            </button>
        </div>
      </div>
    );
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Report: ${reportDefinition.name}`} size="xl">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <p className="text-sm text-secondary-600 dark:text-secondary-400">{reportDefinition.description}</p>
            <div className="space-x-2 flex-shrink-0">
                <button onClick={handleExportCSV} disabled={reportData.length === 0} className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600 rounded-md disabled:opacity-50">Export CSV</button>
                <button onClick={handleExportPDF} disabled={reportData.length === 0} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600 rounded-md disabled:opacity-50">Export PDF</button>
            </div>
        </div>

        {renderFilters()}
        
        {error && <div className="my-3 p-3 bg-red-100 text-red-700 rounded-md dark:bg-red-700/30 dark:text-red-300">{error}</div>}

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner className="w-8 h-8 text-primary-500" />
            <p className="ml-3 text-secondary-600 dark:text-secondary-400">Loading report data...</p>
          </div>
        ) : reportData.length > 0 && !error ? (
          <Table columns={reportDefinition.columns as ColumnDefinition<any, keyof any>[]} data={reportData} />
        ) : (
          !error && <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No data available for this report or current filter selection.</p>
        )}
        
        <div className="flex justify-end pt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md shadow-sm"
          >
            Close Report
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ReportViewerModal;