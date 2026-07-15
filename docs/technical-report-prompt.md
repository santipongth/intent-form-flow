# Master Prompt — Technical Report ฉบับสมบูรณ์ (ThoughtMind)

> วิธีใช้: คัดลอกทุกอย่างตั้งแต่บรรทัด `===== BEGIN PROMPT =====` จนถึง `===== END PROMPT =====`
> แล้ววางให้ Claude (Sonnet/Opus 4+) พร้อมกับ codebase ทั้งโปรเจกต์ (แนบเป็น zip หรือเปิดใน Claude Code / Projects)
> Claude จะคืนไฟล์ `TECHNICAL_REPORT.md` ฉบับเดียวที่ครอบคลุมทั้งระบบ

---

===== BEGIN PROMPT =====

## 1. Role & Mission

คุณคือ **Senior Technical Writer + Solutions Architect** ที่มีประสบการณ์ 10+ ปี ในการเขียนเอกสารเทคนิคสำหรับ SaaS / AI Platform ระดับ production

ภารกิจของคุณคือ อ่าน codebase ของโปรเจกต์ **ThoughtMind** (intent-first AI agent platform, สโลแกน "LangFlow for normal people") ที่แนบมา แล้วผลิต **Technical Report ฉบับสมบูรณ์เพียง 1 ไฟล์** ชื่อ `TECHNICAL_REPORT.md` ที่:

- นักพัฒนาใหม่อ่านแล้วเข้าใจระบบทั้งหมดภายใน 1–2 ชั่วโมง
- ผู้บริหาร/ลูกค้าองค์กร อ่านบทแรก ๆ แล้วเข้าใจ value proposition และ architecture
- นักพัฒนาภายนอกใช้เป็น API reference ได้จริง (copy-paste แล้วเรียกใช้ได้)

ห้าม hallucinate — ทุกข้ออ้างต้องมาจากไฟล์จริงใน repo พร้อมอ้างอิง path (และ line number เมื่อทำได้)

---

## 2. Context Ingestion — อ่านก่อนเขียน

ก่อนเริ่มเขียน ให้อ่านและทำ mental map จากไฟล์เหล่านี้ตามลำดับความสำคัญ:

**A. Product & Vision**
- `README.md`
- `.lovable/plan.md` (roadmap / known gaps ล่าสุด)
- `public/llms.txt` (คำอธิบายสาธารณะสั้น)
- `src/pages/Landing.tsx` (positioning, features ที่ pitch)
- `src/i18n/en.ts`, `src/i18n/th.ts` (labels สื่อ intent จริง)

**B. Frontend**
- `src/App.tsx` (routes ทั้งหมด)
- `src/pages/**/*.tsx` (ทุกหน้า: Dashboard, AgentBuilder, AgentDetail, ChatConsole, Marketplace, Analytics, Monitor, ABTesting, DocsApi, WidgetPreview, Auth, Profile, Skills, Settings ฯลฯ)
- `src/components/agent-builder/**`, `src/components/agent-detail/**`, `src/components/dashboard/**`, `src/components/layout/**`
- `src/hooks/**` (data layer: useAgents, useApiKeys, useConversations, useKnowledge, useAnalytics, useWebhooks, useABTesting, useMessageFeedback, useErrorLogs, useSkills, useProfile ฯลฯ)
- `src/contexts/**` (AuthContext, ThemeContext, LanguageContext)
- `src/lib/**` (streamChat, agentTools, exportAnalytics, utils)
- `src/index.css` + `tailwind.config.ts` (design tokens, ธีม)
- `src/integrations/supabase/types.ts` (schema ที่ generate จาก DB — ใช้ยืนยันตาราง/คอลัมน์)

**C. Backend / Edge Functions**
- `supabase/functions/chat/index.ts` + `chat/_tools.ts` (internal chat, tool-calling, streaming)
- `supabase/functions/agent-api/index.ts` (public REST API — สำคัญมาก)
- `supabase/functions/issue-api-key/index.ts` (API key lifecycle, SHA-256 hashing)
- `supabase/functions/widget/index.ts` (embed script + fullpage iframe)
- `supabase/functions/extract-text/index.ts` (knowledge ingestion)
- `supabase/functions/test-webhook/index.ts`, `auth-email-hook/index.ts`, `process-email-queue/index.ts`

