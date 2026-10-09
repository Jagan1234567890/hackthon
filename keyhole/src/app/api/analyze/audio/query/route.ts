import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import {
  getAnalysisResult,
  appendChatMessage,
  ChatMessage,
} from '@/lib/server/tempStorage';
import {
  answerAudioQuestion,
  AudioAnalysisReport,
} from '@/lib/server/audioEngine';

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
      botType: 'audioAnalyzer',
      content: question,
      timestamp: new Date().toISOString(),
      messageType: 'text',
    };
    await appendChatMessage(userId, sessionId, userMsg);

    const report = analysisId
      ? await getAnalysisResult<AudioAnalysisReport>(userId, sessionId, analysisId)
      : null;

    let botResponse: {
      answer: string;
      confidence: number;
      jumpToSeconds?: number;
    } = {
      answer: 'Please upload an audio file first so I can inspect speech, speakers, and waveforms.',
      confidence: 0.85,
      jumpToSeconds: 0,
    };

    if (report) {
      botResponse = answerAudioQuestion(report, question);
    }

    const botMsg: ChatMessage = {
      id: uuidv4(),
      sender: 'bot',
      botType: 'audioAnalyzer',
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
    const msg = err instanceof Error ? err.message : 'Audio query failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
