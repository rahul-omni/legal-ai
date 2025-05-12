import { useState } from 'react';
import { DollarSign, FileText, Clock, Calendar, Download, Printer, Send, Plus, X, Loader2 } from 'lucide-react';
import { useToast } from './ui/toast';

interface BillingProps {
  clientId: string;
  caseId: string;
  clientName: string;
  caseName: string;
  billingRate: number;
  billingType: string;
}

export function BillingSection({ clientId, caseId, clientName, caseName, billingRate, billingType }: BillingProps) {
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  
  // Dummy invoices
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-001',
      date: '2024-05-15',
      amount: 25000,
      status: 'Paid',
      dueDate: '2024-06-15',
    },
    {
      id: 'INV-002',
      date: '2024-06-01',
      amount: 35000,
      status: 'Pending',
      dueDate: '2024-07-01',
    }
  ]);
  
  const [newInvoice, setNewInvoice] = useState({
    description: `Professional fees for ${caseName}`,
    amount: billingRate,
    hours: billingType === 'Hourly' ? 5 : 0,
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  
  const handleCreateInvoice = () => {
    setIsSubmitting(true);
    
    // Simulate API call delay
    setTimeout(() => {
      const invoiceAmount = billingType === 'Hourly' 
        ? billingRate * newInvoice.hours 
        : newInvoice.amount;
        
      const createdInvoice = {
        id: `INV-00${invoices.length + 1}`,
        date: newInvoice.date,
        amount: invoiceAmount,
        status: 'Pending',
        dueDate: newInvoice.dueDate,
      };
      
      setInvoices([createdInvoice, ...invoices]);
      setShowNewInvoiceModal(false);
      setIsSubmitting(false);
      showToast('Invoice created successfully', 'success');
    }, 500);
  };
  
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Billing & Invoices</h3>
        <button 
          onClick={() => setShowNewInvoiceModal(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center gap-1 text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </button>
      </div>
      
      <div className="bg-white rounded-md border overflow-hidden">
        <div className="p-2 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex gap-4 text-xs">
            <div>
              <span className="text-gray-500">Billing Type:</span>
              <span className="font-medium ml-1">{billingType}</span>
            </div>
            <div>
              <span className="text-gray-500">Rate:</span>
              <span className="font-medium ml-1">
                {billingType === 'Hourly' 
                  ? `₹${billingRate}/hr` 
                  : billingType === 'Fixed' 
                    ? `₹${billingRate} (Fixed)` 
                    : 'Contingency'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setShowNewInvoiceModal(true)}
            className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1 text-xs hover:bg-blue-700"
          >
            <Plus className="w-3 h-3" />
            New Invoice
          </button>
        </div>
        
        <div className="divide-y divide-gray-100">
          {invoices.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500">
              <FileText className="w-5 h-5 mx-auto mb-1 text-gray-300" />
              <p>No invoices yet</p>
            </div>
          ) : (
            <>
              {/* Invoice Header */}
              <div className="grid grid-cols-12 gap-2 py-1.5 px-3 text-xs font-medium text-gray-500 bg-gray-50">
                <div className="col-span-2">Invoice #</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Due Date</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              
              {/* Invoice Items */}
              {invoices.map(invoice => (
                <div key={invoice.id} className="grid grid-cols-12 gap-2 py-1.5 px-3 text-xs items-center hover:bg-gray-50">
                  <div className="col-span-2 font-medium">{invoice.id}</div>
                  <div className="col-span-2">{new Date(invoice.date).toLocaleDateString()}</div>
                  <div className="col-span-2">{new Date(invoice.dueDate).toLocaleDateString()}</div>
                  <div className="col-span-2">₹{invoice.amount.toLocaleString()}</div>
                  <div className="col-span-2">
                    <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                      ${invoice.status === 'Paid' ? 'bg-green-100 text-green-800' : 
                        invoice.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1">
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Download">
                      <Download className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Print">
                      <Printer className="w-3 h-3" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded" title="Send">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      
      {/* New Invoice Modal */}
      {showNewInvoiceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">Create New Invoice</h3>
              <button 
                onClick={() => setShowNewInvoiceModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Client</div>
                <div className="font-medium">{clientName}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-1">Case</div>
                <div className="font-medium">{caseName}</div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice({...newInvoice, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
                
                {billingType === 'Hourly' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours Worked
                    </label>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={newInvoice.hours}
                        onChange={(e) => setNewInvoice({...newInvoice, hours: parseFloat(e.target.value) || 0})}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="ml-2 text-sm text-gray-500">
                        Total: ₹{(billingRate * newInvoice.hours).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={newInvoice.amount}
                      onChange={(e) => setNewInvoice({...newInvoice, amount: parseFloat(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={newInvoice.date}
                        onChange={(e) => setNewInvoice({...newInvoice, date: e.target.value})}
                        className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="date"
                        value={newInvoice.dueDate}
                        onChange={(e) => setNewInvoice({...newInvoice, dueDate: e.target.value})}
                        className="w-full pl-10 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-lg">
              <button 
                onClick={() => setShowNewInvoiceModal(false)}
                className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateInvoice}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 