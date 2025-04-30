import { useState } from 'react';
import { useUserContext } from "@/context/userContext";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";
import { GeneralSettings } from './GeneralSettings';
import { TeamManagement } from './TeamManagement';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const { dispatchUser } = useUserContext();
  const router = useRouter();

  const handleLogout = () => {
    dispatchUser({ type: "LOGOUT_USER" });
    router.push(routeConfig.publicRoutes.login);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="p-6 bg-white border-b">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Settings</h1>
        
        {/* Tabs */}
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 w-fit">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'general' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('general')}
          >
            General
          </button>
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === 'team' 
                ? 'bg-white text-gray-800 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
            onClick={() => setActiveTab('team')}
          >
            Team management
          </button>
        </div>
      </div>

      <div className="flex-1 p-6">
        {activeTab === 'general' && <GeneralSettings onLogout={handleLogout} />}
        {activeTab === 'team' && <TeamManagement />}
      </div>
    </div>
  );
}