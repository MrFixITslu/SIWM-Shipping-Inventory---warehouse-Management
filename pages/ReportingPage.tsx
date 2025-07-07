import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import ReportCard from '@/components/ReportCard';
import ReportViewerModal from '@/components/ReportViewerModal';
import { ReportDefinition, ReportCategory, ReportFilterOption } from '@/types';
import { REPORT_DEFINITIONS as reportTemplates } from '@/constants'; 
import { SearchIcon, AiIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';

const ReportingPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nlQuery, setNlQuery] = useState('');
  const [dynamicReportDefs, setDynamicReportDefs] = useState<ReportDefinition[]>(reportTemplates);

  useEffect(() => {
    const fetchDynamicOptions = async () => {
      try {
        const categories = await inventoryService.getUniqueCategories();
        const categoryOptions: ReportFilterOption[] = categories.map(cat => ({ value: cat, label: cat }));

        setDynamicReportDefs(prevDefs => 
          prevDefs.map(def => {
            if (def.id === 'inv_stock_levels' || def.id === 'inv_below_reorder_point' || def.id === 'inv_stock_out_risk_6months') {
              const categoryFilter = def.filters?.find(f => f.id === 'category');
              if (categoryFilter) {
                categoryFilter.options = categoryOptions;
              }
            }
            return def;
          })
        );
      } catch (error) {
        console.error("Failed to fetch dynamic report options:", error);
      }
    };
    fetchDynamicOptions();
  }, []);

  const handleViewReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReport(null);
  };

  const handleNlQuerySearch = () => {
    if (!nlQuery.trim()) return;
    const foundReport = dynamicReportDefs.find(
      (report) => report.naturalLanguageQuery && nlQuery.toLowerCase().includes(report.naturalLanguageQuery)
    );
    if (foundReport) {
      handleViewReport(foundReport);
    } else {
      alert(`No direct report found for "${nlQuery}". Try a more general term or browse below.`);
    }
  };

  const filteredReportDefinitions = useMemo(() => {
    if (!searchTerm.trim()) return dynamicReportDefs;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return dynamicReportDefs.filter(
      (report) =>
        report.name.toLowerCase().includes(lowerSearchTerm) ||
        report.description.toLowerCase().includes(lowerSearchTerm) ||
        report.category.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, dynamicReportDefs]);

  const reportsByCategory = useMemo(() => {
    return filteredReportDefinitions.reduce((acc, report) => {
      (acc[report.category] = acc[report.category] || []).push(report);
      return acc;
    }, {} as Record<ReportCategory, ReportDefinition[]>);
  }, [filteredReportDefinitions]);

  const categoryOrder: ReportCategory[] = [
    ReportCategory.Inventory,
    ReportCategory.ProcurementVendor,
    ReportCategory.InboundOutbound,
    ReportCategory.WarehouseOps,
    ReportCategory.AIPredictive,
  ];
  
  return (
    <PageContainer title="Reporting & Analytics Center">
      <div className="mb-6 p-4 bg-white dark:bg-secondary-800 rounded-lg shadow">
        <label htmlFor="nl-query" className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1">
          <AiIcon className="h-5 w-5 inline mr-1 text-purple-500" />
          Ask VisionAI for a report... (e.g., "stock out risk")
        </label>
        <div className="flex">
          <input
            type="text"
            id="nl-query"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNlQuerySearch()}
            placeholder="Type your query here..."
            className="flex-grow block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
          />
          <button
            onClick={handleNlQuerySearch}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-r-md shadow-sm flex items-center"
          >
            <SearchIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search reports by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md leading-5 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
      </div>
      
      {Object.keys(reportsByCategory).length === 0 && !searchTerm && (
         <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No reports available.</p>
      )}
      {Object.keys(reportsByCategory).length === 0 && searchTerm && (
         <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No reports found matching your search criteria.</p>
      )}

      {categoryOrder.map((category) =>
        reportsByCategory[category] && reportsByCategory[category].length > 0 ? (
          <div key={category} className="mb-8">
            <h2 className="text-2xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 pb-2 border-b border-secondary-300 dark:border-secondary-700">
              {category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reportsByCategory[category].map((report) => (
                <ReportCard key={report.id} report={report} onViewReport={handleViewReport} />
              ))}
            </div>
          </div>
        ) : null
      )}

      {selectedReport && (
        <ReportViewerModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          reportDefinition={selectedReport}
        />
      )}
    </PageContainer>
  );
};

export default ReportingPage;