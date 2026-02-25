

# Widget Customization: Primary Color and Brand Name

## Overview
Add customization options (primary color and brand name) to the widget embed system so users can match the widget to their website's branding.

## Changes

### 1. AgentDetail.tsx - Add Customization UI
Add two new state variables and input fields in the Embed tab:
- **Primary Color** - a color picker input (type="color") with hex value display, default `#6366f1`
- **Brand Name** - a text input for custom brand name shown in the widget header and "Powered by" footer, default to agent name

Pass these values as query parameters in the generated embed codes:
- `&color=%236366f1` (URL-encoded hex)
- `&brand=MyBrand`

Update `scriptEmbedCode` and `iframeEmbedCode` to include these params. Also pass them to the Preview iframe.

### 2. Widget Edge Function - Accept and Apply Customization
Update `supabase/functions/widget/index.ts` to:
- Read `color` and `brand` query parameters
- Use `color` value for `--primary` CSS variable and all gradient references (bubble background, user message bubble, send button, focus ring)
- Compute a secondary shade from the primary color for gradients
- Use `brand` value in the header name and "Powered by" footer (falling back to agent name)

### 3. Preview Tab - Pass Customization
Update the preview iframe URL in AgentDetail to include the color and brand params so the live preview reflects customizations in real-time.

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/AgentDetail.tsx` | Add `primaryColor` and `brandName` state; add color picker + text input in Embed tab; update embed code strings and preview URL |
| `supabase/functions/widget/index.ts` | Read `color` and `brand` params; apply to CSS `--primary`, gradients, header name, and footer text |

### New UI in Embed Tab (between theme toggle and Script Tag section)
- Color picker with hex input showing live swatch
- Brand name text input
- Both update the embed codes and preview in real-time

### Widget Edge Function Changes
- Line 17: Read `color` param (default `#6366f1`), `brand` param (default agent name)
- Line 70: Replace hardcoded `--primary:#6366f1` with `--primary:${color}`
- Lines 77, 83, 94, 107: Replace hardcoded `#8b5cf6` gradient stops with a computed lighter shade
- Line 119: Use `brand` in header name
- Line 131: Use `brand` in "Powered by" text
- Bubble mode (line 43): Pass `color` and `brand` params through to the fullpage iframe URL

