/**
 * WhatsApp Business API Service
 * 
 * This service handles communication with the WhatsApp Business API
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api/
 */

// Use environment variables from .env file
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v17.0';
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

interface WhatsAppMessageResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export async function sendWhatsAppMessage(
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
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
    
    // Make the API request
    const response = await fetch(
      `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to send WhatsApp message');
    }
    
    const data: WhatsAppMessageResponse = await response.json();
    
    return {
      success: true,
      messageId: data.messages[0]?.id
    };
  } catch (error) {
    console.error('WhatsApp API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
} 