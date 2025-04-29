import { useState } from 'react';
import { Search, UserPlus, LogOut } from 'lucide-react';
import { userContext } from "@/context/userContext";
import { routeConfig } from "@/lib/routeConfig";
import { useRouter } from "next/navigation";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Pending' | 'Inactive';
  avatarInitial: string;
}

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'team'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { dispatchUser } = userContext();
  const router = useRouter();

  const handleLogout = () => {
    dispatchUser({ type: "LOGOUT_USER" });
    router.push(routeConfig.publicRoutes[0]);
  };

  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'Rahul Raj',
      email: 'rahul.raj@arthmate.com',
      status: 'Active',
      avatarInitial: 'R'
    },
    // Add more team members as needed
  ];

  const filteredMembers = teamMembers.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">General Settings</h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-1">
                  Theme
                </label>
                <select 
                  id="theme" 
                  className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                  Language
                </label>
                <select 
                  id="language" 
                  className="w-full max-w-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="bn">Bengali</option>
                </select>
              </div>
              
              <div className="pt-6 mt-6 border-t">
                <h3 className="text-md font-medium text-gray-800 mb-4">Account</h3>
                
                <div className="flex items-center justify-between max-w-xs">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Logout</h4>
                    <p className="text-xs text-gray-500 mt-1">Sign out of your account</p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 hover:bg-red-100"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg border">
            <div className="p-4 flex justify-between items-center">
              <div className="relative w-96">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                Invite Team
              </button>
            </div>
            
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-y bg-gray-50">
                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-6 py-3 text-sm font-semibold text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="border-b">
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-medium">
                          {member.avatarInitial}
                        </div>
                        <span className="font-medium">{member.name}</span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium
                          ${member.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            member.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {member.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 flex items-center justify-between border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Rows per page</span>
                <select 
                  className="px-2 py-1 border rounded text-sm"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <button className="p-1 rounded" disabled>
                  <span className="text-2xl text-gray-400">«</span>
                </button>
                <button className="p-1 rounded" disabled>
                  <span className="text-xl text-gray-400">‹</span>
                </button>
                <span className="text-sm text-gray-600">Page 1 of 1</span>
                <button className="p-1 rounded" disabled>
                  <span className="text-xl text-gray-400">›</span>
                </button>
                <button className="p-1 rounded" disabled>
                  <span className="text-2xl text-gray-400">»</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 