

# Real Analytics System -- Replace Mock Data with Live Database

## Overview
Replace the current mock-data Analytics page with real data from the `agent_analytics_events` table, aggregated and displayed in charts. Also add an agent filter dropdown and loading/empty states.

## Architecture

```text
agent_analytics_events table
  |
  +-- useAnalytics hook (query with date range + agent filter)
  |
  +-- Analytics.tsx (process raw events into daily aggregates + stats)
        |
        +-- Summary cards (computed from real data)
        +-- Line chart (API calls per day)
        +-- Bar chart (avg response time per day)
        +-- Area chart (tokens used per day)
        +-- Agent performance table (grouped by agent)
```

## Changes

### 1. Update `src/hooks/useAnalytics.ts`
- Keep the existing `useAnalyticsEvents` hook mostly as-is
- Add a second hook `useAgentAnalyticsSummary` that queries events grouped by agent (or reuse raw data and aggregate client-side)
- Add `refetchInterval: 30000` for near-real-time updates (poll every 30s)

### 2. Rewrite `src/pages/Analytics.tsx`
Replace all mock data references with real data:

**Data flow:**
- Call `useAnalyticsEvents(selectedAgentId, days)` where `days` is derived from the selected time range (7/30/90)
- Call `useAgents()` to get agent names for the filter dropdown and performance table
- Process raw events client-side into:
  - **Daily aggregates**: group by date, count events as API calls, average `response_time_ms`, sum `tokens_used`
  - **Summary stats**: total calls, avg response time, unique sessions (distinct dates with activity), success rate (count where status='success' / total)
  - **Agent performance table**: group by `agent_id`, compute totals per agent

**New UI elements:**
- Agent filter dropdown (All Agents + each agent by name) using existing Select component
- Loading skeleton states while data is fetching
- Empty state when no analytics data exists yet

**Removed:**
- All imports of `MOCK_ANALYTICS_DAILY` and `MOCK_AGENT_ANALYTICS`
- Hardcoded stat values

### 3. Ensure Chat Edge Function Logs Events
Check `supabase/functions/chat/index.ts` -- if it doesn't already insert into `agent_analytics_events`, add an insert after each chat response with `event_type`, `response_time_ms`, `tokens_used`, `agent_id`, and `user_id`.

## Technical Details

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useAnalytics.ts` | Add `refetchInterval`, keep existing hook |
| `src/pages/Analytics.tsx` | Full rewrite: replace mock data with `useAnalyticsEvents` + `useAgents`, add client-side aggregation, agent filter, loading/empty states |
| `supabase/functions/chat/index.ts` | Add analytics event insert if not already present |

### Client-Side Aggregation Logic
```text
Raw events -> Group by date (YYYY-MM-DD) -> For each day:
  - apiCalls = count of events
  - avgResponseTime = average of response_time_ms
  - tokensUsed = sum of tokens_used

Raw events -> Group by agent_id -> For each agent:
  - totalCalls = count
  - avgResponseTime = average of response_time_ms  
  - errorRate = (count where status != 'success') / total * 100
  - successRate = 100 - errorRate
```

### Time Range Mapping
- 7 days -> `days = 7`
- 30 days -> `days = 30`
- 90 days -> `days = 90`

### Loading States
Use the existing Skeleton component for card placeholders and chart areas while data loads.

### Empty State
When no events exist, show a friendly message encouraging users to start chatting with their agents to generate analytics data.
