import { useState } from 'react';
import { X, Key, Brain, Thermometer, Hash, Palette } from 'lucide-react';
import type { AppSettings } from '../types';
import { AVAILABLE_MODELS } from '../types';

interface SettingsProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export function Settings({ settings, onSave, onClose }: SettingsProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>({ ...settings });

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const models = AVAILABLE_MODELS[localSettings.apiProvider] || [];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-1 rounded-2xl border border-surface-3 w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-3 sticky top-0 bg-surface-1 rounded-t-2xl">
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-3 text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* API Provider */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Brain size={14} />
              API Provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['anthropic', 'openai'] as const).map((provider) => (
                <button
                  key={provider}
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      apiProvider: provider,
                      model: AVAILABLE_MODELS[provider][0].id,
                    })
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    localSettings.apiProvider === provider
                      ? 'bg-fable-600 text-white'
                      : 'bg-surface-2 text-gray-400 hover:text-white hover:bg-surface-3'
                  }`}
                >
                  {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Key size={14} />
              API Key
            </label>
            <input
              type="password"
              value={localSettings.apiKey}
              onChange={(e) => setLocalSettings({ ...localSettings, apiKey: e.target.value })}
              placeholder={`Enter your ${localSettings.apiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key`}
              className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-lg text-white text-sm placeholder-gray-600 outline-none focus:border-fable-600 transition-colors"
            />
            <p className="text-[11px] text-gray-600 mt-1">
              Your key is stored locally and never sent anywhere except the API provider.
            </p>
          </div>

          {/* Model */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Palette size={14} />
              Model
            </label>
            <select
              value={localSettings.model}
              onChange={(e) => setLocalSettings({ ...localSettings, model: e.target.value })}
              className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-lg text-white text-sm outline-none focus:border-fable-600 transition-colors appearance-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Thermometer size={14} />
              Temperature: {localSettings.temperature.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-fable-600"
            />
            <div className="flex justify-between text-[11px] text-gray-600 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
              <Hash size={14} />
              Max Tokens
            </label>
            <input
              type="number"
              value={localSettings.maxTokens}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) || 4096 })
              }
              min={256}
              max={128000}
              step={256}
              className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-lg text-white text-sm outline-none focus:border-fable-600 transition-colors"
            />
          </div>

          {/* System Prompt */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              System Prompt
            </label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
              rows={5}
              className="w-full px-4 py-2.5 bg-surface-2 border border-surface-3 rounded-lg text-white text-sm outline-none focus:border-fable-600 transition-colors resize-none"
              placeholder="Customize the AI's personality and capabilities..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-3 flex gap-3 sticky bottom-0 bg-surface-1 rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg bg-surface-2 text-gray-400 hover:text-white hover:bg-surface-3 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2.5 rounded-lg bg-fable-600 text-white hover:bg-fable-700 text-sm font-medium transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
