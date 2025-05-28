import React, { useMemo } from 'react';
import { Sheet } from '../components/ui/sheet.js';
import CacheManagementSection from '../components/Settings/CacheManagement/index.js';

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

const Settings = () => {
  const user = useMemo(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  }, []);

  const isAdmin = user?.is_admin;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        {/* General Settings Section */}
        <Sheet className="p-4">
          <h2 className="text-xl font-semibold mb-4">General Settings</h2>
          {/* Add general settings here */}
        </Sheet>

        {/* Cache Management Section - Admin Only */}
        {isAdmin && (
          <Sheet className="p-4">
            <CacheManagementSection />
          </Sheet>
        )}
      </div>
    </div>
  );
};

export default Settings;
