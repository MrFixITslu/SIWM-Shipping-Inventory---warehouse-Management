import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'indigo';
  onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-700',
      text: 'text-blue-600 dark:text-blue-400',
      icon: 'text-blue-500 dark:text-blue-400',
      hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-700',
      text: 'text-green-600 dark:text-green-400',
      icon: 'text-green-500 dark:text-green-400',
      hover: 'hover:bg-green-100 dark:hover:bg-green-900/30',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-700',
      text: 'text-red-600 dark:text-red-400',
      icon: 'text-red-500 dark:text-red-400',
      hover: 'hover:bg-red-100 dark:hover:bg-red-900/30',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-700',
      text: 'text-yellow-600 dark:text-yellow-400',
      icon: 'text-yellow-500 dark:text-yellow-400',
      hover: 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-700',
      text: 'text-purple-600 dark:text-purple-400',
      icon: 'text-purple-500 dark:text-purple-400',
      hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
    },
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-900/20',
      border: 'border-indigo-200 dark:border-indigo-700',
      text: 'text-indigo-600 dark:text-indigo-400',
      icon: 'text-indigo-500 dark:text-indigo-400',
      hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
    },
  };

  const classes = colorClasses[color];

  return (
    <div
      className={`
        relative p-6 rounded-xl border transition-all duration-300 group
        ${classes.bg} ${classes.border}
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}
        ${onClick ? classes.hover : ''}
      `}
      onClick={onClick}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 rounded-xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-current rounded-full opacity-20" />
        <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-current rounded-full opacity-20" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-medium ${classes.text}`}>{title}</h3>
          {Icon && (
            <div className={`p-2 rounded-lg bg-white/50 dark:bg-black/20 ${classes.icon}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="mb-2">
          <p className="text-2xl font-bold text-secondary-900 dark:text-secondary-100">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>

        {trend && (
          <div className="flex items-center">
            <span
              className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-sm text-secondary-500 dark:text-secondary-400 ml-1">
              {trend.label}
            </span>
          </div>
        )}

        {/* Click indicator */}
        {onClick && (
          <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard; 