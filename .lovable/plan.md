
# Message Feedback (Thumbs Up/Down) for Chat Console

## Overview
Add thumbs up/down buttons on assistant messages so users can rate AI response quality. Feedback is stored in the database for analytics.

## 1. Database Migration

Create a `message_feedback` table:

```text
message_feedback
+--------------+-----------+----------------------------------+
| Column       | Type      | Notes                            |
+--------------+-----------+----------------------------------+
| id           | uuid      | PK, gen_random_uuid()            |
| message_id   | uuid      | FK -> chat_messages.id           |
| user_id      | uuid      | The rater                        |
| rating       | text      | 'up' or 'down'                   |
| created_at   | timestamptz | default now()                  |
+--------------+-----------+----------------------------------+
```

- Unique constraint on `(message_id, user_id)` for upsert behavior
- RLS: users can only manage their own feedback (via `auth.uid() = user_id`)

## 2. New Hook: `src/hooks/useMessageFeedback.ts`

- **`useMessageFeedback(conversationId)`** -- query feedback for all messages in the active conversation, keyed by `message_id`
- **`useSaveMessageFeedback()`** -- mutation to upsert rating; clicking the same rating again deletes it (toggle off)
- Invalidates query cache on success

## 3. Update `src/pages/ChatConsole.tsx`

- Import `ThumbsUp`, `ThumbsDown` from lucide-react
- Track `dbId` on `LocalMessage` so we can link feedback to actual DB message IDs
- When loading from DB: set `dbId` from `m.id`
- When saving new messages: update local state with returned DB id
- On each assistant message (non-streaming), render two small icon buttons next to existing Copy button:

```text
12:34  [ThumbsUp] [ThumbsDown] [Copy]
```

- Active up: green highlight
- Active down: red highlight  
- Click same button again: removes feedback (toggle)

## Technical Notes

- Uses `(supabase as any)` pattern consistent with existing hooks
- Foreign key to `chat_messages(id)` with `ON DELETE CASCADE` so deleting a conversation cleans up feedback automatically
- No changes to existing tables needed
