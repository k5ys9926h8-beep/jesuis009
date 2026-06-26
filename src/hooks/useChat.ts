import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, Conversation, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';
import { chat } from '../lib/ai';

const STORAGE_KEY = 'fable5-conversations';
const SETTINGS_KEY = 'fable5-settings';

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function useChat(settings: AppSettings) {
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef(false);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const updateConversations = useCallback((updater: (prev: Conversation[]) => Conversation[]) => {
    setConversations((prev) => {
      const next = updater(prev);
      saveConversations(next);
      return next;
    });
  }, []);

  const createConversation = useCallback(() => {
    const newConv: Conversation = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: settings.model,
    };
    updateConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newConv.id);
    return newConv.id;
  }, [settings.model, updateConversations]);

  const deleteConversation = useCallback((id: string) => {
    updateConversations((prev) => prev.filter((c) => c.id !== id));
    setActiveConversationId((currentId) => {
      if (currentId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        return remaining.length > 0 ? remaining[0].id : null;
      }
      return currentId;
    });
  }, [conversations, updateConversations]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return;

    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation();
    }

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    };

    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    // Add user message and empty assistant message
    updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          const updatedMessages = [...c.messages, userMessage, assistantMessage];
          // Auto-title based on first message
          const title = c.messages.length === 0
            ? content.trim().slice(0, 40) + (content.length > 40 ? '...' : '')
            : c.title;
          return { ...c, messages: updatedMessages, updatedAt: Date.now(), title };
        }
        return c;
      })
    );

    setIsStreaming(true);
    abortRef.current = false;

    try {
      const allMessages = [...(conversations.find((c) => c.id === convId)?.messages || []), userMessage];

      await chat(allMessages, settings, {
        onChunk: (chunk) => {
          if (abortRef.current) return;
          updateConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                const msgs = [...c.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  msgs[msgs.length - 1] = {
                    ...lastMsg,
                    content: lastMsg.content + chunk,
                  };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
              }
              return c;
            })
          );
        },
        onDone: () => {
          updateConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                const msgs = [...c.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  msgs[msgs.length - 1] = { ...lastMsg, isStreaming: false };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
              }
              return c;
            })
          );
        },
        onError: (error) => {
          updateConversations((prev) =>
            prev.map((c) => {
              if (c.id === convId) {
                const msgs = [...c.messages];
                const lastMsg = msgs[msgs.length - 1];
                if (lastMsg && lastMsg.role === 'assistant') {
                  msgs[msgs.length - 1] = {
                    ...lastMsg,
                    content: `Error: ${error}`,
                    isStreaming: false,
                  };
                }
                return { ...c, messages: msgs, updatedAt: Date.now() };
              }
              return c;
            })
          );
        },
      });
    } catch {
      // Error already handled in callback
    } finally {
      setIsStreaming(false);
    }
  }, [activeConversationId, conversations, createConversation, isStreaming, settings, updateConversations]);

  const stopStreaming = useCallback(() => {
    abortRef.current = true;
    setIsStreaming(false);
    updateConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversationId) {
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg && lastMsg.role === 'assistant' && lastMsg.isStreaming) {
            msgs[msgs.length - 1] = { ...lastMsg, isStreaming: false };
          }
          return { ...c, messages: msgs };
        }
        return c;
      })
    );
  }, [activeConversationId, updateConversations]);

  return {
    conversations,
    activeConversation,
    activeConversationId,
    isStreaming,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
  };
}
