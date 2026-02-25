
# แผนพัฒนาระบบครบวงจร 7 ฟีเจอร์

## Overview
พัฒนาระบบ ThoughtMind ให้ใช้งานได้จริงครบวงจร ตั้งแต่ AI Chat จริง, Knowledge Base, ประวัติแชท, Analytics จาก database จริง, Embed Widget, Webhook/API, และ A/B Testing

เนื่องจากขอบเขตงานกว้างมาก จะแบ่งทำเป็นหลาย message ตามลำดับ โดยเริ่มจากฐานข้อมูลและ backend ก่อน แล้วค่อยทำ frontend

---

## Phase 1: Database Foundation + Real AI Chat

### 1.1 Database Migration (Tables ใหม่)

สร้างตารางใหม่ทั้งหมด:

```text
conversations
  - id (uuid, PK)
  - user_id (uuid, NOT NULL)
  - agent_id (uuid, FK -> agents)
  - title (text)
  - created_at, updated_at

chat_messages
  - id (uuid, PK)
  - conversation_id (uuid, FK -> conversations)
  - role (text: user/assistant/system)
  - content (text)
  - tokens_used (int)
  - response_time_ms (int)
  - created_at

agent_analytics_events
  - id (uuid, PK)
  - agent_id (uuid, FK -> agents)
  - user_id (uuid)
  - event_type (text: chat, api_call, embed_view)
  - tokens_used (int)
  - response_time_ms (int)
  - status (text: success/error)
  - metadata (jsonb)
  - created_at

knowledge_files
  - id (uuid, PK)
  - agent_id (uuid, FK -> agents)
  - user_id (uuid)
  - file_name (text)
  - file_path (text)
  - file_size (int)
  - file_type (text)
  - status (text: uploading/ready/error)
  - created_at

agent_deployments
  - id (uuid, PK)
  - agent_id (uuid, FK -> agents)
  - user_id (uuid)
  - deploy_type (text: embed/api/webhook)
  - config (jsonb)
  - is_active (boolean)
  - api_key (text)
  - created_at, updated_at

agent_ab_tests
  - id (uuid, PK)
  - user_id (uuid)
  - agent_a_id (uuid, FK -> agents)
  - agent_b_id (uuid, FK -> agents)
  - name (text)
  - status (text: active/completed/paused)
  - created_at, updated_at

ab_test_results
  - id (uuid, PK)
  - test_id (uuid, FK -> agent_ab_tests)
  - agent_id (uuid)
  - conversation_id (uuid)
  - response_time_ms (int)
  - tokens_used (int)
  - user_rating (int, nullable)
  - created_at
```

RLS policies จะถูกสร้างให้ทุกตารางโดยจำกัดสิทธิ์ตาม user_id

### 1.2 Edge Function: `chat` (Real AI)

**ไฟล์:** `supabase/functions/chat/index.ts`

- รับ `{ messages, agent_id }` จาก client
- ดึง agent config (system_prompt, temperature, model) จาก database
- ดึง knowledge files content ถ้ามี (แนบเป็น system context)
- เรียก Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) แบบ streaming
- ใช้ model `google/gemini-3-flash-preview` เป็น default
- Handle 429/402 errors
- Return SSE stream

### 1.3 แก้ไข ChatConsole.tsx

- เปลี่ยนจาก mock response เป็น streaming จริงผ่าน edge function
- เพิ่ม agent selector (เลือก agent ที่สร้างไว้จาก database)
- เพิ่ม conversation list sidebar (ประวัติการสนทนา)
- บันทึก messages ลง database ทุกครั้ง
- แสดง streaming text แบบ token-by-token
- รองรับ markdown rendering ด้วย `react-markdown`

---

## Phase 2: Knowledge Base (RAG)

### 2.1 Storage Bucket

สร้าง bucket `knowledge-files` สำหรับเก็บไฟล์ PDF/TXT พร้อม RLS

### 2.2 Edge Function: `process-knowledge`

- รับไฟล์จาก storage
- อ่านเนื้อหา (text extraction)
- เก็บ metadata ลง knowledge_files table

### 2.3 แก้ไข AgentBuilder.tsx + AgentDetail.tsx

- เปลี่ยนจาก mock file upload เป็นอัปโหลดจริงไปยัง storage
- แสดงรายการไฟล์ที่อัปโหลดแล้วพร้อมสถานะ
- ลบไฟล์ได้
- ใน AgentDetail เพิ่ม tab "Knowledge" แสดงไฟล์ทั้งหมดของ agent

---

## Phase 3: Conversation History

### 3.1 Hook: `useConversations.ts`

- `useConversations(agentId?)` - ดึงรายการ conversations
- `useConversationMessages(conversationId)` - ดึง messages ของ conversation
- `useCreateConversation()` - สร้าง conversation ใหม่
- `useSaveMessage()` - บันทึก message

### 3.2 แก้ไข ChatConsole.tsx

- Sidebar ซ้ายแสดง conversation list (แทน config panel เดิม)
- กด "New Chat" สร้าง conversation ใหม่
- กดเลือก conversation เก่าโหลดประวัติ
- Config panel ย้ายเป็น popover/drawer

### 3.3 เพิ่ม route `/chat/:conversationId`

- เข้าถึง conversation ตรงได้จาก URL

---

## Phase 4: Agent Analytics with Real Data

### 4.1 Hook: `useAnalytics.ts`

