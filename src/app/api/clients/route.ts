import { NextRequest, NextResponse } from "next/server";

// Dummy clients data with Indian context
const dummyClients = [
  {
    id: 'client1',
    name: 'Rajesh Sharma',
    email: 'rajesh@sharma.com',
    phone: '+91 98765 43210',
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
];

// GET /api/clients - Get all clients
export async function GET() {
  return NextResponse.json(dummyClients);
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Create a new dummy client
    const newClient = {
      id: `client-${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
} 