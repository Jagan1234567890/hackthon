'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  X,
  Maximize2,
  Minimize2,
  Send,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Paperclip,
  ExternalLink,
  ChevronRight,
  Bot,
  User as UserIcon,
  Moon,
  Sun,
  Copy,
  Check,
} from 'lucide-react';
import { useAppStore, ChatMessageUI } from '@/lib/store/useAppStore';

export function SiteAssistantWidget() {
  const router = useRouter();
  const {
    user,
    sessionId,
    chatMessages,
    unreadCount,
    isWidgetOpen,
    isFullScreen,
    soundEnabled,
    theme,
    setWidgetOpen,
    setFullScreen,
    addMessage,
    clearMessages,
    toggleSound,
    toggleTheme,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = chatMessages.siteAssistant || [];

  // Auto scroll to bottom
  useEffect(() => {
    if (isWidgetOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isWidgetOpen, isTyping]);

  // Initial welcome greeting if empty
  useEffect(() => {
    if (messages.length === 0 && sessionId) {
      addMessage('siteAssistant', {
        id: 'welcome',
        sender: 'bot',
        botType: 'siteAssistant',
        content:
          'Hi! I am SiteAssistant. I help you navigate KEYHOLE, explain our dual-storage privacy architecture, and route you to Image, Video, or Audio analysis tools. What would you like to explore?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messageType: 'quickReplies',
        quickReplies: [
          'Analyze an Image (/analyze/image)',
          'Transcribe a Video (/analyze/video)',
          'Inspect an Audio Clip (/analyze/audio)',
          'Explain Temporary Privacy',
        ],
        confidence: 0.98,
      });
    }
  }, [sessionId, messages.length, addMessage]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg: ChatMessageUI = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      botType: 'siteAssistant',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      messageType: 'text',
    };

    addMessage('siteAssistant', userMsg);
    if (!textToSend) setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || 'anonymous',
          sessionId,
          message: query,
          botType: 'siteAssistant',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botMsg = data.botMessage;
        addMessage('siteAssistant', {
          ...botMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          routeRedirect: data.routeRedirect,
        });

        // Play audio chime if enabled
        if (soundEnabled && typeof Audio !== 'undefined') {
          try {
            // gentle synthesized chime
            const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
          } catch {
            // ignore
          }
        }
      }
    } catch {
      addMessage('siteAssistant', {
        id: 'err_' + Date.now(),
        sender: 'bot',
        botType: 'siteAssistant',
        content: "I'm having trouble connecting right now. Please try again or navigate using the top menu.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        confidence: 0.5,
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileDrop = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'svg'].includes(ext || '')) {
      router.push('/analyze/image');
      setWidgetOpen(false);
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'flv', 'wmv'].includes(ext || '')) {
      router.push('/analyze/video');
      setWidgetOpen(false);
    } else if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'].includes(ext || '')) {
      router.push('/analyze/audio');
      setWidgetOpen(false);
    } else {
      handleSend(`I have a file named "${file.name}". Which analysis bot should I use?`);
    }
  };

  return (
    <>
      {/* Minimized Floating Circular Button */}
      {!isWidgetOpen && (
        <button
          id="site-assistant-trigger"
          onClick={() => setWidgetOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 p-3.5 rounded-full bg-[oklch(0.62_0.22_295)] text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-purple-400/40"
          aria-label="Open SiteAssistant chat"
        >
          <div className="relative">
            <Sparkles className="w-6 h-6 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white shadow-md">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-medium text-sm pr-1">
            SiteAssistant
          </span>
        </button>
      )}

      {/* Expanded / Full-Screen Chat Widget */}
      {isWidgetOpen && (
        <div
          className={`fixed z-50 flex flex-col bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
            isFullScreen
              ? 'inset-0 w-full h-full rounded-none'
              : 'bottom-6 right-6 w-[94vw] sm:w-[420px] h-[620px] max-h-[85vh] rounded-2xl'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[oklch(0.62_0.22_295/20%)] border border-[oklch(0.62_0.22_295/40%)] flex items-center justify-center text-[oklch(0.62_0.22_295)]">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">SiteAssistant</h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-[oklch(0.66_0.015_280)] font-mono">
                  Session: {sessionId.substring(0, 10)}...
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[oklch(0.66_0.015_280)]">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
                title={soundEnabled ? 'Mute sound' : 'Enable sound'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={() => clearMessages('siteAssistant')}
                className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="New conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFullScreen(!isFullScreen)}
                className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
                title={isFullScreen ? 'Exit full screen' : 'Expand full screen'}
              >
                {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setWidgetOpen(false)}
                className="p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
                title="Minimize chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drag Overlay Notice */}
          {dragActive && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md border-2 border-dashed border-[oklch(0.62_0.22_295)] text-center p-6">
              <Paperclip className="w-12 h-12 text-[oklch(0.62_0.22_295)] mb-3 animate-bounce" />
              <p className="text-white font-medium">Drop media file to auto-route</p>
              <p className="text-xs text-[oklch(0.66_0.015_280)] mt-1">
                Images → ImageAnalyzer · Videos → VideoAnalyzer · Audio → AudioAnalyzer
              </p>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[oklch(0.62_0.22_295/20%)] border border-[oklch(0.62_0.22_295/40%)] flex items-center justify-center text-[oklch(0.62_0.22_295)] shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl p-3.5 text-sm ${
                    m.sender === 'user'
                      ? 'bg-[oklch(0.62_0.22_295)] text-white rounded-tr-none'
                      : 'bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/50%)] text-white rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>

                  {/* Route Redirect Card */}
                  {m.routeRedirect && (
                    <div className="mt-3 p-3 rounded-xl bg-[oklch(0.15_0.01_280)] border border-[oklch(0.62_0.22_295/40%)] flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-[oklch(0.62_0.22_295)]">
                          {m.routeRedirect.bot}
                        </div>
                        <div className="text-[11px] text-[oklch(0.66_0.015_280)]">
                          Click to switch to specialized analysis
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          router.push(m.routeRedirect?.url || '/dashboard');
                          setWidgetOpen(false);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[oklch(0.62_0.22_295)] text-white text-xs font-medium hover:brightness-110 active:scale-95 transition-all"
                      >
                        {m.routeRedirect.label}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Quick-Reply Buttons */}
                  {m.quickReplies && m.quickReplies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                      {m.quickReplies.map((qr, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(qr)}
                          className="px-2.5 py-1 rounded-full text-xs bg-white/5 hover:bg-white/15 border border-white/10 text-white transition-all text-left"
                        >
                          {qr}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[oklch(0.66_0.015_280)]">
                    <div className="flex items-center gap-2">
                      <span>{m.timestamp}</span>
                      {m.sender === 'bot' && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            setCopiedMsgId(m.id);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          className="hover:text-white transition-colors flex items-center gap-0.5"
                          title="Copy message to clipboard"
                        >
                          {copiedMsgId === m.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {m.confidence !== undefined && (
                      <span className="font-mono">
                        {(m.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <UserIcon className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-full bg-[oklch(0.62_0.22_295/20%)] flex items-center justify-center text-[oklch(0.62_0.22_295)]">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-[oklch(0.11_0.008_280)] border border-[oklch(0.22_0.01_280/50%)] rounded-2xl rounded-tl-none p-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area & File Drop Trigger */}
          <div className="p-3 border-t border-[oklch(0.22_0.01_280/40%)] bg-[oklch(0.11_0.008_280)]">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileDrop(e.target.files[0]);
              }}
            />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-xl text-[oklch(0.66_0.015_280)] hover:text-white hover:bg-white/10 transition-colors"
                title="Drop or attach file to route"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about platform or describe media..."
                className="flex-1 bg-[oklch(0.08_0.005_280)] border border-[oklch(0.22_0.01_280/60%)] rounded-xl px-3.5 py-2 text-sm text-white placeholder-[oklch(0.66_0.015_280)] focus:outline-none focus:border-[oklch(0.62_0.22_295)]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 rounded-xl bg-[oklch(0.62_0.22_295)] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
