import { handleApiError } from "@/helper/handleApiError";
import {
  Calendar,
  Check,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface BillItem {
  description: string;
  amount: number;
  taxRate: number;
}

interface Bill {
  id: string;
  clientId: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  items: BillItem[];
  total: number;
  status: "Draft" | "Sent" | "Paid";
}

interface ClientBillingProps {
  clientId: string;
  clientName: string;
  clientorganization?: string;
  clientphone_no?: string;
}

export function ClientBilling({
  clientId,
  clientName,
  clientorganization,
  clientphone_no,
}: ClientBillingProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newBill, setNewBill] = useState<Partial<Bill>>({
    clientId,
    billDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [{ description: "Legal consultation", amount: 5000, taxRate: 18 }],
    status: "Draft",
  });

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedBillForMessage, setSelectedBillForMessage] =
    useState<Bill | null>(null);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const calculateTotal = (items: BillItem[] = []) => {
    return items.reduce((sum, item) => {
      const tax = (item.amount * item.taxRate) / 100;
      return sum + item.amount + tax;
    }, 0);
  };

  const handleAddItem = () => {
    if (!newBill.items) return;

    setNewBill({
      ...newBill,
      items: [...newBill.items, { description: "", amount: 0, taxRate: 18 }],
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!newBill.items) return;

    const updatedItems = [...newBill.items];
    updatedItems.splice(index, 1);

    setNewBill({
      ...newBill,
      items: updatedItems,
    });
  };

  const handleItemChange = (
    index: number,
    field: string,
    value: string | number
  ) => {
    if (!newBill.items) return;

    const updatedItems = [...newBill.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]:
        typeof value === "string" && field === "amount"
          ? parseFloat(value)
          : value,
    };

    setNewBill({
      ...newBill,
      items: updatedItems,
    });
  };

  const handleCreateBill = () => {
    if (!newBill.items || newBill.items.some((item) => !item.description)) {
      toast.error("Please fill in all item descriptions");
      return;
    }

    setIsSubmitting(true);

    // Generate bill number
    const billNumber = `INV-${new Date().getFullYear()}-${(bills.length + 1).toString().padStart(3, "0")}`;

    // Simulate API call delay
    setTimeout(() => {
      const createdBill: Bill = {
        id: `bill-${Date.now()}`,
        clientId,
        billNumber,
        billDate: newBill.billDate || new Date().toISOString().split("T")[0],
        dueDate: newBill.dueDate || "",
        items: newBill.items || [],
        total: calculateTotal(newBill.items),
        status: "Draft",
      };

      setBills([createdBill, ...bills]);
      setShowNewBillModal(false);
      setIsSubmitting(false);
      toast.success("Bill created successfully");

      // Reset form
      setNewBill({
        clientId,
        billDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        items: [
          { description: "Legal consultation", amount: 5000, taxRate: 18 },
        ],
        status: "Draft",
      });
    }, 500);
  };

  const markAsPaid = (billId: string) => {
    const updatedBills = bills.map((bill) =>
      bill.id === billId ? { ...bill, status: "Paid" as const } : bill
    );

    setBills(updatedBills);
    toast.success("Bill marked as paid");
  };

  const openWhatsAppModal = (bill: Bill) => {
    setSelectedBillForMessage(bill);

    // Create default message
    const defaultMessage = `Dear ${clientName},\n\nYour bill #${bill.billNumber} for ₹${bill.total.toLocaleString()} has been generated and is due on ${new Date(bill.dueDate).toLocaleDateString()}.\n\nThank you for your business.\n\nRegards,\nYour Law Firm`;

    setMessageText(defaultMessage);
    setShowWhatsAppModal(true);
  };

  const sendWhatsAppMessage = async () => {
    if (!clientphone_no) {
      toast.success("Client phone number is not available");
      return;
    }

    setSendingMessage(true);

    try {
      // Call our API endpoint
      const response = await fetch("/api/whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: clientphone_no,
          message: messageText,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send WhatsApp message");
      }

      const data = await response.json();

      // Update bill status to 'Sent' if it was 'Draft'
      if (selectedBillForMessage && selectedBillForMessage.status === "Draft") {
        const updatedBills = bills.map((bill) =>
          bill.id === selectedBillForMessage.id
            ? { ...bill, status: "Sent" as const }
            : bill
        );
        setBills(updatedBills);
      }

      setShowWhatsAppModal(false);
      toast.success("WhatsApp message sent successfully");
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
      handleApiError(error);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Billing</h3>
        <button
          onClick={() => setShowNewBillModal(true)}
          className="px-2 py-1 bg-blue-600 text-white rounded flex items-center gap-1 text-xs hover:bg-blue-700"
        >
          <Plus className="w-3 h-3" />
          New Bill
        </button>
      </div>

      {bills.length === 0 ? (
        <div className="text-center py-4 border rounded-md bg-gray-50">
          <FileText className="w-5 h-5 mx-auto mb-1 text-gray-300" />
          <p className="text-xs text-gray-500">No bills yet</p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-12 gap-2 py-1.5 px-3 text-xs font-medium text-gray-500 bg-gray-50 border-b">
            <div className="col-span-3">Bill #</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="divide-y divide-gray-100">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="grid grid-cols-12 gap-2 py-1.5 px-3 text-xs items-center"
              >
                <div className="col-span-3 font-medium">{bill.billNumber}</div>
                <div className="col-span-2">
                  {new Date(bill.billDate).toLocaleDateString()}
                </div>
                <div className="col-span-2">
                  {new Date(bill.dueDate).toLocaleDateString()}
                </div>
                <div className="col-span-2">₹{bill.total.toLocaleString()}</div>
                <div className="col-span-1">
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      bill.status === "Paid"
                        ? "bg-green-100 text-green-800"
                        : bill.status === "Sent"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <button
                    onClick={() => openWhatsAppModal(bill)}
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    title="Send via WhatsApp"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                  <button
                    className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {bill.status !== "Paid" && (
                    <button
                      onClick={() => markAsPaid(bill.id)}
                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                      title="Mark as Paid"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Bill Modal */}
      {showNewBillModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="text-base font-semibold">
                New Bill for {clientName}
              </h3>
              <button
                onClick={() => setShowNewBillModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Bill Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bill Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={newBill.billDate}
                      onChange={(e) =>
                        setNewBill({ ...newBill, billDate: e.target.value })
                      }
                      className="w-full pl-9 px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="date"
                      value={newBill.dueDate}
                      onChange={(e) =>
                        setNewBill({ ...newBill, dueDate: e.target.value })
                      }
                      className="w-full pl-9 px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Items */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    onClick={handleAddItem}
                    className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded flex items-center gap-1 hover:bg-gray-200"
                  >
                    <Plus className="w-3 h-3" />
                    Add Item
                  </button>
                </div>

                <div className="border rounded-md overflow-hidden">
                  {/* Item Header */}
                  <div className="grid grid-cols-12 gap-2 py-1.5 px-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Amount (₹)</div>
                    <div className="col-span-2">Tax (%)</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* Item Rows */}
                  <div className="divide-y divide-gray-100">
                    {newBill.items?.map((item, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 py-1.5 px-2 text-xs items-center"
                      >
                        <div className="col-span-6">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Item description"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            value={item.amount}
                            onChange={(e) =>
                              handleItemChange(index, "amount", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.taxRate}
                            onChange={(e) =>
                              handleItemChange(index, "taxRate", e.target.value)
                            }
                            className="w-full px-2 py-1 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2 text-right">
                          {newBill.items && newBill.items.length > 1 && (
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t bg-gray-50 p-2">
                    <div className="flex justify-end">
                      <div className="w-48">
                        <div className="flex justify-between py-1 text-xs font-medium">
                          <span>Total:</span>
                          <span>
                            ₹{calculateTotal(newBill.items).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowNewBillModal(false)}
                className="px-3 py-1.5 text-xs border rounded-md text-gray-600 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBill}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Bill"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Message Modal */}
      {showWhatsAppModal && selectedBillForMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                Send Bill via WhatsApp
              </h3>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">To</div>
                <div className="font-medium text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  {clientName}{" "}
                  {clientphone_no ? `(${clientphone_no})` : "(No phone number)"}
                </div>
                {!clientphone_no && (
                  <div className="mt-1 text-xs text-red-500">
                    No phone number available. Please update client information.
                  </div>
                )}
              </div>

              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Bill Details</div>
                <div className="bg-gray-50 p-2 rounded border text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Bill Number:</span>
                    <span className="font-medium">
                      {selectedBillForMessage.billNumber}
                    </span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      ₹{selectedBillForMessage.total.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date:</span>
                    <span className="font-medium">
                      {new Date(
                        selectedBillForMessage.dueDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={6}
                />
                <div className="mt-1 text-xs text-gray-500">
                  This message will be sent via the WhatsApp Business API.
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="px-3 py-1.5 text-xs border rounded-md text-gray-600 hover:bg-gray-100"
                disabled={sendingMessage}
              >
                Cancel
              </button>
              <button
                onClick={sendWhatsAppMessage}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-1"
                disabled={sendingMessage || !clientphone_no}
              >
                {sendingMessage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-3 h-3" />
                    Send via WhatsApp
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
