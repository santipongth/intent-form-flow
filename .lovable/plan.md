
# Deploy (API + Widget) — Review & Fixes

ผมตรวจสอบ flow การ deploy agent (Tab Deploy → API / Embed / Preview / API Key) ครบทั้ง frontend + edge functions แล้ว สรุปสถานะและสิ่งที่ต้องแก้ดังนี้

## สถานะปัจจุบัน (ทำงานได้แล้ว)

- `supabase/functions/agent-api` — endpoint จริง: ตรวจ `x-api-key` (SHA-256), rate-limit 60 req/min, ใส่ knowledge files, เรียก Lovable AI Gateway, log analytics, dispatch webhooks ✅
- `supabase/functions/issue-api-key` — ออก key รูปแบบ `sk-tm-<48hex>` คืนค่า plaintext ครั้งเดียว ✅
- `supabase/functions/widget` — รองรับ 2 mode (`bubble` script, `fullpage` iframe), preview flag, theme/color/brand/position/lang/welcome ✅
- ตาราง `agent_api_keys`, `api_key_usage`, RPC `increment_api_key_usage` พร้อม RLS + service_role grant ✅
- หน้า API Key ใน UI สร้าง/เพิกถอน key ได้จริง ✅

## ปัญหาที่พบ (ต้องแก้)

### A. แท็บ "API" แสดงตัวอย่างที่ใช้ไม่ได้จริง (สำคัญที่สุด)
ใน `src/pages/AgentDetail.tsx` (บรรทัด ~415–432):
- `endpoint = https://api.thoughtmind.ai/v1/agents/<id>/chat` — **โดเมนนี้ไม่มีจริง**
- `apiKey = generateApiKey()` — สุ่มในเบราว์เซอร์ ไม่ใช่ key จริงในฐานข้อมูล
- cURL ใช้ `Authorization: Bearer ...` และ field `session_id` — แต่ `agent-api` จริงต้องใช้ header `x-api-key` และ body `{ "message" | "messages" }` ไม่มี `session_id`
- ผลคือนักพัฒนา copy curl ไปรันแล้ว 401/404 ทันที

### B. ไม่มีคู่มือ / response shape / error codes ให้นักพัฒนา
ขาดเอกสารบอก: response JSON (`reply`, `tokens_used`, `response_time_ms`, `model`), error codes (401/404/413/429/502), rate limit 60/min, ขนาด body 256KB, `messages` array สูงสุด 100

### C. `agent-api` ไม่บังคับให้ agent ต้อง publish
ถ้ามี key อยู่ ใช้ได้แม้ agent.status = draft → ไม่ตรงกับ toggle "Publish" ใน UI

### D. ไม่มีหน่วยความจำ (memory) ให้ผู้เรียก API ภายนอก
`agent-api` ไม่รับ `conversation_id` / `session_id` ทำให้ทุก request เป็น stateless ลูกค้าที่อยากทำ chatbot ต้องส่ง `messages[]` ทั้งหมดเองทุกครั้ง — ควรรองรับ session แบบ optional

### E. ไม่มี streaming ใน `agent-api`
External chatbot ต้องรอจน AI ตอบเสร็จทั้งก้อน UX ช้า; widget ที่ stream นั้นเรียก `/chat` (ใช้ ANON key) ไม่ได้เรียก `/agent-api`

### F. Widget bubble iframe บัง click หน้าเว็บ host
`f.style = position:fixed;bottom:0;right:0;width:420px;height:700px;` iframe สูง 700px อยู่ตลอด แม้ปิดแชทอยู่ก็ทับ element อื่นด้านล่างขวา ต้องย่อเป็นขนาดปุ่ม bubble แล้วขยายเมื่อเปิด (postMessage) หรือใช้ 2 iframe

### G. Widget ไม่มี domain allowlist
ใครก็ตามที่รู้ `agent_id` (และ agent published) สามารถฝัง widget ที่เว็บตัวเอง → กิน credit เจ้าของ ควรเพิ่ม optional `agent_allowed_domains` แล้วตรวจ `Origin/Referer`

### H. API key หน้า API Key tab ไม่มี curl ตัวอย่างประกบ
ผู้ใช้ generate key เสร็จต้องเดาเองว่า endpoint/header เป็นอะไร — ควรแสดง curl ตัวอย่างพร้อมเสียบ key ที่เพิ่งสร้างให้เลย

### I. `error_logs.user_id` อาจ NOT NULL แต่ top-level catch ใน agent-api log โดยไม่มี user_id
ตรวจ schema; ถ้า NOT NULL จะ insert พลาดเงียบ (มี try/catch ห่ออยู่แล้ว แต่ทำให้ debug ยาก)

---

## แผนการแก้

