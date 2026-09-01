import { NextResponse } from 'next/server';
import { AgentService, AgentState } from '@/lib/agent';

export async function POST(request: Request) {
  try {
    const { message, sessionId, channel = 'web', language = 'id' } = await request.json();

    // Initialize or get agent session
    const agentState: AgentState = {
      sessionId: sessionId || `session_${Date.now()}`,
      channel: channel as 'whatsapp' | 'telegram' | 'web',
      language: language as 'id' | 'en' | 'ja' | 'zh',
      context: { intent: 'general_question' },
      lastAction: 'welcome',
      activeFlow: 'greeting',
    };

    const agent = new AgentService(agentState);
    const result = await agent.handleMessage(message);

    return NextResponse.json({
      success: true,
      data: result,
      sessionId: agentState.sessionId,
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process message' } },
      { status: 500 }
    );
  }
}