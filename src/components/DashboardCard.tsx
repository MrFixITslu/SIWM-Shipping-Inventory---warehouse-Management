import React from 'react';
import { DashboardMetric } from '@/types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface DashboardCardProps {
  metric: DashboardMetric;
}

const DashboardCardInner: React.FC<DashboardCardProps> = ({ metric }) => {
  const IconComponent = metric.icon;
  return (
    <div
      className="bg-surface dark:bg-secondary-800 p-6 rounded-xl shadow-card hover:shadow-xl transition-all duration-200 border border-border group focus-within:ring-2 focus-within:ring-primary-500"
      tabIndex={0}
      aria-label={metric.title}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text-primary dark:text-secondary-100 tracking-tight group-hover:text-primary-500 transition-colors duration-200">
          {metric.title}
        </h3>
        <span className="inline-flex items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30 p-2 transition-transform duration-200 group-hover:scale-110">
          <IconComponent className="h-7 w-7 text-primary-500 dark:text-primary-400" aria-hidden="true" />
        </span>
      </div>
      <p className="text-4xl font-extrabold text-text-primary dark:text-secondary-100 leading-tight mb-1">
        {metric.value}
      </p>
      {metric.change && (
        <div className={`flex items-center text-sm mt-1 font-medium ${metric.changeType === 'positive' ? 'text-success' : 'text-error'}`}
             aria-label={metric.changeType === 'positive' ? 'Increase' : 'Decrease'}>
          {metric.changeType === 'positive' ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
          <span>{metric.change}</span>
          <span className="ml-1 text-text-secondary dark:text-secondary-400 font-normal">vs last period</span>
        </div>
      )}
      {metric.description && <p className="text-sm text-text-secondary dark:text-secondary-400 mt-2">{metric.description}</p>}
    </div>
  );
};

const DashboardCard = React.memo(DashboardCardInner);
export default DashboardCard;