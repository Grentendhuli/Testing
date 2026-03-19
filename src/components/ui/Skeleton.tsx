import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'shimmer' | 'none';
  className?: string;
  key?: React.Key;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'shimmer',
  className,
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={cn(
        'bg-lb-muted',
        variant === 'text' && 'h-4 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-none',
        variant === 'rounded' && 'rounded-lg',
        animation === 'pulse' && 'animate-pulse',
        animation === 'shimmer' && 'skeleton-shimmer',
        className
      )}
      style={style}
    />
  );
}

// Pre-built skeleton layouts
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-lb-surface border border-lb-border rounded-xl p-5', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2">
          <Skeleton width={120} />
          <Skeleton width={80} variant="text" className="h-3" />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>
      
      <Skeleton width="60%" height={32} className="mb-2" />
      <Skeleton width="40%" height={20} />
    </div>
  );
}

export function SkeletonMetricCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-lb-surface border border-lb-border rounded-xl p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <Skeleton width={100} variant="text" className="h-4" />
          <Skeleton width={80} height={36} />
          <Skeleton width={60} variant="text" className="h-3" />
        </div>
        <Skeleton variant="circular" width={48} height={48} />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-lb-surface border border-lb-border rounded-lg">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton width="40%" />
            <Skeleton width="60%" variant="text" className="h-3" />
          </div>
          <Skeleton width={60} height={28} variant="rounded" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 3, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 pb-4 border-b border-lb-border">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="flex-1 h-5" />
        ))}
      </div>
      
      {/* Rows */}
      <div className="space-y-3 pt-3">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="flex-1 h-10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
        <Skeleton width={200} height={32} className="mb-2" />
        <Skeleton width={300} variant="text" className="mb-4" />
        <div className="flex gap-3">
          <Skeleton width={100} height={36} variant="rounded" />
          <Skeleton width={100} height={36} variant="rounded" />
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonMetricCard key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonCard className="lg:col-span-2" />
        <SkeletonCard />
      </div>
    </div>
  );
}

export default Skeleton;
