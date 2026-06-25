import { useState, useRef, useEffect } from 'react';
import { Send, Square, Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface InputAreaProps {
  onSendMessage: (content: string) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
}

export function InputArea({ onSendMessage, isStreaming, onStopStreaming }: InputAreaProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    toggleListening,
    stopListening,
    error: voiceError,
  } = useVoiceInput({
    onResult: (finalTranscript) => {
      setInput((prev) => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + finalTranscript;
      });
    },
  });

  // When voice transcript updates, sync to input for final results
  useEffect(() => {
    if (transcript && !isListening) {
      // Voice stopped, transcript is final
    }
  }, [transcript, isListening]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Auto-resize textarea when input changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [input, interimTranscript]);

  const handleSubmit = () => {
    const messageContent = input.trim();
    if (messageContent && !isStreaming) {
      if (isListening) stopListening();
      onSendMessage(messageContent);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Display value includes interim transcript while listening
  const displayValue = isListening && interimTranscript
    ? input + (input && !input.endsWith(' ') ? ' ' : '') + interimTranscript
    : input;

  return (
    <div className="p-4 border-t border-surface-2">
      <div className="max-w-4xl mx-auto">
        {/* Voice error notification */}
        {voiceError && (
          <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs animate-fade-in">
            {voiceError}
          </div>
        )}

        {/* Voice listening indicator */}
        {isListening && (
          <div className="mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-fable-600/10 border border-fable-600/20 animate-fade-in">
            <div className="flex gap-0.5 items-center">
              <span className="w-1 h-3 bg-fable-400 rounded-full animate-pulse" />
              <span className="w-1 h-4 bg-fable-500 rounded-full animate-pulse [animation-delay:0.15s]" />
              <span className="w-1 h-2 bg-fable-400 rounded-full animate-pulse [animation-delay:0.3s]" />
              <span className="w-1 h-5 bg-fable-500 rounded-full animate-pulse [animation-delay:0.45s]" />
              <span className="w-1 h-3 bg-fable-400 rounded-full animate-pulse [animation-delay:0.6s]" />
            </div>
            <span className="text-xs text-fable-300 font-medium">Listening...</span>
            {interimTranscript && (
              <span className="text-xs text-gray-500 italic ml-2 truncate max-w-[200px]">
                "{interimTranscript}"
              </span>
            )}
          </div>
        )}

        <div className="flex items-end gap-3 bg-surface-1 rounded-2xl border border-surface-3 focus-within:border-fable-600 focus-within:glow-fable transition-all px-4 py-3">
          <textarea
            ref={textareaRef}
            value={displayValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isListening ? 'Listening... speak now' : 'Message Fable 5...'}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-gray-600 resize-none outline-none text-sm leading-relaxed max-h-[200px]"
            readOnly={isListening}
          />

          {/* Voice input button */}
          {isSupported && (
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-all shrink-0 ${
                isListening
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/30 animate-pulse'
                  : 'bg-surface-3 text-gray-400 hover:text-fable-400 hover:bg-surface-4'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}

          {/* Send / Stop button */}
          {isStreaming ? (
            <button
              onClick={onStopStreaming}
              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors shrink-0"
              title="Stop generating"
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!displayValue.trim()}
              className="p-2 rounded-lg bg-fable-600 text-white hover:bg-fable-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
              title="Send message"
            >
              <Send size={16} />
            </button>
          )}
        </div>
        <p className="text-center text-[11px] text-gray-600 mt-2">
          Fable 5 can make mistakes. Verify important information.{' '}
          {isSupported && <span className="text-gray-700">Press the mic icon for voice input.</span>}
        </p>
      </div>
    </div>
  );
}
