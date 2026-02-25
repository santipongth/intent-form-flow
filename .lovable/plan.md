

# Add Custom Welcome Message to Widget Embed Settings

## Overview
Allow users to customize the welcome message that appears when the chat widget opens, instead of the hardcoded Thai greeting. This involves adding an input field in the embed settings, passing it as a URL parameter to the widget, and using it in the widget's JavaScript.

## Changes

### 1. `src/pages/AgentDetail.tsx`
- Add state: `const [welcomeMessage, setWelcomeMessage] = useState("")`
- Add a new input field in the embed customization grid (the `bg-muted/50` section around line 346) with label "💬 ข้อความต้อนรับ" and placeholder like "สวัสดีค่ะ! มีอะไรให้ช่วยไหมคะ?"
- Include `welcome_message` param (URL-encoded) in `scriptEmbedCode`, `iframeEmbedCode`, and the preview iframe `src`
- Only append the param when the value is non-empty

### 2. `supabase/functions/widget/index.ts`
- Read `welcome_message` query param: `const welcomeMessage = url.searchParams.get("welcome_message") || ""`
- Pass it through in bubble mode's iframe src
- In fullpage mode, use it in the `toggleChat()` function: replace the hardcoded `"สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?"` with the custom message (falling back to the default if empty)
- Escape the message properly for embedding in JS string

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AgentDetail.tsx` | Add `welcomeMessage` state, input field in embed settings, include param in all embed URLs |
| `supabase/functions/widget/index.ts` | Read `welcome_message` param, pass through in bubble mode, use in greeting logic |

### URL Parameter
- Name: `welcome_message`
- Encoding: `encodeURIComponent()` on the client, `decodeURIComponent()` in the edge function (automatic from URL parsing)
- Default fallback: `"สวัสดีค่ะ! 👋 มีอะไรให้ช่วยไหมคะ?"` when empty

### Security
- The welcome message is escaped via the existing `escapeHtml()` function in the widget before rendering, preventing XSS

