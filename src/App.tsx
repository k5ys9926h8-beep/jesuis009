import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Settings } from './components/Settings';
import { useChat, loadSettings, saveSettings } from './hooks/useChat';
import type { AppSettings } from './types';

function App() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [showSettings, setShowSettings] = useState(false);

  const {
    conversations,
    activeConversation,
    activeConversationId,
    isStreaming,
    setActiveConversationId,
    createConversation,
    deleteConversation,
    sendMessage,
    stopStreaming,
  } = useChat(settings);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onNewConversation={createConversation}
        onDeleteConversation={deleteConversation}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Main Chat Area */}
      <ChatWindow
        conversation={activeConversation}
        isStreaming={isStreaming}
        onSendMessage={sendMessage}
        onStopStreaming={stopStreaming}
      />

      {/* Settings Modal */}
      {showSettings && (
        <Settings
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
