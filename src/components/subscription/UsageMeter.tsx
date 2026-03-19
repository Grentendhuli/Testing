import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export interface UsageMetric {
  name: string;
  used: number;
  limit: number;
  unit: string;
  color?: 'amber' | 'emerald' | 'blue' | 'red';
}

interface UsageMeterProps {
  metrics: UsageMetric[];
  showLabels?: boolean;
}

export function UsageMeter({ metrics, showLabels = true }: UsageMeterProps) {
  const getPercentage = (used: number, limit: number) => {
    return Math.min(100, Math.round((used / limit) * 100));
  };

  const getColorClass = (percentage: number, color?: UsageMetric['color']) => {
    if (color) {
      const colorMap = {
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        blue: 'bg-blue-500',
        red: 'bg-red-500',
      };
      return colorMap[color];
    }
    
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) {
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
    if (percentage >= 75) {
      return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
    return <CheckCircle className="w-4 h-4 text-emerald-400" />;
  };

  return (
    <div className="space-y-4">
      {metrics.map((metric, index) => {
        const percentage = getPercentage(metric.used, metric.limit);
        const colorClass = getColorClass(percentage, metric.color);

        return (
          <div key={index}>
            {showLabels && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-lb-text-primary">
                    {metric.name}
                  </span>
                  {getStatusIcon(percentage)}
                </div>
                <div className="text-sm text-lb-text-secondary">
                  <span className="font-medium text-lb-text-primary">{metric.used}</span>
                  {' '}
                  <span className="text-lb-text-muted">/</span>
                  {' '}
                  {metric.limit} {metric.unit}
                </div>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="h-2 bg-lb-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            
            {/* Percentage Label (if not showing full labels) */}
            {!showLabels && (
              <div className="flex justify-between mt-1">
                <span className="text-xs text-lb-text-muted">{metric.name}</span>
                <span className={`text-xs font-medium ${
                  percentage >= 90 ? 'text-red-400' :
                  percentage >= 75 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {percentage}%
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default UsageMeter;
