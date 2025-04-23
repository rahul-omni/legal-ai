import { BarChart3, PieChart, TrendingUp, AlertTriangle, Clock, FileCheck2, DollarSign, Users } from 'lucide-react';

export function ContractAnalytics() {
  return (
    <div className="h-full flex flex-col bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <h1 className="text-2xl font-semibold text-gray-800">Contract Analytics</h1>
      </div>

      {/* Dashboard Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Key Metrics Cards */}
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Contracts</p>
              <p className="text-2xl font-semibold mt-1">247</p>
            </div>
            <FileCheck2 className="w-8 h-8 text-blue-500" />
          </div>
          <div className="mt-4 flex items-center text-xs text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>12% increase from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-2xl font-semibold mt-1">18</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="mt-4 flex items-center text-xs text-red-600">
            <AlertTriangle className="w-4 h-4 mr-1" />
            <span>5 contracts need immediate attention</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-2xl font-semibold mt-1">₹4.2M</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>Contract value this quarter</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Clients</p>
              <p className="text-2xl font-semibold mt-1">156</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
          <div className="mt-4 flex items-center text-xs text-gray-600">
            <span>Across 12 industries</span>
          </div>
        </div>

        {/* Charts Section */}
        <div className="bg-white rounded-lg p-4 border shadow-sm col-span-2">
          <h3 className="font-medium mb-4">Contract Volume by Type</h3>
          <div className="h-64 flex items-center justify-center border-t pt-4">
            <BarChart3 className="w-12 h-12 text-gray-300" />
            <span className="ml-2 text-sm text-gray-500">Bar Chart Visualization</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm col-span-2">
          <h3 className="font-medium mb-4">Risk Distribution</h3>
          <div className="h-64 flex items-center justify-center border-t pt-4">
            <PieChart className="w-12 h-12 text-gray-300" />
            <span className="ml-2 text-sm text-gray-500">Pie Chart Visualization</span>
          </div>
        </div>

        {/* Contract Status Table */}
        <div className="bg-white rounded-lg p-4 border shadow-sm col-span-full">
          <h3 className="font-medium mb-4">Recent Contract Activity</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Contract Name</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Value</th>
                  <th className="pb-3">Last Updated</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b">
                  <td className="py-3">Service Agreement - Tech Corp</td>
                  <td>Tech Corp Ltd.</td>
                  <td><span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span></td>
                  <td>₹250,000</td>
                  <td>2024-03-15</td>
                </tr>
                <tr className="border-b">
                  <td className="py-3">NDA - Startup Inc</td>
                  <td>Startup Inc</td>
                  <td><span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span></td>
                  <td>₹50,000</td>
                  <td>2024-03-14</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 