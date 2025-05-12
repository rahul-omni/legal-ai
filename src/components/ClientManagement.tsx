import { useState, useEffect } from 'react';
import { Plus, Search, X, User, Building, Mail, Phone, Loader2, Edit, Trash2, MoreHorizontal, Filter, FileText, DollarSign, Clock } from 'lucide-react';
import { useToast } from './ui/toast';
import { ClientBilling } from './ClientBilling';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  billingAddress?: string;
  gstNumber?: string;
  defaultBillingRate?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export function ClientManagement() {
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  
  // Initial dummy clients with Indian context
  const [clients, setClients] = useState<Client[]>([
    {
      id: 'client1',
      name: 'Rajesh Sharma',
      email: 'rajesh@sharma.com',
      phone: '+918431209936',
      company: 'Sharma Enterprises Pvt. Ltd.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client2',
      name: 'Tata Consultancy Services',
      email: 'legal@tcs.com',
      phone: '+91 87654 32109',
      company: 'Tata Consultancy Services Ltd.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client3',
      name: 'Priya Patel',
      email: 'priya.patel@gmail.com',
      phone: '+91 76543 21098',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client4',
      name: 'Aditya Birla Group',
      email: 'legal@adityabirla.com',
      phone: '+91 98765 12345',
      company: 'Aditya Birla Group',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'client5',
      name: 'Sundar Krishnan',
      email: 'sundar.k@outlook.com',
      phone: '+91 89765 43210',
      company: 'Krishna Textiles',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]);
  
  const [newClient, setNewClient] = useState<Partial<Client>>({
    name: '',
    email: '',
    phone: '',
    company: '',
    billingAddress: '',
    gstNumber: '',
    defaultBillingRate: 5000,
    paymentTerms: '30 days',
  });

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleCreateClient = () => {
    // Validate required fields
    if (!newClient.name || !newClient.email) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newClient.email || '')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Create new client with dummy ID and timestamps
      const createdClient: Client = {
        id: `client-${Date.now()}`,
        name: newClient.name || '',
        email: newClient.email || '',
        phone: newClient.phone,
        company: newClient.company,
        billingAddress: newClient.billingAddress,
        gstNumber: newClient.gstNumber,
        defaultBillingRate: newClient.defaultBillingRate,
        paymentTerms: newClient.paymentTerms,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the new client to the state
      setClients(prevClients => [createdClient, ...prevClients]);
      
      // Close the modal and reset form
      setShowNewClientModal(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        company: '',
        billingAddress: '',
        gstNumber: '',
        defaultBillingRate: 5000,
        paymentTerms: '30 days',
      });
      
      setIsSubmitting(false);
      showToast('Client created successfully', 'success');
    }, 500);
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    return (
      client.name.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower) ||
      (client.company && client.company.toLowerCase().includes(searchLower))
    );
  });

  const handleViewClientDetails = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setSelectedClient(client);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Client Management</h1>
          <button 
            onClick={() => setShowNewClientModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Client
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
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
      </div>

      {/* Clients List */}
      <div className="flex-1 p-6 overflow-auto">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No clients found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Get started by adding your first client'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowNewClientModal(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg inline-flex items-center gap-2 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Client
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-md border overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 py-2 px-3 text-xs font-medium text-gray-500 border-b bg-gray-50">
              <div className="col-span-3">Client / Company</div>
              <div className="col-span-3">Contact</div>
              <div className="col-span-2">Billing</div>
              <div className="col-span-2">Cases</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {filteredClients.map(client => (
                <div key={client.id} className="grid grid-cols-12 gap-2 py-2 px-3 items-center hover:bg-gray-50 text-sm">
                  <div className="col-span-3">
                    <div className="font-medium text-gray-900">{client.name}</div>
                    {client.company && (
                      <div className="text-xs text-gray-500 mt-0.5">{client.company}</div>
                    )}
                  </div>
                  
                  <div className="col-span-3 text-xs">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2 text-xs">
                    {client.gstNumber ? (
                      <>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3 text-gray-400" />
                          <span className="truncate">GST: {client.gstNumber}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{client.paymentTerms || '30 days'}</span>
                        </div>
                      </>
                    ) : (
                      <span className="text-gray-400 text-xs">No billing info</span>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center gap-1">
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">4</span>
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">2</span>
                      <span className="text-xs text-gray-500">Cases</span>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex justify-end gap-1">
                    <button 
                      onClick={() => handleViewClientDetails(client.id)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                      title="View Details"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Client Modal */}
      {showNewClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Add New Client</h3>
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information Section */}
                <div className="col-span-2">
                  <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
                </div>
                
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newClient.name}
                      onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                      className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter client name"
                    />
                  </div>
                </div>
                
                {/* Company */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={newClient.company}
                      onChange={(e) => setNewClient({...newClient, company: e.target.value})}
                      className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter company name"
                    />
                  </div>
                </div>
                
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                      className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
                
                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                      className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                
                {/* Billing Information Section */}
                <div className="col-span-2 mt-4 pt-4 border-t">
                  <h4 className="font-medium text-gray-800 mb-3">Billing Information</h4>
                </div>
                
                {/* Billing Address */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Address
                  </label>
                  <textarea
                    value={newClient.billingAddress}
                    onChange={(e) => setNewClient({...newClient, billingAddress: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter billing address"
                    rows={3}
                  />
                </div>
                
                {/* GST Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GST Number
                  </label>
                  <input
                    type="text"
                    value={newClient.gstNumber}
                    onChange={(e) => setNewClient({...newClient, gstNumber: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 29ABCDE1234F1Z5"
                  />
                </div>
                
                {/* Default Billing Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Billing Rate (₹/hr)
                  </label>
                  <input
                    type="number"
                    value={newClient.defaultBillingRate}
                    onChange={(e) => setNewClient({...newClient, defaultBillingRate: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 5000"
                  />
                </div>
                
                {/* Payment Terms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={newClient.paymentTerms}
                    onChange={(e) => setNewClient({...newClient, paymentTerms: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Immediate">Immediate</option>
                    <option value="7 days">7 days</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setShowNewClientModal(false)}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Client'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">{selectedClient.name}</h3>
              <button 
                onClick={() => setSelectedClient(null)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              {/* Client Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contact Information</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedClient.email}</span>
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.phone}</span>
                      </div>
                    )}
                    {selectedClient.company && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span>{selectedClient.company}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Billing Information</h4>
                  <div className="space-y-1 text-sm">
                    {selectedClient.billingAddress && (
                      <div>
                        <span className="text-gray-500">Billing Address:</span>
                        <div className="ml-4 text-gray-700">{selectedClient.billingAddress}</div>
                      </div>
                    )}
                    {selectedClient.gstNumber && (
                      <div>
                        <span className="text-gray-500">GST Number:</span>
                        <span className="ml-2 text-gray-700">{selectedClient.gstNumber}</span>
                      </div>
                    )}
                    {selectedClient.defaultBillingRate && (
                      <div>
                        <span className="text-gray-500">Default Rate:</span>
                        <span className="ml-2 text-gray-700">₹{selectedClient.defaultBillingRate}/hr</span>
                      </div>
                    )}
                    {selectedClient.paymentTerms && (
                      <div>
                        <span className="text-gray-500">Payment Terms:</span>
                        <span className="ml-2 text-gray-700">{selectedClient.paymentTerms}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Billing Section */}
              <ClientBilling 
                clientId={selectedClient.id} 
                clientName={selectedClient.name}
                clientCompany={selectedClient.company}
                clientPhone={selectedClient.phone}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 