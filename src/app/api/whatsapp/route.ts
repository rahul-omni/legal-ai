import { NextRequest, NextResponse } from 'next/server';

// WhatsApp Business API credentials from .env file
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v22.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();
    
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }
    
    // Format phone number (remove spaces and ensure it has country code)
    let formattedPhone = phoneNumber.replace(/\s+/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+91' + formattedPhone.replace(/^0+/, '');
    }
    
    // Remove the '+' as WhatsApp API doesn't use it
    formattedPhone = formattedPhone.replace('+', '');
    
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
    
    // Fix the double slash issue in the URL if present
    const apiUrl = WHATSAPP_API_URL?.replace('//', '/');
    
    // Make the API request to WhatsApp Business API
    const response = await fetch(
      `${apiUrl}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN.trim()}`
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('WhatsApp API error response:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || 'Failed to send WhatsApp message' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('WhatsApp API success response:', data);
    
    return NextResponse.json({
      success: true,
      messageId: data.messages[0]?.id
    });
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error occurred' },
      { status: 500 }
    );
  }
} 