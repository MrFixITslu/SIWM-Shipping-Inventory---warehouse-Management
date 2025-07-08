import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PageContainer from '@/components/PageContainer';
import ReportCard from '@/components/ReportCard';
import ReportViewerModal from '@/components/ReportViewerModal';
import { ReportDefinition, ReportCategory, ReportFilterOption, ASN } from '@/types';
import { REPORT_DEFINITIONS as reportTemplates } from '@/constants'; 
import { SearchIcon, AiIcon } from '@/constants';
import { inventoryService } from '@/services/inventoryService';
import { asnService } from '@/services/asnService';
import Table from '@/components/Table';

const ReportingPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [nlQuery, setNlQuery] = useState('');
  const [dynamicReportDefs, setDynamicReportDefs] = useState<ReportDefinition[]>(reportTemplates);
  const [incomingShipments, setIncomingShipments] = useState<ASN[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  useEffect(() => {
    const fetchDynamicOptions = async () => {
      try {
        const categories = await inventoryService.getUniqueCategories();
        const categoryOptions: ReportFilterOption[] = categories.map(cat => ({ value: cat, label: cat }));

        setDynamicReportDefs(prevDefs => 
          prevDefs.map(def => {
            if (def.id === 'inv_stock_levels') {
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

  useEffect(() => {
    asnService.getASNs().then(setIncomingShipments).catch(console.error);
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

  const filteredShipments = useMemo(() => {
    return incomingShipments.filter(asn => {
      if (!asn.createdAt) return false;
      const date = new Date(asn.createdAt);
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    });
  }, [incomingShipments, selectedMonth, selectedYear]);

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
            name="nl-query"
            value={nlQuery}
            onChange={(e) => setNlQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleNlQuerySearch()}
            placeholder="Type your query here..."
            className="flex-grow block w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-l-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100"
            autoComplete="off"
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
          <label htmlFor="search-reports" className="sr-only">Search reports</label>
          <input
            id="search-reports"
            type="text"
            name="search-reports"
            placeholder="Search reports by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md leading-5 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-secondary-100 placeholder-secondary-400 dark:placeholder-secondary-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            autoComplete="off"
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

      {/* Incoming Shipments Report Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-semibold text-secondary-800 dark:text-secondary-200 mb-4 pb-2 border-b border-secondary-300 dark:border-secondary-700">
          Incoming Shipments Report
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <label>
            Month:
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="ml-2 p-1 rounded border">
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
              ))}
            </select>
          </label>
          <label>
            Year:
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="ml-2 p-1 rounded border">
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </label>
        </div>
        <Table<ASN>
          columns={[
            { key: 'poNumber', header: 'P.O. #', sortable: true },
            { key: 'supplier', header: 'Supplier', sortable: true },
            { key: 'expectedArrival', header: 'Expected Arrival', sortable: true },
            { key: 'status', header: 'Status', sortable: true, render: (item) => {
              const statusColors: Record<ASN['status'], string> = {
                'On Time': 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200',
                'Delayed': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200',
                'Arrived': 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200',
                'Processing': 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-200',
                'Processed': 'bg-teal-100 text-teal-800 dark:bg-teal-700 dark:text-teal-200',
                'Added to Stock': 'bg-teal-200 text-teal-900 dark:bg-teal-800 dark:text-teal-100',
              };
              return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[item.status]}`}>{item.status}</span>;
            } },
            { key: 'itemCount', header: 'Item Count', sortable: true },
            { key: 'department', header: 'Department', sortable: true },
          ]}
          data={filteredShipments}
          onRowClick={() => {}}
        />
        {filteredShipments.length === 0 && (
          <p className="text-center text-secondary-500 dark:text-secondary-400 py-8">No incoming shipments for this period.</p>
        )}
      </div>

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