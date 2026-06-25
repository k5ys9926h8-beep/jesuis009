export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface AppSettings {
  apiKey: string;
  apiProvider: 'anthropic' | 'openai';
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  theme: 'dark' | 'light';
}

export const DEFAULT_SETTINGS: AppSettings = {
  apiKey: '',
  apiProvider: 'anthropic',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: `You are Fable 5, an extraordinarily capable AI assistant. You excel at:
- Complex reasoning and analysis
- Writing, editing, and creative tasks
- Code generation, debugging, and architecture
- Research, synthesis, and long-form content
- Multi-step problem solving with autonomous planning

You are direct, insightful, and thorough. You think step-by-step on complex problems and provide comprehensive answers. When coding, you write clean, well-documented, production-ready code.`,
  temperature: 0.7,
  maxTokens: 4096,
  theme: 'dark',
};

export const AVAILABLE_MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o1-preview', name: 'O1 Preview' },
    { id: 'o1-mini', name: 'O1 Mini' },
  ],
};
