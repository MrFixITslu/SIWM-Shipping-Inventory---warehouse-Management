import React from 'react';
import { DashboardMetric } from '@/types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface DashboardCardProps {
  metric: DashboardMetric;
}

const DashboardCardInner: React.FC<DashboardCardProps> = ({ metric }) => {
  const IconComponent = metric.icon;
  return (
    <div className="bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300">{metric.title}</h3>
        <IconComponent className="h-8 w-8 text-primary-500 dark:text-primary-400" />
      </div>
      <p className="text-4xl font-bold text-secondary-900 dark:text-secondary-100">{metric.value}</p>
      {metric.change && (
        <div className={`flex items-center text-sm mt-1 ${metric.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
          {metric.changeType === 'positive' ? <ArrowUpIcon className="h-4 w-4 mr-1" /> : <ArrowDownIcon className="h-4 w-4 mr-1" />}
          <span>{metric.change}</span>
          <span className="ml-1 text-secondary-500 dark:text-secondary-400">vs last period</span>
        </div>
      )}
      {metric.description && <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-2">{metric.description}</p>}
    </div>
  );
};

const DashboardCard = React.memo(DashboardCardInner);
export default DashboardCard;