### 1. แก้แท็บ API ให้ใช้งานได้จริง (`src/pages/AgentDetail.tsx`)
- เปลี่ยน `endpoint` เป็น `${VITE_SUPABASE_URL}/functions/v1/agent-api`
- ลบ `generateApiKey()` ออก; ดึง key prefix ล่าสุดที่ active จาก `useApiKeys` มาแสดง แทน — ถ้ายังไม่มี key แสดงปุ่ม "Generate your first key" ที่เชื่อมไป tab API Key
- เขียน cURL ใหม่ ใช้ `x-api-key` + body `{"message":"สวัสดี"}` (และ comment ตัวอย่าง `messages[]` แบบ multi-turn)
- เพิ่มกล่อง "Response example" และ "Errors" (ตาราง status → meaning)
- เพิ่มตัวอย่าง JavaScript fetch + Python requests
- เพิ่ม note: rate limit 60/min, body ≤256KB, messages ≤100, max content 32k chars

### 2. เพิ่มคู่มือฉบับเต็มหน้า `/docs/api` (เลือกได้)
หน้า static markdown-like อธิบาย: auth, endpoints, schema, errors, examples, webhook signature, rate-limit headers — link จากแท็บ API ("📘 อ่านเอกสารฉบับเต็ม")

### 3. แก้ `agent-api` (backend)
- บังคับ `agents.status = 'published'` ก่อนตอบ (ไม่งั้น 403 + `{error:"Agent not published"}`)
- รองรับ optional `session_id` (string ผู้ใช้กำหนดเอง): ถ้ามี → upsert `conversations` (user_id=key.user_id, agent_id, external_session_id=session_id) แล้ว `loadHistory` + บันทึก user/assistant messages → ให้ memory ข้าม request ได้
- รองรับ optional `stream: true` → ส่ง gateway แบบ stream แล้วถ่ายกลับ SSE (เพิ่ม CORS expose: `X-RateLimit-*`)
- log error ใส่ `user_id: keyRow?.user_id ?? null` ถ้า schema บังคับ NOT NULL ต้องเพิ่ม migration ทำให้ nullable หรือ skip insert

### 4. Migration เล็ก
- เพิ่มคอลัมน์ `conversations.external_session_id text` + unique `(agent_id, user_id, external_session_id)` สำหรับ session API
- (เลือก) เพิ่มคอลัมน์ `agents.allowed_domains text[]` สำหรับ widget allowlist

### 5. ปรับ widget bubble loader
แก้ `supabase/functions/widget/index.ts` (mode=bubble script):
- เริ่มต้น iframe ขนาดเท่าปุ่ม bubble (`width=80px; height=80px`) มุมขวาล่าง
- ใน fullpage HTML ส่ง `postMessage({type:"tm-resize", open:true/false})` ตอน toggle
- script loader ฟัง message แล้วขยาย/หด iframe → ไม่บัง content อีกต่อไป
- (ถ้าทำข้อ allowlist) ตรวจ `req.headers.get("referer")` กับ `agents.allowed_domains` → 403 ถ้าไม่ตรง

### 6. ปรับแท็บ API Key
- หลัง generate key เสร็จ แสดงกล่อง "Quick start" พร้อม curl ที่เสียบ key + agent_id จริง (copy ครั้งเดียวใช้ได้เลย)
- แสดง "Last used" + "Requests this minute" (จาก `api_key_usage`) เป็น hint

### 7. เทสจริง
- หลัง deploy ใช้ `supabase--curl_edge_functions` ยิง `/agent-api` ด้วย key จริง: case ปกติ, ไม่มี key, key ผิด, agent draft, body ใหญ่, rate-limit, streaming, session_id ต่อเนื่อง
- ยิง `/widget?agent_id=...` ทั้ง mode=bubble และ fullpage ตรวจ HTML/JS ออกถูก

---

## เทคนิคโดยสรุป
- ไฟล์ที่จะแก้: `src/pages/AgentDetail.tsx`, `src/components/agent-detail/ApiKeysSection.tsx`, `supabase/functions/agent-api/index.ts`, `supabase/functions/widget/index.ts`, migration ใหม่ 1 ไฟล์, (เลือก) `src/pages/ApiDocs.tsx`
- ไม่ต้องเปลี่ยน schema `agent_api_keys`, `api_key_usage`
- เพิ่ม i18n key สำหรับข้อความใหม่ใน `src/i18n/{en,th}.ts`

## ลำดับงานที่แนะนำ (ทำตามลำดับ จบใน 1 ครั้ง)
1. Migration: `conversations.external_session_id` (+ optional `agents.allowed_domains`)
2. Backend `agent-api`: enforce published, รับ `session_id`, รองรับ `stream:true`
3. Backend `widget`: bubble loader resize + (optional) domain allowlist
4. Frontend: แท็บ API ใช้ endpoint + key จริง, cURL/JS/Python examples, error table
5. Frontend: ApiKeysSection แสดง Quick start หลัง generate
6. (เลือก) หน้า `/docs/api`
7. Deploy edge functions + curl test end-to-end

ถ้าโอเค กดอนุมัติได้เลย หรือบอกว่าอยากตัด/เพิ่มข้อไหน (เช่น ข้าม streaming, ข้าม domain allowlist, หรือไม่อยากมีหน้า docs แยก)
