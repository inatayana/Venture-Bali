/**
 * WhatsApp Business API Client
 * Handles sending and receiving messages via WhatsApp Business API
 */

export interface WhatsAppMessage {
  messaging_product: 'whatsapp';
  to: string;
  text?: { body: string };
  type?: 'text' | 'interactive' | 'template';
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: 'whatsapp';
      metadata: { display_phone_number: string; phone_number_id: string };
      contacts?: Array<{ profile: { name: string }; wa_id: string }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        type: 'text' | 'image' | 'document' | 'interactive';
        text?: { body: string };
        interactive?: { button_reply: { id: string; title: string } };
      }>;
      statuses?: Array<{
        id: string;
        status: 'sent' | 'delivered' | 'read' | 'failed';
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: string;
  }>;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
  }

  /**
   * Send a text message to a WhatsApp user
   */
  async sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accessToken) {
      return { success: false, error: 'WhatsApp access token not configured' };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const body: WhatsAppMessage = {
      messaging_product: 'whatsapp',
      to,
      text: { body: message },
      type: 'text',
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData?.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send a list message (interactive) with options
   */
  async sendListMessage(
    to: string, 
    header: string, 
    body: string, 
    buttonTitle: string, 
    sections: Array<{ title: string; rows: Array<{ id: string; title: string; description?: string }> }>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.accessToken) {
      return { success: false, error: 'WhatsApp access token not configured' };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    
    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: header },
        body: { text: body },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: { id: 'show_list', title: buttonTitle },
            },
          ],
        },
      },
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData?.error?.message || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, messageId: data?.messages?.[0]?.id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Verify webhook signature
   */
  verifySignature(signature: string, body: string): boolean {
    const expectedSignature = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';
    if (!signature || !expectedSignature) return false;
    
    // Simple verification - in production use HMAC
    return signature.includes(expectedSignature);
  }

  /**
   * Parse incoming webhook payload
   */
  parseWebhook(body: any): WhatsAppWebhookEntry[] {
    if (!body || !Array.isArray(body.entry)) return [];
    return body.entry as WhatsAppWebhookEntry[];
  }

  /**
   * Extract text messages from webhook
   */
  extractMessages(webhook: WhatsAppWebhookEntry): Array<{ from: string; text: string; messageId: string }> {
    const messages: Array<{ from: string; text: string; messageId: string }> = [];
    
    for (const change of webhook.changes || []) {
      const value = change.value;
      if (value?.messages) {
        for (const msg of value.messages) {
          if (msg.type === 'text' && msg.text?.body) {
            messages.push({
              from: msg.from,
              text: msg.text.body,
              messageId: msg.id,
            });
          }
        }
      }
    }
    
    return messages;
  }
}

// Export singleton instance
export const whatsappClient = new WhatsAppClient();