import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import type { AppSettings, Message } from '../types';

export interface StreamCallback {
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

export async function sendChatMessage(
  messages: Message[],
  settings: AppSettings,
  callbacks: StreamCallback
): Promise<string> {
  // Set up stream listener
  const unlisten = await listen<{ content: string; done: boolean }>('stream-chunk', (event) => {
    if (event.payload.done) {
      callbacks.onDone();
    } else {
      callbacks.onChunk(event.payload.content);
    }
  });

  try {
    const chatMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const result = await invoke<string>('send_message', {
      request: {
        api_key: settings.apiKey,
        provider: settings.apiProvider,
        model: settings.model,
        messages: chatMessages,
        system_prompt: settings.systemPrompt,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
      },
    });

    return result;
  } catch (error) {
    callbacks.onError(String(error));
    throw error;
  } finally {
    unlisten();
  }
}

// Fallback for when Tauri is not available (browser dev mode)
export async function sendChatMessageFallback(
  messages: Message[],
  settings: AppSettings,
  callbacks: StreamCallback
): Promise<string> {
  const { apiKey, apiProvider, model, systemPrompt, temperature, maxTokens } = settings;

  if (!apiKey) {
    callbacks.onError('Please set your API key in Settings');
    throw new Error('No API key');
  }

  const chatMessages = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let url: string;
  let headers: Record<string, string>;
  let body: object;

  if (apiProvider === 'anthropic') {
    url = 'https://api.anthropic.com/v1/messages';
    headers = {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    };
    body = {
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: chatMessages,
      stream: true,
    };
  } else {
    url = 'https://api.openai.com/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    body = {
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [{ role: 'system', content: systemPrompt }, ...chatMessages],
      stream: true,
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    callbacks.onError(`API Error: ${errorText}`);
    throw new Error(errorText);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No reader');

  const decoder = new TextDecoder();
  let fullResponse = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') {
          callbacks.onDone();
          return fullResponse;
        }
        try {
          const parsed = JSON.parse(data);
          let content = '';
          if (apiProvider === 'anthropic') {
            content = parsed?.delta?.text || '';
          } else {
            content = parsed?.choices?.[0]?.delta?.content || '';
          }
          if (content) {
            fullResponse += content;
            callbacks.onChunk(content);
          }
        } catch {
          // Skip unparseable lines
        }
      }
    }
  }

  callbacks.onDone();
  return fullResponse;
}

// Detect if running in Tauri
export function isTauri(): boolean {
  return !!(window as any).__TAURI_INTERNALS__;
}

export async function chat(
  messages: Message[],
  settings: AppSettings,
  callbacks: StreamCallback
): Promise<string> {
  if (isTauri()) {
    return sendChatMessage(messages, settings, callbacks);
  }
  return sendChatMessageFallback(messages, settings, callbacks);
}