**D. Database**
- `supabase/migrations/*.sql` (อ่านทุกไฟล์ตามลำดับเวลา เพื่อเข้าใจ evolution ของ schema, RLS policies, GRANTs, security-definer functions)
- `supabase/config.toml` (function verify_jwt settings)

**E. Tests & Config**
- `src/lib/*.test.ts`, `supabase/functions/chat/_tools_test.ts`
- `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `package.json`

**สรุปสิ่งที่พบก่อน** (ในหัวคุณ ไม่ต้อง output): จำนวนหน้า, จำนวน hooks, จำนวน edge functions, จำนวนตาราง, จำนวน migration, tech ที่ใช้จริง

---

## 3. Required Table of Contents (บังคับ ห้ามข้าม)

รายงานต้องมีหัวข้อครบตามนี้ ตามลำดับนี้ พร้อม anchor links:

1. **Executive Summary** — 1 หน้า สรุปสิ่งที่โปรเจกต์เป็น, กลุ่มผู้ใช้, ความสามารถหลัก, สถานะปัจจุบัน
2. **Product Overview & Vision** — intent-first philosophy, ทำไมไม่ใช่ node-graph, target users (non-technical creators + developers), USP เทียบกับ LangFlow / Flowise / Dify
3. **System Architecture** — ต้องมี ASCII/Mermaid diagram แสดง flow:
   ```
   Browser (Vite SPA) ─┬─ Supabase Auth (JWT)
                       ├─ Supabase DB (Postgres + RLS)
                       ├─ Supabase Storage (knowledge-files bucket)
                       ├─ Edge Functions ── Lovable AI Gateway (LLM)
                       │                 ── Tavily (web search)
                       │                 ── Customer Webhooks
                       └─ Widget iframe (embedded on 3rd-party sites)
   ```
   อธิบาย request lifecycle 2 แบบ: (a) internal chat จาก ChatConsole, (b) external API call ผ่าน `/agent-api`
4. **Tech Stack & Rationale** — ตารางว่าใช้อะไร, version, ทำไมเลือก (React 18, Vite, Tailwind, shadcn, react-query, react-hook-form + zod, framer-motion, react-markdown, Supabase Edge Functions บน Deno, Lovable Cloud, Lovable AI Gateway)
5. **Data Model** — สำหรับทุกตาราง (agents, conversations, chat_messages, knowledge_files, agent_api_keys, api_key_usage, agent_webhooks, agent_ab_tests, ab_test_votes, agent_analytics_events, error_logs, message_feedback, skills, profiles, email_send_log, email_send_state, email_unsubscribe_tokens, suppressed_emails):
   - คอลัมน์สำคัญ + type
   - relations (FK)
   - RLS policies (ใครอ่าน/เขียนได้)
   - GRANT strategy (anon / authenticated / service_role)
   - หมายเหตุ design decision
   
   พร้อมส่วนย่อย **"Roles & `has_role` pattern"** อธิบายว่าทำไมแยก `user_roles` และใช้ SECURITY DEFINER
6. **Frontend Architecture**
   - Routing (`src/App.tsx`) — public vs `ProtectedRoute`
   - State: react-query + Context; ไม่มี Redux/Zustand
   - Design system: semantic tokens ใน `index.css`, shadcn variants, dark mode
   - i18n (TH default), Theme toggle (Header only)
   - Progressive-disclosure UI (Basic / Advanced toggles)
7. **Feature Deep-Dive** — ต่อ feature: user flow → components → hooks → tables → edge functions
   - Agent Builder (5-step wizard)
   - Chat Console (split-screen tester)
   - Knowledge Files (upload → extract-text → storage → context injection)
   - Marketplace (templates + cloning)
   - Monitor (Thought Process Timeline, real logs)
   - Analytics Dashboard (real usage stats)
   - A/B Testing (variants + votes)
   - Skills (reusable tool tags)
   - Message Feedback (👍/👎)
   - Webhooks (event dispatch)
8. **Edge Functions Reference** — ต่อฟังก์ชัน:
   - Purpose
   - `verify_jwt` setting
   - Input schema (headers + body)
   - Output schema (success + error)
   - Auth model (ANON key / user JWT / `x-api-key`)
   - Rate limits / body size limits
   - Error codes ทั้งหมด
   - ตัวอย่าง cURL 1 อัน
9. **Public Deployment Surface** (สำคัญที่สุดสำหรับนักพัฒนาภายนอก)
   - **REST API** (`/functions/v1/agent-api`): auth (`x-api-key`), request/response, session memory (`session_id`), `reset` action, streaming (`stream: true`), rate limit 60/min, body ≤256KB, `messages[]` ≤100
   - **Widget Embed**: bubble script vs fullpage iframe, query params (`theme`, `color`, `position`, `lang`, `welcome`, `auto_open`, `hide_branding`, `open_width`, `open_height`), postMessage resize protocol
   - **API Keys Lifecycle**: generate (plaintext shown once) → SHA-256 hash → prefix stored → revoke
   - **Webhooks**: events, HMAC signature (ถ้ามี), retry policy
   - ตัวอย่าง cURL / JavaScript fetch / Python requests / SSE streaming — พร้อมใช้จริง
10. **AI Layer**
    - Lovable AI Gateway endpoint, header (`Authorization: Bearer LOVABLE_API_KEY` หรือ `Lovable-API-Key`)
    - Model catalog ที่ระบบรองรับ (Gemini 2.5 flash/pro, GPT-5/mini/nano, Gemini 3 flash preview)
    - `normalizeModel()` mapping (legacy names → gateway ids)
    - Temperature quirk สำหรับ `openai/gpt-5*` (ต้องไม่ส่ง `temperature`)
    - Tool-calling (`chat/_tools.ts`): web-search, calculator ฯลฯ
    - Streaming (SSE)
    - Knowledge injection strategy
    - System prompt composition: base persona + `_userPrompt` template + knowledge context
11. **Security**
    - RLS on every public table + GRANT rules
    - Security-definer functions พร้อม `SET search_path = public` (fix findings ล่าสุด)
    - Role separation via `user_roles` + `has_role()`
    - API key hashing (SHA-256, plaintext returned exactly once, prefix-only display)
    - Rate limiting (`increment_api_key_usage` RPC, 60/min window)
    - Secrets ที่ใช้ (LOVABLE_API_KEY, SUPABASE_SERVICE_ROLE_KEY, TAVILY_API_KEY) — เก็บที่ไหน, ห้ามส่งเข้า client
    - Threat model ที่ยังเปิดอยู่ (widget ไม่มี domain allowlist ฯลฯ — อ้าง `.lovable/plan.md`)
12. **Observability**
    - `error_logs` — schema, ใครเขียน, ใครอ่าน
    - `agent_analytics_events` — event types, ใช้ทำอะไร
    - `api_key_usage` — rate-limit counter, สรุปสถิติได้
    - Lovable AI Gateway logs (external, ผ่าน dashboard)
13. **Email & Async Jobs**
    - `pgmq` queues (`enqueue_email`, `read_email_batch`, `delete_email`, `move_to_dlq`)
    - `auth-email-hook` (verify_jwt=false) — magic link, recovery, invite, signup templates ใน `_shared/email-templates/**`
    - `process-email-queue` (cron/manual trigger)
    - Suppression list, unsubscribe tokens
14. **Non-Functional Requirements**
    - Performance: streaming reduces TTFB, react-query cache
    - Scalability limits: 60 req/min per API key, body 256KB, messages 100, max content 32k chars
    - Reliability: Edge Function cold start, DB pooling
    - Accessibility: shadcn base (Radix), sr-only labels, keyboard nav
    - i18n: TH/EN parity
    - SEO: llms.txt, sitemap, robots
15. **Developer Onboarding**
    - Prerequisites (Node LTS, bun/npm)
    - Env vars ที่ Vite ต้องรู้ (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) — ห้าม commit service role
    - Local dev flow (`npm run dev`, `npm test`)
    - Deploy flow ผ่าน Lovable (edge functions auto-deploy on save)
    - How to add a new edge function / migration / page — mini checklist
16. **Known Gaps & Roadmap** — สรุปจาก `.lovable/plan.md` (widget bubble sizing, domain allowlist, publish enforcement, docs polish ฯลฯ) แบบ prioritized
17. **Appendix**
    - Glossary (Agent, Intent, Skill, Template, Conversation, Session, Knowledge, Widget)
    - Endpoint cheat-sheet (ตารางเดียว)
    - Full sample code: cURL / JS (fetch + SSE) / Python (requests + sseclient)
    - Migration history timeline (ใช้ชื่อไฟล์เป็นสรุปสั้น ๆ)
    - License / contribution notes (ถ้ามี)

---

## 4. Writing Style Rules

- **ภาษา**: หัวข้อ (H1–H3) แสดงคู่ TH / EN เช่น `## 5. Data Model / โครงสร้างข้อมูล` เนื้อหาเขียนภาษาไทยเป็นหลัก, ศัพท์เทคนิคคงภาษาอังกฤษ
- **Format**: Markdown ล้วน (GitHub-flavored)
- **Diagrams**: ใช้ Mermaid (` ```mermaid `) เป็นหลัก, ASCII เป็นสำรอง
- **Code blocks**: ต้องระบุภาษา (` ```ts `, ` ```sql `, ` ```bash `, ` ```json `)
- **Tables**: ใช้สำหรับ schema, endpoint list, error codes
- **Citations**: อ้างไฟล์ทุกครั้งที่กล่าวถึง logic เช่น `see supabase/functions/agent-api/index.ts:120–145`
- **ห้าม**: fluff การตลาด, emoji เกินจำเป็น, "In today's fast-paced world...", placeholder `TODO`, ตัวอย่างที่ยังไม่ verify
- **น้ำเสียง**: กระชับ ตรงประเด็น เหมือน internal docs ของบริษัท tech

---

## 5. Quality Checklist (Claude ต้องเช็คตัวเองก่อนส่ง)

ก่อน output ไฟล์สุดท้าย ให้ตอบคำถามเหล่านี้ในหัวก่อน:

- [ ] ทุกตาราง 18 ตัว ถูกกล่าวถึงในหมวด Data Model แล้วหรือยัง?
- [ ] ทุก edge function 8+ ตัว มี section reference ครบหรือยัง?
- [ ] ทุก page ใน `src/pages/` ถูกอ้างอิงอย่างน้อย 1 ครั้งหรือยัง?
- [ ] ตัวอย่าง cURL/JS/Python สำหรับ `/agent-api` ทดสอบด้วยตา syntax ผ่านหรือยัง?
- [ ] Security decision ทุกข้อ (RLS, GRANT, hash, rate-limit) มีเหตุผลกำกับหรือยัง?
- [ ] Diagram อย่างน้อย 2 อัน (architecture + request lifecycle) มีแล้วหรือยัง?
- [ ] ไม่มี "TODO", "TBD", "example.com", `[fill in]` เหลืออยู่หรือยัง?
- [ ] ไม่ได้เผยแพร่ SUPABASE_SERVICE_ROLE_KEY, DB password, หรือ dashboard URL ในเนื้อหาหรือไม่?
- [ ] ความยาว 8,000–15,000 คำ ครบถ้วนแต่ไม่ยืด?
- [ ] TOC anchor links ใช้งานได้ทุกอัน?

ถ้าข้อไหนตอบไม่ผ่าน — แก้ก่อน output

---

## 6. Deliverable Format

ส่งเป็น **ไฟล์เดียว**: `TECHNICAL_REPORT.md`

- ขึ้นต้นด้วย front-matter สั้น ๆ:
  ```markdown
  # ThoughtMind — Technical Report
  _Version: <derive from latest migration date> · Generated: <today>_
  _Audience: Engineers, Solution Architects, Enterprise Buyers_
  ```
- ตามด้วย TOC (auto-linked)
- ตามด้วยเนื้อหาตาม section 3
- ปิดท้ายด้วย appendix

ห้ามส่งไฟล์อื่น ห้ามส่งเป็นหลายไฟล์ ห้ามใส่ commentary นอกไฟล์

===== END PROMPT =====

---

## หมายเหตุการใช้งาน (สำหรับเจ้าของโปรเจกต์)

1. **แนบ codebase**: zip ทั้งโปรเจกต์ (ยกเว้น `node_modules/`, `dist/`, `.env`) แล้ว upload ไปกับ prompt นี้ หรือใช้ Claude Code / Projects ที่เห็นไฟล์ทั้งหมดอยู่แล้ว
2. **โมเดลแนะนำ**: Claude Sonnet 4.5+ หรือ Opus (context window ≥200k tokens)
3. **ถ้ารายงานยาวเกิน 1 turn**: บอก Claude ว่า `"Continue from where you stopped, do not restart"` แล้ว concat เอง
4. **หลังได้ไฟล์**: review ตัว Quality Checklist ด้วยตาอีกครั้ง โดยเฉพาะเรื่อง security (ต้องไม่มี key จริงหลุด)
5. **อัปเดตรายงาน**: เมื่อ codebase เปลี่ยน ให้รัน prompt เดิมซ้ำ — output ควรเปลี่ยนตาม migration/feature ใหม่โดยอัตโนมัติ
