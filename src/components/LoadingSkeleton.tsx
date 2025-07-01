import React from 'react';

interface LoadingSkeletonProps {
  type: 'dashboard' | 'quickshot' | 'smartmatch' | 'browse';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type }) => {
  const renderDashboardSkeleton = () => (
    <div className="min-h-screen bg-[#070000]">
      {/* Header skeleton */}
      <div className="bg-[#1a1c1e] border-b border-neutral-700 p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="h-8 w-32 bg-neutral-700 rounded animate-pulse"></div>
          <div className="h-8 w-24 bg-neutral-700 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Content skeleton */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-neutral-800 rounded animate-pulse"></div>
            ))}
          </div>
          
          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            <div className="h-8 w-48 bg-neutral-700 rounded animate-pulse"></div>
            <div className="grid md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-neutral-800 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQuickShotSkeleton = () => (
    <div className="min-h-screen bg-[#070000] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="h-8 w-64 bg-neutral-700 rounded animate-pulse mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-neutral-800 rounded animate-pulse mx-auto"></div>
        </div>
        
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Poster skeleton */}
          <div className="lg:col-span-2">
            <div className="aspect-[2/3] bg-neutral-800 rounded-lg animate-pulse"></div>
          </div>
          
          {/* Content skeleton */}
          <div className="lg:col-span-3 space-y-6">
            <div className="space-y-3">
              <div className="h-8 w-3/4 bg-neutral-700 rounded animate-pulse"></div>
              <div className="h-4 w-1/2 bg-neutral-800 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-neutral-800 rounded animate-pulse"></div>
              ))}
            </div>
            
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-neutral-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSmartMatchSkeleton = () => (
    <div className="min-h-screen bg-[#070000] flex items-center justify-center">
      <div className="w-full max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-neutral-700 rounded animate-pulse mx-auto mb-4"></div>
          <div className="h-4 w-64 bg-neutral-800 rounded animate-pulse mx-auto mb-6"></div>
          
          {/* Progress bar skeleton */}
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-8 h-2 bg-neutral-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Question options skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-neutral-800 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBrowseSkeleton = () => (
    <div className="min-h-screen bg-[#070000]">
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header skeleton */}
          <div className="text-center mb-16">
            <div className="h-12 w-96 bg-neutral-700 rounded animate-pulse mx-auto mb-4"></div>
            <div className="h-6 w-64 bg-neutral-800 rounded animate-pulse mx-auto"></div>
          </div>
          
          {/* Decade selector skeleton */}
          <div className="mb-12">
            <div className="flex justify-center gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 w-24 bg-neutral-700 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Year slider skeleton */}
          <div className="mb-12">
            <div className="flex justify-center gap-6 overflow-hidden">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-8 w-12 bg-neutral-800 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          
          {/* Movie content skeleton */}
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="aspect-[2/3] bg-neutral-800 rounded-lg animate-pulse"></div>
            </div>
            <div className="lg:col-span-3 space-y-6">
              <div className="h-8 w-3/4 bg-neutral-700 rounded animate-pulse"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-4 bg-neutral-800 rounded animate-pulse"></div>
                ))}
              </div>
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-12 bg-neutral-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'dashboard':
      return renderDashboardSkeleton();
    case 'quickshot':
      return renderQuickShotSkeleton();
    case 'smartmatch':
      return renderSmartMatchSkeleton();
    case 'browse':
      return renderBrowseSkeleton();
    default:
      return (
        <div className="min-h-screen bg-[#070000] flex items-center justify-center">
          <div className="w-16 h-16 border-2 border-[#DFBD69] rounded-full animate-spin border-t-transparent"></div>
        </div>
      );
  }
};

export default LoadingSkeleton;