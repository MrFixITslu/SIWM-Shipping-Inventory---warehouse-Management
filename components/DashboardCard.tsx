
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardMetric } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface DashboardCardProps {
  metric: DashboardMetric;
  onClick?: () => void;
  href?: string;
}

const DashboardCardInner: React.FC<DashboardCardProps> = ({ metric, onClick, href }) => {
  const navigate = useNavigate();
  const IconComponent = metric.icon;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  const isClickable = onClick || href;

  return (
    <div 
      className={`
        relative bg-white dark:bg-secondary-800 p-6 rounded-xl shadow-lg 
        transition-all duration-300 ease-in-out group cursor-pointer
        ${isClickable ? 'hover:shadow-2xl hover:-translate-y-1 hover:scale-105' : ''}
        ${isClickable ? 'hover:bg-gradient-to-br hover:from-white hover:to-gray-50 dark:hover:from-secondary-800 dark:hover:to-secondary-700' : ''}
        border border-transparent hover:border-primary-200 dark:hover:border-primary-700
      `}
      onClick={handleClick}
    >
      {/* Hover overlay effect */}
      {isClickable && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-secondary-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-150" />
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary-100 dark:bg-secondary-700/20 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100 group-hover:scale-150" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-300 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
            {metric.title}
          </h3>
          <div className="relative">
            <IconComponent className="h-8 w-8 text-primary-500 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300" />
            {isClickable && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}
          </div>
        </div>
        
        <p className="text-4xl font-bold text-secondary-900 dark:text-secondary-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
          {metric.value}
        </p>
        
        {metric.change && (
          <div className={`flex items-center text-sm mt-2 transition-all duration-300 ${
            metric.changeType === 'positive' 
              ? 'text-green-500 group-hover:text-green-600' 
              : 'text-red-500 group-hover:text-red-600'
          }`}>
            {metric.changeType === 'positive' ? (
              <ArrowUpIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <ArrowDownIcon className="h-4 w-4 mr-1 group-hover:scale-110 transition-transform duration-300" />
            )}
            <span className="font-medium">{metric.change}</span>
            <span className="ml-1 text-secondary-500 dark:text-secondary-400">vs last period</span>
          </div>
        )}
        
        {metric.description && (
          <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-3 group-hover:text-secondary-600 dark:group-hover:text-secondary-300 transition-colors duration-300">
            {metric.description}
          </p>
        )}

        {/* Click indicator */}
        {isClickable && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

const DashboardCard = React.memo(DashboardCardInner);
export default DashboardCard;