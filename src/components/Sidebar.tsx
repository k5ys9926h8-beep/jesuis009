import { Plus, MessageSquare, Trash2, Settings, Sparkles } from 'lucide-react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onOpenSettings,
}: SidebarProps) {
  return (
    <div className="flex flex-col h-full bg-surface-1 border-r border-surface-3 w-64">
      {/* Header */}
      <div className="p-4 border-b border-surface-3">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fable-500 to-fable-700 flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Fable 5</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">AI Assistant</p>
          </div>
        </div>
        <button
          onClick={onNewConversation}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-fable-600 hover:bg-fable-700 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Chat
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-600 text-center mt-8 px-4">
            No conversations yet. Start a new chat to begin.
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              conv.id === activeConversationId
                ? 'bg-surface-3 text-white'
                : 'text-gray-400 hover:bg-surface-2 hover:text-gray-200'
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <MessageSquare size={14} className="shrink-0 opacity-60" />
            <span className="flex-1 text-sm truncate">{conv.title}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-surface-3">
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-2 transition-colors w-full text-sm"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </div>
  );
}
