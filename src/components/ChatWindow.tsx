import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { Conversation } from '../types';
import { MessageBubble } from './MessageBubble';
import { InputArea } from './InputArea';

interface ChatWindowProps {
  conversation: Conversation | null;
  isStreaming: boolean;
  onSendMessage: (content: string) => void;
  onStopStreaming: () => void;
}

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fable-500 to-fable-700 flex items-center justify-center mb-6 glow-fable">
        <Sparkles size={28} className="text-white" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Fable 5 AI</h2>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Your intelligent assistant for complex reasoning, coding, research, and creative work.
        Start a conversation below.
      </p>
      <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
        {[
          'Explain quantum computing in simple terms',
          'Write a Python web scraper with error handling',
          'Help me design a database schema for an e-commerce app',
          'Debug this React component that\'s re-rendering too often',
        ].map((suggestion, i) => (
          <button
            key={i}
            className="text-left p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-surface-3 hover:border-fable-700 text-xs text-gray-400 hover:text-gray-200 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ChatWindow({ conversation, isStreaming, onSendMessage, onStopStreaming }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const hasMessages = conversation && conversation.messages.length > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-0">
      {/* Messages area */}
      {hasMessages ? (
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {conversation.messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <EmptyState />
      )}

      {/* Input area */}
      <InputArea
        onSendMessage={onSendMessage}
        isStreaming={isStreaming}
        onStopStreaming={onStopStreaming}
      />
    </div>
  );
}
