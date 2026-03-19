import { useMemo } from 'react';

interface HealthScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  sublabel?: string;
  showSparkle?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { size: 48, stroke: 4, fontSize: 'text-xs' },
  md: { size: 80, stroke: 6, fontSize: 'text-sm' },
  lg: { size: 120, stroke: 8, fontSize: 'text-lg' },
};

export function HealthScoreRing({ score, size = 'md', showLabel = true, className = '' }: HealthScoreRingProps) {
  const { size: dim, stroke, fontSize } = sizeConfig[size];
  
  const color = useMemo(() => {
    if (score >= 80) return '#10b981'; // emerald-500
    if (score >= 60) return '#f59e0b'; // amber-500
    if (score >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  }, [score]);

  const radius = (dim - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg width={dim} height={dim} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
          className="dark:stroke-slate-700"
        />
        {/* Progress circle */}
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold text-slate-800 dark:text-slate-200`}>
            {score}
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Health
            </span>
          )}
        </div>
      )}
    </div>
  );
}
