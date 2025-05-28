import React from 'react';

interface StatusMessagesProps {
  error: string | null;
  message: string;
  isComplete?: boolean;
  onAcknowledge?: () => void;
}

const StatusMessages = ({
  error,
  message,
  isComplete,
  onAcknowledge
}: StatusMessagesProps) => {
  if (!error && !message) return null;

  return (
    <div className="space-y-2">
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      {message && !error && (
        <div className={`p-4 ${isComplete ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'} rounded-md flex justify-between items-center`}>
          <span>{message}</span>
          {isComplete && onAcknowledge && (
            <button
              onClick={onAcknowledge}
              className="px-3 py-1 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
            >
              OK
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusMessages;