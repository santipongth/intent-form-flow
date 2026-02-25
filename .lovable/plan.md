

# Agent Performance Comparison Charts (Side-by-Side)

## Overview
Add a new section to the Analytics page with bar charts that compare agents side-by-side across three key metrics: Total Calls, Avg Response Time, and Success Rate. This uses the existing `agentPerf` data already computed on the page.

## Changes

### File: `src/pages/Analytics.tsx`

Add a new chart section between the Token Usage Trend chart and the Agent Performance Table. This section will contain three side-by-side horizontal bar charts in a 3-column grid:

1. **Total Calls by Agent** - Horizontal `BarChart` comparing call volume per agent
2. **Avg Response Time by Agent** - Horizontal `BarChart` comparing response times
3. **Success Rate by Agent** - Horizontal `BarChart` comparing success rates (0-100%)

Each chart uses `agentPerf` data (already available) with `layout="vertical"` for horizontal bars, making agent names readable on the Y-axis.

### Technical Details

- Use Recharts `BarChart` with `layout="vertical"` so agent names appear on the left axis
- Three charts in a `grid lg:grid-cols-3` layout
- Color-code each metric differently (primary for calls, orange for response time, green for success rate)
- Only show this section when there are 2+ agents in `agentPerf` (comparison makes no sense with 1 agent)
- Wrapped in `motion.div` with stagger animation matching existing pattern
- No new dependencies or files needed -- purely a UI addition using existing data and recharts components

