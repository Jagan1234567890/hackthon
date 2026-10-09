import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAnalysisResult,
  appendChatMessage,
  ChatMessage,
} from '@/lib/server/tempStorage';
import {
  answerVideoQuestion,
  VideoAnalysisReport,
} from '@/lib/server/videoEngine';

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

    const userMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'user',
      botType: 'videoAnalyzer',
      content: question,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    await appendChatMessage(userId, sessionId, userMsg);

    const report = analysisId
      ? await getAnalysisResult<VideoAnalysisReport>(userId, sessionId, analysisId)
      : null;

    let botResponse: {
      answer: string;
      confidence: number;
      jumpToSeconds?: number;
    } = {
      answer: 'Please upload a video file first so I can inspect frames and speech transcripts.',
      confidence: 0.85,
      jumpToSeconds: 0,
    };

    if (report) {
      botResponse = answerVideoQuestion(report, question);
    }

    const botMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'bot',
      botType: 'videoAnalyzer',
      content: botResponse.answer,
      timestamp: new Date().toISOString(),
      messageType: 'text',
      confidence: botResponse.confidence,
      metadata: { jumpToSeconds: botResponse.jumpToSeconds },
    };
    await appendChatMessage(userId, sessionId, botMsg);

    return NextResponse.json({
      success: true,
      botMessage: botMsg,
      jumpToSeconds: botResponse.jumpToSeconds,
      confidence: botResponse.confidence,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Video query failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
