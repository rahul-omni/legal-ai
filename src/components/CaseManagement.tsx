import { Clock, Filter, Plus, Search, Tag } from 'lucide-react';

interface Case {
  id: string;
  title: string;
  number: string;
  client: string;
  status: 'Active' | 'Pending' | 'Closed';
  court: string;
  nextHearing: string;
  practice: string;
  tags: string[];
}

export function CaseManagement() {
  const dummyCases: Case[] = [
    {
      id: '1',
      title: 'Smith vs State Bank of India',
      number: 'CWP-1234-2024',
      client: 'John Smith',
      status: 'Active',
      court: 'Delhi High Court',
      nextHearing: '2024-04-15',
      practice: 'Banking',
      tags: ['High Priority', 'Commercial']
    },
    {
      id: '2',
      title: 'Tech Corp Acquisition',
      number: 'M&A-789-2024',
      client: 'Tech Corp Ltd.',
      status: 'Pending',
      court: 'NCLT Mumbai',
      nextHearing: '2024-04-20',
      practice: 'Corporate',
      tags: ['Merger', 'Due Diligence']
    }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Case Management</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Case
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search cases..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button className="px-4 py-2 border rounded-lg text-gray-600 flex items-center gap-2 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Cases List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid gap-4">
          {dummyCases.map(case_ => (
            <div key={case_.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-lg text-gray-900">{case_.title}</h3>
                  <p className="text-sm text-gray-500">{case_.number}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium
                  ${case_.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    case_.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-gray-100 text-gray-800'}`}>
                  {case_.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="text-sm font-medium">{case_.client}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Court</p>
                  <p className="text-sm font-medium">{case_.court}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Hearing</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {new Date(case_.nextHearing).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Practice Area</p>
                  <p className="text-sm font-medium">{case_.practice}</p>
                </div>
              </div>

              <div className="flex gap-2">
                {case_.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}