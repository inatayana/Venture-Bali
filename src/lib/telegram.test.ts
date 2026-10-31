import { TelegramClient } from './telegram';
import { formatAgentReply } from './agentReply';

describe('Telegram webhook parsing', () => {
  const client = new TelegramClient();

  it('accepts the single update object Telegram actually posts', () => {
    const update = { update_id: 1, message: { message_id: 2 } };
    expect(client.parseWebhook(update)).toEqual([update]);
  });

  it('accepts batched arrays and rejects junk', () => {
    expect(client.parseWebhook([{ update_id: 1 }])).toHaveLength(1);
    expect(client.parseWebhook(null)).toEqual([]);
    expect(client.parseWebhook('nope')).toEqual([]);
  });
});

describe('agent reply formatting', () => {
  it('uses a direct reply when present', () => {
    expect(formatAgentReply({ data: { reply: 'Hello there' }, next_action: 'continue_conversation' })).toBe(
      'Hello there',
    );
  });

  it('falls back to a readable line per next action', () => {
    expect(formatAgentReply({ data: {}, next_action: 'suggest_alternative_date' })).toContain(
      'another date',
    );
    expect(formatAgentReply({ data: null, next_action: 'show_menu' })).toContain('products');
  });

  it('renders slot lists from tool output', () => {
    const reply = formatAgentReply({
      data: { slots: [{ time: '08:00 AM', capacity: 10, booked: 4 }] },
      next_action: 'show_availability',
    });
    expect(reply).toContain('08:00 AM');
    expect(reply).toContain('6 left');
  });

  it('strips Markdown bold from policy text', () => {
    const reply = formatAgentReply({
      data: { policy: '**Refund Policy:** cancel 20%' },
      next_action: 'policy_shown',
    });
    expect(reply).not.toContain('**');
    expect(reply).toContain('Refund Policy:');
  });
});
