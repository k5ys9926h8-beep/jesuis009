import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
  language?: string;
  continuous?: boolean;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  error: string | null;
}

// Extend Window interface for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const {
    onResult,
    onInterimResult,
    language = 'en-US',
    continuous = true,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isStoppingRef = useRef(false);

  // Check if Speech Recognition is supported
  const isSupported = typeof window !== 'undefined' && !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );

  // Initialize recognition instance
  const getRecognition = useCallback(() => {
    if (!isSupported) return null;

    if (!recognitionRef.current) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        isStoppingRef.current = false;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => {
            const newTranscript = prev + (prev ? ' ' : '') + finalTranscript;
            onResult?.(newTranscript);
            return newTranscript;
          });
          setInterimTranscript('');
        }

        if (interim) {
          setInterimTranscript(interim);
          onInterimResult?.(interim);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // Don't treat 'aborted' as an error (happens when we stop manually)
        if (event.error === 'aborted' && isStoppingRef.current) {
          return;
        }

        const errorMessages: Record<string, string> = {
          'not-allowed': 'Microphone access denied. Please allow microphone permissions.',
          'no-speech': 'No speech detected. Try again.',
          'network': 'Network error. Check your internet connection.',
          'audio-capture': 'No microphone found. Please connect a microphone.',
          'aborted': 'Voice input was interrupted.',
        };

        setError(errorMessages[event.error] || `Voice error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // Auto-restart if not manually stopped and continuous mode
        if (!isStoppingRef.current && continuous) {
          // Don't auto-restart, let user control it
        }
      };

      recognitionRef.current = recognition;
    }

    return recognitionRef.current;
  }, [isSupported, continuous, language, onResult, onInterimResult]);

  const startListening = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    setTranscript('');
    setInterimTranscript('');
    setError(null);
    isStoppingRef.current = false;

    try {
      recognition.start();
    } catch (e) {
      // If already started, stop and restart
      recognition.stop();
      setTimeout(() => {
        try {
          recognition.start();
        } catch {
          setError('Failed to start voice input. Please try again.');
        }
      }, 100);
    }
  }, [getRecognition]);

  const stopListening = useCallback(() => {
    const recognition = recognitionRef.current;
    if (recognition) {
      isStoppingRef.current = true;
      recognition.stop();
      setIsListening(false);
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        isStoppingRef.current = true;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    error,
  };
}
