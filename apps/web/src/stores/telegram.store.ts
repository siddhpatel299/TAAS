import { create } from 'zustand';

export interface TelegramChat {
  id: string;
  title: string;
  type: 'user' | 'group' | 'supergroup' | 'channel';
  unreadCount: number;
  photoUrl?: string;
  lastMessage?: string;
  lastMessageDate?: string;
}

export interface TelegramMessageDocument {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export interface TelegramMessagePhoto {
  id: string;
  size: number;
}

export interface TelegramMessageVideo {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
}

export interface TelegramMessage {
  id: number;
  chatId: string;
  date: string;
  text?: string;
  fromName?: string;
  hasDocument: boolean;
  document?: TelegramMessageDocument;
  hasPhoto: boolean;
  photo?: TelegramMessagePhoto;
  hasVideo: boolean;
  video?: TelegramMessageVideo;
}

export interface ImportingFile {
  chatId: string;
  messageId: number;
  fileName: string;
  status: 'importing' | 'success' | 'error';
  error?: string;
  resultFileId?: string;
}

interface TelegramState {
  // Chats list
  chats: TelegramChat[];
  chatsLoading: boolean;
  chatsError: string | null;
  
  // Selected chat
  selectedChatId: string | null;
  
  // Messages for selected chat
  messages: TelegramMessage[];
  messagesLoading: boolean;
  messagesError: string | null;
  hasMoreMessages: boolean;
  
  // Import status (one at a time, per rules)
  importingFile: ImportingFile | null;
  
  // Actions
  setChats: (chats: TelegramChat[]) => void;
  setChatsLoading: (loading: boolean) => void;
  setChatsError: (error: string | null) => void;
  
  selectChat: (chatId: string | null) => void;
  
  setMessages: (messages: TelegramMessage[]) => void;
  appendMessages: (messages: TelegramMessage[]) => void;
  setMessagesLoading: (loading: boolean) => void;
  setMessagesError: (error: string | null) => void;
  setHasMoreMessages: (hasMore: boolean) => void;
  clearMessages: () => void;
  
  setImportingFile: (file: ImportingFile | null) => void;
  updateImportStatus: (status: ImportingFile['status'], error?: string, resultFileId?: string) => void;
  
  reset: () => void;
}

const initialState = {
  chats: [],
  chatsLoading: false,
  chatsError: null,
  selectedChatId: null,
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: false,
  importingFile: null,
};

export const useTelegramStore = create<TelegramState>((set) => ({
  ...initialState,

  setChats: (chats) => set({ chats }),
  setChatsLoading: (loading) => set({ chatsLoading: loading }),
  setChatsError: (error) => set({ chatsError: error }),

  selectChat: (chatId) => set({ 
    selectedChatId: chatId,
    messages: [],
    messagesError: null,
    hasMoreMessages: false,
  }),

  setMessages: (messages) => set({ messages }),
  appendMessages: (newMessages) => set((state) => ({
    messages: [...state.messages, ...newMessages],
  })),
  setMessagesLoading: (loading) => set({ messagesLoading: loading }),
  setMessagesError: (error) => set({ messagesError: error }),
  setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),
  clearMessages: () => set({ messages: [], hasMoreMessages: false }),

  setImportingFile: (file) => set({ importingFile: file }),
  updateImportStatus: (status, error, resultFileId) => set((state) => ({
    importingFile: state.importingFile
      ? { ...state.importingFile, status, error, resultFileId }
      : null,
  })),

  reset: () => set(initialState),
}));
