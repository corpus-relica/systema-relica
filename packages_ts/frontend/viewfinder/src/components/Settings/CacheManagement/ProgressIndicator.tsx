import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  phase: string;
}

const ProgressIndicator = ({
  progress,
  phase
}: ProgressIndicatorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>{phase || 'Rebuilding cache...'}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressIndicator;