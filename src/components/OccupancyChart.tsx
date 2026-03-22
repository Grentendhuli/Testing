import { useMemo } from 'react';

interface OccupancyData {
  occupied: number;
  vacant: number;
  maintenance: number;
}

interface OccupancyChartProps {
  data: OccupancyData;
  size?: number;
  className?: string;
}

export function OccupancyChart({ data, size = 200, className = '' }: OccupancyChartProps) {
  const { occupied, vacant, maintenance } = data;
  const total = occupied + vacant + maintenance;

  const chartData = useMemo(() => {
    if (total === 0) {
      return { segments: [], empty: true };
    }

    const segments = [
      { label: 'Occupied', value: occupied, color: '#10b981', bgColor: 'bg-emerald-500' },
      { label: 'Vacant', value: vacant, color: '#f59e0b', bgColor: 'bg-amber-500' },
      { label: 'Maintenance', value: maintenance, color: '#f43f5e', bgColor: 'bg-rose-500' },
    ].filter(s => s.value > 0);

    return { segments, empty: false };
  }, [occupied, vacant, maintenance, total]);

  const radius = size / 2 - 20;
  const center = size / 2;
  const strokeWidth = 24;
  const innerRadius = radius - strokeWidth / 2;

  if (chartData.empty) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        </svg>
        <div className="absolute text-center">
          <p className="text-2xl font-bold text-slate-400">0</p>
          <p className="text-xs text-slate-400">No units</p>
        </div>
      </div>
    );
  }

  const occupancyRate = Math.round((occupied / total) * 100);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="#f1f5f9" strokeWidth={strokeWidth} />
          {chartData.segments.map((segment, index) => {
            const percentage = segment.value / total;
            const dashArray = `${percentage * 100 * 2 * Math.PI * innerRadius / 100} ${2 * Math.PI * innerRadius}`;
            const prevSegments = chartData.segments.slice(0, index);
            const prevOffset = prevSegments.reduce((acc, s) => acc + (s.value / total) * 100 * 2 * Math.PI * innerRadius / 100, 0);
            return (
              <circle
                key={segment.label}
                cx={center}
                cy={center}
                r={innerRadius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={-prevOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">{occupancyRate}%</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Occupied</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        {chartData.segments.map((segment) => (
          <div key={segment.label} className="flex flex-col items-center">
            <div className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${segment.bgColor}`} />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{segment.value}</span>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OccupancyChart;
