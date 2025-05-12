import { NextRequest, NextResponse } from "next/server";

// Dummy cases data with Indian context
const dummyCases = [
  {
    id: '1',
    title: 'Sharma vs State Bank of India',
    number: 'CWP-1234-2024',
    client: {
      id: 'client1',
      name: 'Rajesh Sharma',
      email: 'rajesh@sharma.com',
      company: 'Sharma Enterprises Pvt. Ltd.'
    },
    clientId: 'client1',
    status: 'Active',
    court: 'Delhi High Court',
    nextHearing: '2024-06-15',
    practice: 'Banking',
    tags: ['High Priority', 'Commercial'],
    billingRate: 5000,
    billingType: 'Hourly',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'TCS vs Income Tax Department',
    number: 'ITA-789-2024',
    client: {
      id: 'client2',
      name: 'Tata Consultancy Services',
      email: 'legal@tcs.com',
      company: 'Tata Consultancy Services Ltd.'
    },
    clientId: 'client2',
    status: 'Pending',
    court: 'ITAT Mumbai',
    nextHearing: '2024-06-20',
    practice: 'Tax',
    tags: ['Corporate', 'Tax Dispute'],
    billingRate: 100000,
    billingType: 'Fixed',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// GET /api/cases - Get all cases
export async function GET() {
  return NextResponse.json(dummyCases);
}

// POST /api/cases - Create a new case
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Find client for the case
    const clientId = data.clientId;
    const client = {
      id: clientId,
      name: clientId === 'client1' ? 'Rajesh Sharma' : 
            clientId === 'client2' ? 'Tata Consultancy Services' : 
            clientId === 'client3' ? 'Priya Patel' : 
            clientId === 'client4' ? 'Aditya Birla Group' : 
            clientId === 'client5' ? 'Sundar Krishnan' : 'Unknown Client',
      email: clientId === 'client1' ? 'rajesh@sharma.com' : 
             clientId === 'client2' ? 'legal@tcs.com' : 
             clientId === 'client3' ? 'priya.patel@gmail.com' : 
             clientId === 'client4' ? 'legal@adityabirla.com' : 
             clientId === 'client5' ? 'sundar.k@outlook.com' : 'unknown@example.com',
      company: clientId === 'client1' ? 'Sharma Enterprises Pvt. Ltd.' : 
               clientId === 'client2' ? 'Tata Consultancy Services Ltd.' : 
               clientId === 'client4' ? 'Aditya Birla Group' : 
               clientId === 'client5' ? 'Krishna Textiles' : ''
    };
    
    // Create a new dummy case
    const newCase = {
      id: `case-${Date.now()}`,
      ...data,
      client,
      tags: data.tags ? JSON.parse(data.tags) : [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return NextResponse.json(
      { error: "Failed to create case" },
      { status: 500 }
    );
  }
} 