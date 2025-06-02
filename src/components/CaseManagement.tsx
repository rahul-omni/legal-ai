import {
  Edit,
  FileText,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface Case {
  id: string;
  title: string;
  number: string;
  client: string;
  clientId: string;
  status: "Active" | "Pending" | "Closed";
  court: string;
  nextHearing: string;
  practice: string;
  tags: string[];
  billingRate?: number;
  billingType?: "Hourly" | "Fixed" | "Contingency";
  createdAt: string;
  updatedAt: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

export function CaseManagement() {
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dummy clients with Indian context
  const clients: Client[] = [
    {
      id: "client1",
      name: "Rajesh Sharma",
      email: "rajesh@sharma.com",
      company: "Sharma Enterprises Pvt. Ltd.",
    },
    {
      id: "client2",
      name: "Tata Consultancy Services",
      email: "legal@tcs.com",
      company: "Tata Consultancy Services Ltd.",
    },
    { id: "client3", name: "Priya Patel", email: "priya.patel@gmail.com" },
    {
      id: "client4",
      name: "Aditya Birla Group",
      email: "legal@adityabirla.com",
      company: "Aditya Birla Group",
    },
    {
      id: "client5",
      name: "Sundar Krishnan",
      email: "sundar.k@outlook.com",
      company: "Krishna Textiles",
    },
  ];

  // Initial dummy cases with Indian context
  const [cases, setCases] = useState<Case[]>([
    {
      id: "1",
      title: "Sharma vs State Bank of India",
      number: "CWP-1234-2024",
      client: "Rajesh Sharma",
      clientId: "client1",
      status: "Active",
      court: "Delhi High Court",
      nextHearing: "2024-06-15",
      practice: "Banking",
      tags: ["High Priority", "Commercial"],
      billingRate: 5000,
      billingType: "Hourly",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "TCS vs Income Tax Department",
      number: "ITA-789-2024",
      client: "Tata Consultancy Services",
      clientId: "client2",
      status: "Pending",
      court: "ITAT Mumbai",
      nextHearing: "2024-06-20",
      practice: "Tax",
      tags: ["Corporate", "Tax Dispute"],
      billingRate: 100000,
      billingType: "Fixed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Patel Property Dispute",
      number: "CS-567-2024",
      client: "Priya Patel",
      clientId: "client3",
      status: "Active",
      court: "Ahmedabad Civil Court",
      nextHearing: "2024-06-25",
      practice: "Real Estate",
      tags: ["Property", "Family"],
      billingRate: 3500,
      billingType: "Hourly",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      title: "Aditya Birla Group Merger Approval",
      number: "NCLT-456-2024",
      client: "Aditya Birla Group",
      clientId: "client4",
      status: "Active",
      court: "NCLT Kolkata",
      nextHearing: "2024-07-10",
      practice: "Corporate",
      tags: ["Merger", "Regulatory"],
      billingRate: 150000,
      billingType: "Fixed",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [newCase, setNewCase] = useState<Partial<Case>>({
    title: "",
    number: "",
    clientId: "",
    status: "Active",
    court: "",
    practice: "",
    billingType: "Hourly",
    billingRate: 250,
  });

  const handleCreateCase = () => {
    // Validate required fields
    if (!newCase.title || !newCase.number || !newCase.clientId) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Find the selected client
    const selectedClient = clients.find((c) => c.id === newCase.clientId);
    if (!selectedClient) return;

    setIsSubmitting(true);

    // Simulate API call delay
    setTimeout(() => {
      // Create new case with dummy ID and timestamps
      const createdCase: Case = {
        id: `case-${Date.now()}`,
        title: newCase.title || "",
        number: newCase.number || "",
        client: selectedClient.name,
        clientId: selectedClient.id,
        status: (newCase.status as "Active" | "Pending" | "Closed") || "Active",
        court: newCase.court || "",
        nextHearing:
          newCase.nextHearing || new Date().toISOString().split("T")[0],
        practice: newCase.practice || "",
        tags: [],
        billingRate: newCase.billingRate,
        billingType: newCase.billingType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add the new case to the state
      setCases((prevCases) => [createdCase, ...prevCases]);

      // Close the modal and reset form
      setShowNewCaseModal(false);
      setNewCase({
        title: "",
        number: "",
        clientId: "",
        status: "Active",
        court: "",
        practice: "",
        billingType: "Hourly",
        billingRate: 250,
      });

      setIsSubmitting(false);
      toast.success("Case created successfully");
    }, 500);
  };

  // Filter cases based on search query
  const filteredCases = cases.filter((case_) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      case_.title.toLowerCase().includes(searchLower) ||
      case_.number.toLowerCase().includes(searchLower) ||
      case_.client.toLowerCase().includes(searchLower) ||
      case_.court.toLowerCase().includes(searchLower) ||
      case_.practice.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            Case Management
          </h1>
          <button
            onClick={() => setShowNewCaseModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
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

      {/* Cases List */}
      <div className="flex-1 p-6 overflow-auto">
        {cases.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <FileText className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg">No cases found</p>
            <p className="text-sm mt-1">
              Create your first case to get started
            </p>
            <button
              onClick={() => setShowNewCaseModal(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Case
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 mt-4">
            {filteredCases.map((case_) => (
              <div
                key={case_.id}
                className="bg-white border rounded-md overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start p-3 pb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">{case_.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {case_.number}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        case_.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : case_.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {case_.status}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                      {case_.billingType === "Hourly"
                        ? `₹${case_.billingRate}/hr`
                        : `₹${case_.billingRate}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 px-3 py-2 text-xs border-t bg-gray-50">
                  <div>
                    <p className="text-gray-500">Client</p>
                    <p className="font-medium truncate">{case_.client}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Court</p>
                    <p className="font-medium truncate">{case_.court}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Next Hearing</p>
                    <p className="font-medium">
                      {new Date(case_.nextHearing).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center px-3 py-2 border-t">
                  <div className="flex gap-1">
                    {case_.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {case_.tags.length > 2 && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                        +{case_.tags.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-3 border-b">
              <h3 className="text-base font-semibold">New Case</h3>
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Title */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Case Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCase.title}
                    onChange={(e) =>
                      setNewCase({ ...newCase, title: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Sharma vs State Bank of India"
                  />
                </div>

                {/* Case Number */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Case Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCase.number}
                    onChange={(e) =>
                      setNewCase({ ...newCase, number: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. CWP-1234-2024"
                  />
                </div>

                {/* Client */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newCase.clientId}
                    onChange={(e) =>
                      setNewCase({ ...newCase, clientId: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}{" "}
                        {client.company ? `(${client.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Court */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Court
                  </label>
                  <input
                    type="text"
                    value={newCase.court}
                    onChange={(e) =>
                      setNewCase({ ...newCase, court: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. Delhi High Court"
                  />
                </div>

                {/* Next Hearing */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Next Hearing Date
                  </label>
                  <input
                    type="date"
                    value={newCase.nextHearing}
                    onChange={(e) =>
                      setNewCase({ ...newCase, nextHearing: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                {/* Practice Area */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Practice Area
                  </label>
                  <select
                    value={newCase.practice}
                    onChange={(e) =>
                      setNewCase({ ...newCase, practice: e.target.value })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select practice area</option>
                    <option value="Banking">Banking</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Criminal">Criminal</option>
                    <option value="Family">Family</option>
                    <option value="Intellectual Property">
                      Intellectual Property
                    </option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Tax">Tax</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={newCase.status}
                    onChange={(e) =>
                      setNewCase({ ...newCase, status: e.target.value as any })
                    }
                    className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Billing Section */}
                <div className="col-span-2 mt-1 pt-2 border-t">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">
                    Billing Information
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Billing Type */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Billing Type
                      </label>
                      <select
                        value={newCase.billingType}
                        onChange={(e) =>
                          setNewCase({
                            ...newCase,
                            billingType: e.target.value as any,
                          })
                        }
                        className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Hourly">Hourly Rate</option>
                        <option value="Fixed">Fixed Fee</option>
                        <option value="Contingency">Contingency</option>
                      </select>
                    </div>

                    {/* Rate/Fee */}
                    {newCase.billingType !== "Contingency" && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          {newCase.billingType === "Hourly"
                            ? "Hourly Rate (₹)"
                            : "Fixed Fee (₹)"}
                        </label>
                        <input
                          type="number"
                          value={newCase.billingRate}
                          onChange={(e) =>
                            setNewCase({
                              ...newCase,
                              billingRate: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="e.g. 5000"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 p-3 border-t bg-gray-50 rounded-b-lg">
              <button
                onClick={() => setShowNewCaseModal(false)}
                className="px-3 py-1.5 text-xs border rounded-md text-gray-600 hover:bg-gray-100"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCase}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Case"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
