
import React from 'react';
import { ReportDefinition } from '@/types';
import { ChartBarIcon, AiIcon } from '@/constants'; // Assuming ChartBarIcon is generic

interface ReportCardProps {
  report: ReportDefinition;
  onViewReport: (report: ReportDefinition) => void;
}

const ReportCardInner: React.FC<ReportCardProps> = ({ report, onViewReport }) => {
  const IconComponent = report.aiPowered ? AiIcon : ChartBarIcon;

  return (
    <div 
      className="bg-white dark:bg-secondary-800 p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer flex flex-col justify-between h-full"
      onClick={() => onViewReport(report)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewReport(report)}
      aria-label={`View ${report.name} report`}
    >
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400">{report.name}</h3>
          <IconComponent className="h-7 w-7 text-secondary-500 dark:text-secondary-400" />
        </div>
        <p className="text-sm text-secondary-600 dark:text-secondary-300 leading-relaxed">
          {report.description}
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-secondary-200 dark:border-secondary-700">
        <span className="text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-100 dark:bg-primary-800/50 px-2 py-1 rounded-full">
          {report.category}
        </span>
        {report.aiPowered && (
          <span className="ml-2 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-800/50 px-2 py-1 rounded-full">
            AI Enhanced
          </span>
        )}
      </div>
    </div>
  );
};

const ReportCard = React.memo(ReportCardInner);
export default ReportCard;