import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  appendChatMessage,
  getSessionChatHistory,
  ChatMessage,
} from '@/lib/server/tempStorage';
import { processSiteAssistantMessage } from '@/lib/server/aiRouter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, message, botType = 'siteAssistant' } = body;

    if (!userId || !sessionId || !message) {
      return NextResponse.json(
        { error: 'userId, sessionId, and message are required.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const userMsgId = uuidv4();

    // 1. Record User Message
    const userMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      botType,
      content: message,
      timestamp: now,
      messageType: 'text',
    };
    await appendChatMessage(userId, sessionId, userMessage);

    // 2. Fetch recent conversation context (last 20 messages per specification)
    const history = await getSessionChatHistory(userId, sessionId);
    const recentContext = history.slice(-20);

    // 3. Process with Bot Engine
    let botResponsePayload;
    if (botType === 'siteAssistant') {
      botResponsePayload = await processSiteAssistantMessage(message, recentContext);
    } else {
      // General prompt fallback when not specifically querying a file
      botResponsePayload = {
        content: `I am ${botType}. Please upload a media file above so I can perform deep multimodal forensic analysis and answer questions with exact timestamps and calibrated confidence!`,
        messageType: 'text' as const,
        confidence: 0.92,
        quickReplies: ['How do I upload?', 'Supported formats', 'Back to Site Assistant'],
      };
    }

    // 4. Record Bot Response
    const botMsgId = uuidv4();
    const botMessage: ChatMessage = {
      id: botMsgId,
      sender: 'bot',
      botType,
      content: botResponsePayload.content,
      timestamp: new Date().toISOString(),
      messageType: botResponsePayload.messageType,
      quickReplies: botResponsePayload.quickReplies,
      metadata: botResponsePayload.metadata,
      confidence: botResponsePayload.confidence,
    };
    await appendChatMessage(userId, sessionId, botMessage);

    return NextResponse.json({
      success: true,
      botMessage,
      routeRedirect: botResponsePayload.routeRedirect,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Chat error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
