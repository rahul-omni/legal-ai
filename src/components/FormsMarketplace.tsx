import { useState } from 'react';
import { Search, Filter, Download, ShoppingCart, Star, Tag, FileText } from 'lucide-react';

interface LegalForm {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  downloads: number;
  tags: string[];
  preview: string;
}

export function FormsMarketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Business Formation',
    'Employment',
    'Real Estate',
    'Intellectual Property',
    'Family Law',
    'Estate Planning'
  ];

  const forms: LegalForm[] = [
    {
      id: '1',
      name: 'LLC Formation Bundle',
      description: 'Complete set of documents for forming an LLC including Operating Agreement, Articles of Organization, and Meeting Minutes.',
      category: 'Business Formation',
      price: 99,
      rating: 4.8,
      downloads: 1250,
      tags: ['LLC', 'Business', 'Formation'],
      preview: 'preview_url'
    },
    {
      id: '2',
      name: 'Employment Agreement Pack',
      description: 'Comprehensive employment agreement templates with NDA and IP assignment clauses.',
      category: 'Employment',
      price: 79,
      rating: 4.6,
      downloads: 850,
      tags: ['Employment', 'HR', 'Contracts'],
      preview: 'preview_url'
    },
    // Add more forms...
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Forms Marketplace</h1>
        
        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search forms..."
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

      {/* Forms Grid */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map(form => (
            <div key={form.id} className="bg-white rounded-lg border hover:shadow-lg transition-shadow">
              {/* Preview Section */}
              <div className="h-40 bg-gray-100 rounded-t-lg flex items-center justify-center">
                <FileText className="w-16 h-16 text-gray-400" />
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-gray-900">{form.name}</h3>
                  <span className="text-lg font-semibold text-blue-600">${form.price}</span>
                </div>
                
                <p className="text-sm text-gray-500 mt-2">{form.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {form.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    {form.rating}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    {form.downloads}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg 
                                   hover:bg-blue-700 flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </button>
                  <button className="px-4 py-2 border border-gray-200 rounded-lg 
                                   hover:bg-gray-50 flex items-center justify-center">
                    <Download className="w-4 h-4 text-gray-600" />
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