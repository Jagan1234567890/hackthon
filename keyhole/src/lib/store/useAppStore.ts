'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface UserState {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  authProvider: 'local' | 'google' | 'github';
  lastLogin?: string;
}

export interface ChatMessageUI {
  id: string;
  sender: 'user' | 'bot' | 'system';
  botType: 'siteAssistant' | 'imageAnalyzer' | 'videoAnalyzer' | 'audioAnalyzer';
  content: string;
  timestamp: string;
  messageType?: 'text' | 'code' | 'card' | 'links' | 'quickReplies';
  quickReplies?: string[];
  metadata?: Record<string, unknown>;
  confidence?: number;
  routeRedirect?: {
    bot: string;
    url: string;
    label: string;
  };
}

interface AppStore {
  user: UserState | null;
  accessToken: string | null;
  sessionId: string;
  activeBotTab: 'siteAssistant' | 'imageAnalyzer' | 'videoAnalyzer' | 'audioAnalyzer';
  chatMessages: Record<string, ChatMessageUI[]>;
  unreadCount: number;
  isWidgetOpen: boolean;
  isFullScreen: boolean;
  theme: 'dark' | 'light';
  soundEnabled: boolean;

  // Actions
  setUser: (user: UserState | null, token?: string | null) => void;
  setSessionId: (id: string) => void;
  setActiveBotTab: (tab: 'siteAssistant' | 'imageAnalyzer' | 'videoAnalyzer' | 'audioAnalyzer') => void;
  addMessage: (bot: string, msg: ChatMessageUI) => void;
  setMessages: (bot: string, msgs: ChatMessageUI[]) => void;
  clearMessages: (bot?: string) => void;
  setWidgetOpen: (open: boolean) => void;
  setFullScreen: (fs: boolean) => void;
  toggleTheme: () => void;
  toggleSound: () => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  accessToken: null,
  sessionId: '',
  activeBotTab: 'siteAssistant',
  chatMessages: {
    siteAssistant: [],
    imageAnalyzer: [],
    videoAnalyzer: [],
    audioAnalyzer: [],
  },
  unreadCount: 0,
  isWidgetOpen: false,
  isFullScreen: false,
  theme: 'dark',
  soundEnabled: true,

  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('keyhole_user', JSON.stringify(user));
        if (token) localStorage.setItem('keyhole_access_token', token);
      } else {
        localStorage.removeItem('keyhole_user');
        localStorage.removeItem('keyhole_access_token');
      }
    }
    set({ user, accessToken: token || get().accessToken });
  },

  setSessionId: (id) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('keyhole_session_id', id);
    }
    set({ sessionId: id });
  },

  setActiveBotTab: (tab) => set({ activeBotTab: tab }),

  addMessage: (bot, msg) => {
    const current = get().chatMessages[bot] || [];
    const isWidgetOpen = get().isWidgetOpen;
    const isAssistant = bot === 'siteAssistant';
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [bot]: [...current, msg],
      },
      unreadCount:
        !isWidgetOpen && isAssistant && msg.sender === 'bot'
          ? state.unreadCount + 1
          : state.unreadCount,
    }));
  },

  setMessages: (bot, msgs) => {
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [bot]: msgs,
      },
    }));
  },

  clearMessages: (bot) => {
    if (bot) {
      set((state) => ({
        chatMessages: { ...state.chatMessages, [bot]: [] },
      }));
    } else {
      set({
        chatMessages: {
          siteAssistant: [],
          imageAnalyzer: [],
          videoAnalyzer: [],
          audioAnalyzer: [],
        },
      });
    }
  },

  setWidgetOpen: (open) => set({ isWidgetOpen: open, unreadCount: open ? 0 : get().unreadCount }),
  setFullScreen: (fs) => set({ isFullScreen: fs }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  logout: async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('keyhole_user');
      localStorage.removeItem('keyhole_access_token');
      sessionStorage.removeItem('keyhole_session_id');
    }
    set({
      user: null,
      accessToken: null,
      chatMessages: {
        siteAssistant: [],
        imageAnalyzer: [],
        videoAnalyzer: [],
        audioAnalyzer: [],
      },
    });
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },
}));
