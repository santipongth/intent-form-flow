

# Embed Widget System

## Overview
Create a standalone, embeddable chat widget that external websites can integrate via a simple `<script>` tag or `<iframe>`. The widget will be a floating chat bubble that opens a chat window, connecting directly to your existing chat Edge Function.

## Architecture

```text
External Website
  |
  +-- <script src="widget.js">  (or <iframe>)
  |
  +-- Floating Chat Bubble (bottom-right)
        |
        +-- Opens Chat Window
              |
              +-- POST /functions/v1/chat  (streaming)
```

## What Will Be Built

### 1. Widget Edge Function (`supabase/functions/widget/index.ts`)
A new backend function that serves the embeddable widget HTML/JS. When called with an agent ID, it returns a self-contained HTML page with:
- A floating chat bubble (bottom-right corner)
- A chat window with the agent's name and streaming responses
- Light/dark theme support
- Responsive design
- Direct calls to the existing `/functions/v1/chat` endpoint for AI responses

### 2. Updated Agent Detail Deploy Tab (`src/pages/AgentDetail.tsx`)
Enhance the existing Embed tab with:
- **Script embed code** -- a one-liner `<script>` tag users can paste into any website
- **iframe embed code** -- already partially exists, will be updated with the real widget URL
- Copy buttons for both options
- Live preview using the actual widget

### 3. Widget Preview Page (`src/pages/WidgetPreview.tsx`)
A simple full-page wrapper that loads the widget in an iframe for in-app testing from the Agent Detail page.

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `supabase/functions/widget/index.ts` | Serves the embeddable chat widget HTML/JS |
| `src/pages/WidgetPreview.tsx` | In-app preview page for testing the widget |

### Files to Modify
| File | Change |
|------|--------|
| `src/pages/AgentDetail.tsx` | Update embed tab with real widget URLs and script tag code |
| `src/App.tsx` | Add route for `/widget-preview/:agentId` |

### Widget Edge Function Design
- Accepts `GET /widget?agent_id=xxx&theme=light` 
- Returns a complete HTML page with inline CSS and JS
- The JS handles:
  - Rendering a chat UI (message bubbles, input box)
  - Calling the existing `/functions/v1/chat` endpoint with streaming
  - Session management via `sessionStorage`
  - Theme switching (light/dark)
- No authentication required for end-users (widget visitors)
- `verify_jwt = false` in config

### Script Embed Code (for external sites)
```html
<script 
  src="https://hiyzlaiqeygxvpgveadq.supabase.co/functions/v1/widget?agent_id=AGENT_ID&theme=light"
  defer>
</script>
```
This script will inject an iframe with the chat widget into the host page.

### iframe Embed Code (alternative)
```html
<iframe
  src="https://hiyzlaiqeygxvpgveadq.supabase.co/functions/v1/widget?agent_id=AGENT_ID&mode=fullpage&theme=light"
  width="400" height="600"
  style="border:none; border-radius:12px;"
></iframe>
```

### Widget Features
- Floating bubble button (customizable position)
- Expand/collapse animation
- Chat history within session
- Streaming responses with typing indicator
- Agent name and avatar in header
- Send on Enter key
- Mobile responsive
- Light and dark theme

