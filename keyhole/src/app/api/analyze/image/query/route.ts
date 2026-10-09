import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAnalysisResult,
  appendChatMessage,
  ChatMessage,
} from '@/lib/server/tempStorage';
import {
  answerImageQuestion,
  ImageAnalysisReport,
} from '@/lib/server/imageEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, sessionId, analysisId, question } = body;

    if (!userId || !sessionId || !question) {
      return NextResponse.json(
        { error: 'userId, sessionId, and question are required.' },
        { status: 400 }
      );
    }

    // 1. Log User Question
    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      botType: 'imageAnalyzer',
      content: question,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    await appendChatMessage(userId, sessionId, userMsg);

    // 2. Fetch cached report from Redis
    const report = analysisId
      ? await getAnalysisResult<ImageAnalysisReport>(userId, sessionId, analysisId)
      : null;

    let botResponse = {
      answer: 'Please upload an image first so I can inspect visual features and answer questions.',
      confidence: 0.85,
    };

    if (report) {
      botResponse = answerImageQuestion(report, question);
    }

    // 3. Log Bot Response
    const botMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'bot',
      botType: 'imageAnalyzer',
      content: botResponse.answer,
      timestamp: new Date().toISOString(),
      messageType: 'text',
      confidence: botResponse.confidence,
    };
    await appendChatMessage(userId, sessionId, botMsg);

    return NextResponse.json({
      success: true,
      botMessage: botMsg,
      confidence: botResponse.confidence,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Image query failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
