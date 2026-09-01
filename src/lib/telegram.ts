/**
 * Telegram Bot API Client
 * Handles sending and receiving messages via Telegram Bot API
 */

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string; last_name?: string; username?: string };
    chat: { id: number; type: string };
    date: number;
    text?: string;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
}

export interface TelegramMessage {
  chat_id: number | string;
  text?: string;
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  reply_markup?: {
    inline_keyboard?: Array<Array<{ text: string; callback_data: string }>>;
    keyboard?: Array<Array<{ text: string }>>;
    remove_keyboard?: boolean;
  };
  reply_to_message_id?: number;
}

export class TelegramClient {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  /**
   * Send a text message to a Telegram chat
   */
  async sendMessage(
    chatId: number | string, 
    text: string, 
    options?: { parseMode?: 'HTML' | 'Markdown'; replyMarkup?: TelegramMessage['reply_markup'] }
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: 'Telegram bot token not configured' };
    }

    const payload: TelegramMessage = {
      chat_id: chatId,
      text,
      parse_mode: options?.parseMode,
      reply_markup: options?.replyMarkup,
    };

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData?.description || `HTTP ${response.status}` 
        };
      }

      const data = await response.json();
      return { success: true, messageId: data?.result?.message_id };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Send a message with inline keyboard buttons
   */
  async sendKeyboardMessage(
    chatId: number | string,
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>,
    parseMode?: 'HTML' | 'Markdown'
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    return this.sendMessage(chatId, text, {
      parseMode,
      replyMarkup: { inline_keyboard: buttons },
    });
  }

  /**
   * Answer a callback query
   */
  async answerCallbackQuery(
    callbackQueryId: string,
    text?: string,
    options?: { showAlert?: boolean }
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.botToken) {
      return { success: false, error: 'Telegram bot token not configured' };
    }

    const payload = {
      callback_query_id: callbackQueryId,
      text: text || '',
      show_alert: options?.showAlert || false,
    };

    try {
      const response = await fetch(`${this.baseUrl}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: errorData?.description || `HTTP ${response.status}` 
        };
      }

      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Unknown error' 
      };
    }
  }

  /**
   * Parse webhook payload
   */
  parseWebhook(body: any): TelegramUpdate[] {
    if (!body || !Array.isArray(body)) return [];
    return body as TelegramUpdate[];
  }

  /**
   * Extract text messages from update
   */
  extractMessages(updates: TelegramUpdate[]): Array<{ chatId: number; text: string; from: { id: number; name: string } }> {
    const messages: Array<{ chatId: number; text: string; from: { id: number; name: string } }> = [];
    
    for (const update of updates) {
      if (update.message?.text) {
        const from = update.message.from;
        messages.push({
          chatId: update.message.chat.id,
          text: update.message.text,
          from: { id: from.id, name: from.first_name },
        });
      }
    }
    
    return messages;
  }

  /**
   * Send a menu with options
   */
  async sendMenu(
    chatId: number | string,
    message: string,
    options: Array<{ text: string; callback_data: string }>
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    // Group options into rows of 2-3 buttons
    const rows: Array<Array<{ text: string; callback_data: string }>> = [];
    for (let i = 0; i < options.length; i += 2) {
      rows.push(options.slice(i, i + 2));
    }
    
    return this.sendKeyboardMessage(chatId, message, rows);
  }
}

// Export singleton instance
export const telegramClient = new TelegramClient();