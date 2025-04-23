import { useState } from 'react';
import { Search, Plus, FileText, ChevronRight, Check } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  clauses: Clause[];
}

interface Clause {
  id: string;
  title: string;
  content: string;
  isRequired: boolean;
  category: string;
}

export function DocumentAssembly() {
  const [selectedClauses, setSelectedClauses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const templates: Template[] = [
    {
      id: '1',
      name: 'Service Agreement',
      category: 'Commercial Contracts',
      description: 'Standard service agreement template with customizable clauses',
      clauses: [
        { id: 'c1', title: 'Definitions', content: '...', isRequired: true, category: 'Basic' },
        { id: 'c2', title: 'Scope of Services', content: '...', isRequired: true, category: 'Basic' },
        { id: 'c3', title: 'Payment Terms', content: '...', isRequired: true, category: 'Commercial' },
        { id: 'c4', title: 'Intellectual Property', content: '...', isRequired: false, category: 'IP' },
      ]
    },
    // Add more templates...
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Document Assembly</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            New Document
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates and clauses..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Templates List */}
        <div className="w-1/3 border-r bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-4">Templates</h2>
            <div className="space-y-3">
              {templates.map(template => (
                <div key={template.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                      <p className="text-xs text-gray-400 mt-2">{template.clauses.length} clauses</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Clauses Selection */}
        <div className="w-1/3 border-r bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-4">Available Clauses</h2>
            <div className="space-y-2">
              {templates[0].clauses.map(clause => (
                <div 
                  key={clause.id}
                  className={`p-3 border rounded-lg cursor-pointer ${
                    selectedClauses.includes(clause.id) ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedClauses(prev => 
                      prev.includes(clause.id) 
                        ? prev.filter(id => id !== clause.id)
                        : [...prev, clause.id]
                    );
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      selectedClauses.includes(clause.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedClauses.includes(clause.id) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{clause.title}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {clause.isRequired && <span className="text-red-500">Required</span>}
                        <span className="mx-2">•</span>
                        {clause.category}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="p-4">
            <h2 className="font-medium text-gray-900 mb-4">Document Preview</h2>
            <div className="p-6 border rounded-lg bg-gray-50 min-h-[500px]">
              <p className="text-gray-500 text-center">
                {selectedClauses.length === 0 
                  ? 'Select clauses to preview the document'
                  : 'Preview of selected clauses will appear here'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 