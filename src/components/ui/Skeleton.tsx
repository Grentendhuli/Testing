import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  key?: React.Key;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-slate-200 dark:bg-slate-700';
  
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height,
  };

  if (animate) {
    return (
      <motion.div
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        style={style}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton patterns
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-3">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton width="100%" height={12} />
        <Skeleton width="80%" height={12} />
      </div>
    </div>
  );
}

export function SkeletonMetricCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton variant="rounded" width={40} height={40} />
        <Skeleton width={80} height={16} />
      </div>
      <Skeleton width="50%" height={32} className="mb-2" />
      <Skeleton width="30%" height={14} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} width={`${100 / columns}%`} height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 py-3">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} width={`${100 / columns}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonDashboard({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton width={200} height={28} />
        <Skeleton width={300} height={16} />
      </div>
      
      {/* Health Ring */}
      <div className="flex justify-center py-4">
        <Skeleton variant="circular" width={160} height={160} />
      </div>
      
      {/* Metric Rings */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
        <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
        <Skeleton variant="circular" width={80} height={80} className="mx-auto" />
      </div>
      
      {/* Insights */}
      <div className="space-y-4">
        <Skeleton width={120} height={20} />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}

export function SkeletonUnits({ className = '' }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton width={180} height={28} />
          <Skeleton width={250} height={16} />
        </div>
        <Skeleton variant="rounded" width={120} height={40} />
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <SkeletonMetricCard />
        <SkeletonMetricCard />
        <SkeletonMetricCard />
      </div>
      
      {/* Units Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i}><SkeletonCard /></div>
        ))}
      </div>
    </div>
  );
}

export default Skeleton;
