import React from 'react';

interface StatusMessagesProps {
  error: string | null;
  message: string;
}

const StatusMessages = ({
  error,
  message
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
        <div className="p-4 bg-blue-100 text-blue-700 rounded-md">
          {message}
        </div>
      )}
    </div>
  );
};

export default StatusMessages;