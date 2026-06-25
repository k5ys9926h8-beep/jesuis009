# Fable 5 AI

A beautiful, fast, and lightweight AI desktop assistant built with **Tauri 2 + React + TypeScript**. Designed for macOS, with support for Anthropic (Claude) and OpenAI APIs.

![Fable 5 AI](https://img.shields.io/badge/Tauri-2.0-blue) ![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

- **Streaming AI responses** — Real-time token streaming from Claude or GPT models
- **Multi-conversation support** — Create, switch between, and manage multiple chats
- **Syntax-highlighted code** — Beautiful code blocks with one-click copy
- **Markdown rendering** — Full GFM support for rich AI responses
- **Configurable settings** — Choose your provider, model, temperature, and system prompt
- **Lightweight** — ~10MB app size (vs Electron's 200MB+), uses native macOS WebKit
- **Privacy-first** — API keys stored locally, never sent anywhere except your chosen provider
- **Beautiful dark UI** — Modern, polished interface with custom color scheme

## Prerequisites

Before building, make sure you have:

1. **Xcode Command Line Tools:**
   ```bash
   xcode-select --install
   ```

2. **Rust:**
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. **Node.js** (v18+):
   ```bash
   brew install node
   ```

## Quick Start

```bash
# Clone or download the project
cd fable5-ai

# Install frontend dependencies
npm install

# Run in development mode (hot-reload)
npm run tauri dev

# Build for production (.dmg)
npm run tauri build
```

## Configuration

1. Launch the app
2. Click **Settings** in the sidebar
3. Choose your API provider (Anthropic or OpenAI)
4. Enter your API key
5. Select your preferred model
6. Adjust temperature and max tokens as needed

### Supported Models

**Anthropic:**
- Claude Sonnet 4
- Claude Opus 4
- Claude 3.5 Sonnet
- Claude 3.5 Haiku

**OpenAI:**
- GPT-4o
- GPT-4o Mini
- O1 Preview
- O1 Mini

## Project Structure

```
fable5-ai/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── ChatWindow.tsx  # Main chat area
│   │   ├── InputArea.tsx   # Message input
│   │   ├── MessageBubble.tsx # Message rendering
│   │   ├── Settings.tsx    # Settings modal
│   │   └── Sidebar.tsx     # Conversation list
│   ├── hooks/              # React hooks
│   │   └── useChat.ts      # Chat state management
│   ├── lib/                # Utilities
│   │   └── ai.ts           # AI API integration
│   ├── types/              # TypeScript types
│   │   └── index.ts        # Type definitions
│   ├── App.tsx             # Root component
│   ├── main.tsx            # Entry point
│   └── index.css           # Tailwind + custom styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri entry
│   │   └── lib.rs          # API handlers + streaming
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json
├── vite.config.ts
└── index.html
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Tauri 2 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Bundler | Vite 8 |
| Backend | Rust (reqwest, tokio, futures) |
| Markdown | react-markdown + remark-gfm |
| Code Highlighting | react-syntax-highlighter (Prism) |
| Icons | Lucide React |

## Building for Distribution

```bash
# Create a production .dmg for macOS
npm run tauri build
```

The built `.dmg` will be in `src-tauri/target/release/bundle/dmg/`.

## License

MIT
