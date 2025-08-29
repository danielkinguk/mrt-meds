import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardTileProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'danger';
  onClick?: () => void;
}

export const DashboardTile: React.FC<DashboardTileProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick
}) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    success: 'bg-success-50 text-success-700 border-success-200',
    warning: 'bg-warning-50 text-warning-700 border-warning-200',
    danger: 'bg-danger-50 text-danger-700 border-danger-200'
  };

  const iconColorClasses = {
    primary: 'text-primary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500'
  };

  return (
    <div
      className={`
        ${colorClasses[color]} 
        border-2 rounded-lg p-6 
        ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm mt-2 opacity-70">{subtitle}</p>
          )}
        </div>
        <div className={`${iconColorClasses[color]} opacity-80`}>
          <Icon size={32} />
        </div>
      </div>
    </div>
  );
};