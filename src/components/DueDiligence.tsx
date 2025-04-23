import { useState } from 'react';
import { Search, Plus, Filter, CheckCircle2, AlertCircle, Clock, FileText, MoreVertical, Users } from 'lucide-react';

interface DueDiligenceItem {
  id: string;
  title: string;
  category: string;
  status: 'Pending' | 'Completed' | 'Issues' | 'In Progress';
  assignee: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  documents: string[];
  notes: string;
}

export function DueDiligence() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Corporate',
    'Financial',
    'Legal',
    'Tax',
    'IP',
    'HR',
    'Compliance'
  ];

  const items: DueDiligenceItem[] = [
    {
      id: '1',
      title: 'Corporate Structure Review',
      category: 'Corporate',
      status: 'In Progress',
      assignee: 'John Smith',
      dueDate: '2024-04-15',
      priority: 'High',
      documents: ['Articles of Incorporation', 'Share Certificates', 'Board Resolutions'],
      notes: 'Need to verify shareholder agreements and board minutes from last 3 years'
    },
    {
      id: '2',
      title: 'IP Portfolio Analysis',
      category: 'IP',
      status: 'Pending',
      assignee: 'Sarah Lee',
      dueDate: '2024-04-20',
      priority: 'Medium',
      documents: ['Patent Filings', 'Trademark Registrations'],
      notes: 'Focus on international patent registrations'
    }
  ];

  const getStatusColor = (status: DueDiligenceItem['status']) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Issues':
        return 'bg-red-100 text-red-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: DueDiligenceItem['priority']) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Due Diligence</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="px-4 py-2 border rounded-lg text-gray-600 flex items-center gap-2 hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap
                ${selectedCategory === category 
                  ? 'bg-blue-100 text-blue-700 font-medium' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-medium text-lg text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Assignee</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">{item.assignee}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">
                      {new Date(item.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Required Documents</p>
                <div className="space-y-2">
                  {item.documents.map((doc, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span>{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Notes</p>
                <p className="text-sm text-gray-600">{item.notes}</p>
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${getPriorityColor(item.priority)}`}>
                    {item.priority} Priority
                  </span>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
                    Add Note
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 