- ดึงข้อมูลจาก `agent_analytics_events` แทน mock data
- Aggregate: daily API calls, avg response time, token usage, success rate
- Per-agent breakdown

### 4.2 แก้ไข Analytics.tsx

- เปลี่ยนจาก MOCK data เป็นข้อมูลจริง
- เพิ่ม date range picker
- กราฟ real-time จาก database

### 4.3 บันทึก Analytics Events

- ทุกครั้งที่ chat -> บันทึก event (tokens, response time, status)
- Edge function `chat` จะ insert event หลังตอบเสร็จ

---

## Phase 5: Agent Deployment with Embed Code

### 5.1 Edge Function: `widget`

- Serve embeddable chat widget HTML/JS
- รับ agent_id จาก URL path
- Widget ทำงานเป็น standalone chat ที่ embed ในเว็บภายนอกได้

### 5.2 Edge Function: `api-chat`

- Public API endpoint สำหรับเรียกใช้ agent
- Authenticate ด้วย API key จาก `agent_deployments`
- Return JSON response (non-streaming) หรือ SSE (streaming)

### 5.3 แก้ไข AgentDetail.tsx (Deploy tab)

- เพิ่มระบบ generate/revoke API key จริง (บันทึกลง agent_deployments)
- Embed code ชี้ไปที่ edge function จริง
- แสดงสถานะ deployment (active/inactive)

---

## Phase 6: Webhook & API Integration

### 6.1 เพิ่มตาราง webhooks ใน agents

- เพิ่ม webhook_url column ใน agents table หรือใช้ agent_deployments
- Config: trigger events (on_message, on_error, on_session_start)

### 6.2 แก้ไข AgentDetail.tsx

- เพิ่ม tab "Webhooks" ใน Deploy section
- Form สำหรับใส่ webhook URL
- เลือก events ที่จะ trigger
- ปุ่ม "Test Webhook" ส่ง test payload

### 6.3 Edge function `chat` เพิ่ม webhook dispatch

- หลังตอบเสร็จ ถ้า agent มี webhook -> POST ไปที่ webhook URL

---

## Phase 7: A/B Testing for Agents

### 7.1 หน้าใหม่: `src/pages/ABTesting.tsx`

- แสดงรายการ A/B tests ที่สร้างไว้
- สร้าง test ใหม่: เลือก Agent A vs Agent B
- ตั้งชื่อ test

### 7.2 หน้าใหม่: `src/pages/ABTestDetail.tsx`

- Split-screen chat: ส่งข้อความเดียวกันไปทั้ง 2 agents พร้อมกัน
- แสดง response แบบ side-by-side
- ปุ่ม vote (A ดีกว่า / B ดีกว่า / เท่ากัน)
- สรุปผลลัพธ์: win rate, avg response time, avg tokens

### 7.3 เพิ่ม route + sidebar menu

- `/ab-testing` - รายการ tests
- `/ab-testing/:id` - detail + chat comparison
- เพิ่มเมนูใน sidebar

---

## สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | Action |
|------|--------|
| Database migration (7+ tables) | สร้างใหม่ |
| `supabase/functions/chat/index.ts` | สร้างใหม่ |
| `supabase/functions/process-knowledge/index.ts` | สร้างใหม่ |
| `supabase/functions/widget/index.ts` | สร้างใหม่ |
| `supabase/functions/api-chat/index.ts` | สร้างใหม่ |
| `supabase/config.toml` | แก้ไข (เพิ่ม function configs) |
| `src/hooks/useConversations.ts` | สร้างใหม่ |
| `src/hooks/useAnalytics.ts` | สร้างใหม่ |
| `src/hooks/useKnowledge.ts` | สร้างใหม่ |
| `src/hooks/useDeployment.ts` | สร้างใหม่ |
| `src/hooks/useABTesting.ts` | สร้างใหม่ |
| `src/lib/streamChat.ts` | สร้างใหม่ |
| `src/pages/ChatConsole.tsx` | แก้ไขใหญ่ (real AI + history) |
| `src/pages/AgentDetail.tsx` | แก้ไข (knowledge tab, real deploy) |
| `src/pages/AgentBuilder.tsx` | แก้ไข (real file upload) |
| `src/pages/Analytics.tsx` | แก้ไข (real data) |
| `src/pages/Dashboard.tsx` | แก้ไข (real stats) |
| `src/pages/ABTesting.tsx` | สร้างใหม่ |
| `src/pages/ABTestDetail.tsx` | สร้างใหม่ |
| `src/components/layout/AppSidebar.tsx` | แก้ไข (เพิ่มเมนู A/B Testing) |
| `src/App.tsx` | แก้ไข (เพิ่ม routes) |
| `src/i18n/th.ts` + `src/i18n/en.ts` | แก้ไข (เพิ่ม translations) |

---

## ลำดับการทำงาน

เนื่องจากมีไฟล์จำนวนมาก จะแบ่งทำดังนี้:
1. **Message 1**: Database migration + Edge function `chat` + `streamChat.ts` + แก้ ChatConsole (Real AI)
2. **Message 2**: Knowledge Base (storage + upload + hooks) + Conversation History
3. **Message 3**: Analytics real data + Deployment system
4. **Message 4**: Webhook integration + A/B Testing pages + routes

ต้องติดตั้ง dependency เพิ่ม: `react-markdown`
