import React from 'react';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 bg-slate-200 rounded animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => (
          <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-8 w-16 bg-slate-200 rounded animate-pulse"></div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSkeleton;