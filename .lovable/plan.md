# แผนยกระดับ ThoughtMind สู่ Production

หลังสำรวจ codebase ทั้งหมด (Auth, Dashboard, AgentBuilder, AgentDetail, ChatConsole, Monitor, Analytics, Marketplace, A/B Testing, Widget, Edge Functions) พบว่าระบบมีโครงสร้างหลักครบแล้ว แต่ยังขาดชั้น **ความปลอดภัย, การควบคุมต้นทุน, การใช้งานจริง และความเสถียร** ที่จำเป็นสำหรับ Production

ด้านล่างเป็นคำแนะนำจัดลำดับตามความสำคัญ — คุณเลือกได้ว่าจะให้ทำส่วนไหนก่อน

---

### 1. API Key จริงสำหรับ Deploy Agent

- `AgentDetail.tsx` มี `generateApiKey()` แต่ **ไม่ได้เก็บใน DB** → key ปลอม ใช้งานจริงไม่ได้
- สร้างตาราง `agent_api_keys` (agent_id, key_hash, last_used_at, revoked_at)
- เก็บแบบ hash (sha256), แสดง full key ครั้งเดียวตอนสร้าง
- Edge function `chat` รับ key ผ่าน header `x-api-key` เพื่อให้เรียกจากภายนอกได้

### 2. Error Tracking & Logging

- ปัจจุบันมีแค่ `ErrorBoundary` — ไม่มี server log ที่ค้นหาได้
- เพิ่มตาราง `error_logs` หรือเชื่อม Sentry
- Edge function ทุกตัวควร log error พร้อม context (user_id, agent_id)

---

### 3. Streaming Chat ที่ Production-grade

- เพิ่ม retry logic, abort controller, reconnect เมื่อ network ขาด
- บันทึก partial message ลง DB เพื่อกู้คืนเมื่อ user refresh

### 4. Webhook & Integration

- ให้ agent ส่ง event ไปยัง URL ของลูกค้า (เช่น Slack, Line OA, Zapier)
- ตาราง `agent_webhooks` (url, events[], secret)

---

### 5. Testing & CI

- เพิ่ม unit test สำหรับ hooks สำคัญ (`useAgents`, `useKnowledge`)
- E2E test flow: signup → create agent → chat → delete

---

---

## ให้เริ่มทำข้อที่ 1,2,3,4,5 ได้เลยทั้งหมด