

# Widget Position and Bubble Size Customization

## Overview
Add two new customization options to the Embed settings: widget position (bottom-left or bottom-right) and bubble button size. These settings will flow through to the embed codes and widget rendering.

## Changes

### 1. AgentDetail.tsx - New Controls
Add two new state variables and UI inputs in the customization section:

- **Position** (`position`): Toggle or select between `bottom-right` (default) and `bottom-left`
- **Bubble Size** (`bubbleSize`): Slider or input for bubble diameter in pixels (range 48-80, default 60)

Update all embed code strings (`scriptEmbedCode`, `iframeEmbedCode`) and the preview iframe URL to include `&position=bottom-left&bubble_size=56` query params.

### 2. Widget Edge Function - Apply Position and Size
Update `supabase/functions/widget/index.ts` to:

- Read `position` param (default `bottom-right`) and `bubble_size` param (default `60`)
- **Bubble mode (script injection):** Change the iframe `style.cssText` to use `left:0` instead of `right:0` when position is `bottom-left`
- **Fullpage mode (HTML):** 
  - `#widget-root`: Change `right:24px` to `left:24px` and `align-items:flex-end` to `flex-start` when position is `bottom-left`
  - `#bubble`: Use the `bubble_size` value for `width` and `height`, and scale `font-size` proportionally
  - `#chat-window`: Align to left edge when position is `bottom-left`

## Technical Details

### Files to Modify

| File | Changes |
|------|--------|
| `src/pages/AgentDetail.tsx` | Add `widgetPosition` and `bubbleSize` state; add position toggle buttons + size slider in customization section; update embed code generation |
| `supabase/functions/widget/index.ts` | Read `position` and `bubble_size` params; apply to CSS positioning and bubble dimensions |

### New UI in Customization Section
Add two more items to the existing grid in the Embed tab (lines 341-368):
- **Position selector**: Two buttons styled as a toggle group showing "Left" and "Right" with small icons
- **Bubble size**: A slider (48-80px) with the current value displayed, plus a small preview circle

### Edge Function CSS Changes
- `#widget-root` positioning: `right:24px` becomes dynamic based on `position` param
- `#bubble` dimensions: `width:60px;height:60px` becomes `width:${bubbleSize}px;height:${bubbleSize}px` with scaled `font-size`
- Bubble mode script: iframe `style.cssText` swaps `right:0` for `left:0` when left-aligned
