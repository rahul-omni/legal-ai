

import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Business API credentials from .env file
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v22.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();
    
    // Validate input
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Validate configuration
    if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return NextResponse.json(
        { error: 'WhatsApp access token && Whatsapp phone number Id not configured. Check your environment variables.' },
        { status: 500 }
      );
    }
    
    // In your WhatsApp API route (/api/whatsapp):
let formattedPhone = phoneNumber.replace(/\D/g, ''); // Remove all non-digit characters

// Add + if missing (but has country code)
if (!formattedPhone.startsWith('+')) {
  // If starts with country code (91, 92, etc.)
  if (formattedPhone.match(/^[1-9]\d{9,14}$/)) {
    formattedPhone = '+' + formattedPhone;
  } else {
    return NextResponse.json(
      { error: 'Phone number must include country code (e.g. 919991910535 or +919991910535)' },
      { status: 400 }
    );
  }
}
    
    
    // Prepare the request body
    const requestBody = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'text',
      text: {
        preview_url: false,
        body: message
      }
    };
    
    // Construct the API endpoint URL
    const apiUrl = WHATSAPP_API_URL.replace(/\/+$/, '');
    const endpoint = `${apiUrl}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    // Make the API request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN.trim()}`
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error:', {
        endpoint,
        requestBody,
        errorData
      });
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to send WhatsApp message' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      messageId: data.messages[0]?.id,
      recipient: formattedPhone, 
      message: {
        content: message,
        preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}