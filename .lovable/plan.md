# แผน: สร้าง Master Prompt สำหรับ Technical Report

## เป้าหมาย
สร้างไฟล์ `docs/technical-report-prompt.md` เก็บ "master prompt" 1 ก้อน ที่ผู้ใช้สามารถคัดลอกไปให้ Claude (หรือ LLM ตัวอื่น) พร้อมกับ codebase เพื่อผลิตเอกสาร Technical Report ฉบับสมบูรณ์ของโปรเจกต์ ThoughtMind

## ขอบเขตที่ prompt จะสั่ง Claude ให้ครอบคลุม
จากการสแกน codebase พบว่าโปรเจกต์มีองค์ประกอบเหล่านี้ที่ต้องอธิบายในรายงาน:

- **Vision / PRD**: intent-first agent platform ("LangFlow for normal people"), wizard-based
- **Frontend**: Vite + React 18 + TS + Tailwind + shadcn, 20 หน้า (Landing, Auth, Dashboard, AgentBuilder, AgentDetail, ChatConsole, Marketplace, Analytics, Monitor, ABTesting, DocsApi, WidgetPreview, ฯลฯ)
- **Backend (Lovable Cloud / Supabase)**: 18 ตาราง (agents, conversations, chat_messages, knowledge_files, agent_api_keys, api_key_usage, webhooks, ab_tests, analytics_events, error_logs, message_feedback, skills, profiles, email_* ฯลฯ), RLS + GRANT policies, 8+ security-definer functions
- **Edge Functions**: `chat`, `agent-api`, `issue-api-key`, `widget`, `extract-text`, `test-webhook`, `auth-email-hook`, `process-email-queue`
- **AI Integration**: Lovable AI Gateway (Gemini/GPT-5 family), tool-calling, streaming, knowledge injection
- **Deploy surface**: Public REST API (`x-api-key`), Widget (bubble + fullpage iframe), Webhooks
- **Ops**: analytics events, error logs, rate limiting (60/min), feedback, A/B tests, email queue (pgmq)

## โครงสร้างของ Master Prompt ที่จะเขียน
Prompt จะประกอบด้วย 6 บล็อกชัดเจน:

1. **Role & Mission** — ตั้งให้ Claude เป็น Senior Technical Writer + Solutions Architect
2. **Context ingestion instructions** — บอกให้อ่าน `.lovable/plan.md`, `README.md`, `src/**`, `supabase/functions/**`, `supabase/migrations/**`, `src/integrations/supabase/types.ts`, `mem://` (ถ้ามี), แล้วสรุปก่อนเขียน
3. **Required Output — Table of Contents** ที่บังคับ:
   1. Executive Summary
   2. Product Overview & Vision (intent-first, target users, USP)
   3. System Architecture (diagram ASCII: Browser ↔ Vite SPA ↔ Supabase Auth/DB/Storage/Edge Functions ↔ Lovable AI Gateway ↔ 3rd-party webhooks)
   4. Tech Stack & Rationale
   5. Data Model (ทุกตาราง + คอลัมน์สำคัญ + relations + RLS strategy + `has_role` pattern)
   6. Frontend Architecture (routing, state = react-query + context, i18n, theme, design tokens ใน `index.css`)
   7. Feature Deep-Dive: Agent Builder wizard, Chat Console, Knowledge upload/RAG, Marketplace, Monitor, Analytics, A/B testing, Skills
   8. Edge Functions reference (ต่อฟังก์ชัน: purpose, input, output, auth model, errors)
   9. Public Deployment Surface: REST API (`/agent-api`), Widget embed, Webhooks, API Keys lifecycle, rate limits, session memory
   10. AI Layer (Gateway, model normalization, tool-calling, streaming, temperature rules สำหรับ gpt-5)
   11. Security (RLS + GRANT, security-definer + search_path, API key hashing SHA-256, role separation)
   12. Observability (error_logs, analytics_events, api_key_usage, ai_gateway logs)
   13. Email & Async jobs (pgmq queues, auth-email-hook, process-email-queue)
   14. Non-functional: performance, scalability limits, known constraints (body ≤256KB, messages ≤100)
   15. Developer Onboarding (env vars, local dev, deploy flow via Lovable)
   16. Known Gaps / Roadmap (อ้างอิงจาก `.lovable/plan.md`)
   17. Appendix: Glossary, endpoint cheat-sheet, sample cURL/JS/Python
4. **Writing style rules** — bilingual TH/EN headings, Markdown, mermaid/ASCII diagrams, code blocks with language tags, tables for schemas, no marketing fluff, cite file paths เช่น `supabase/functions/agent-api/index.ts:120`
5. **Quality checklist** ที่ Claude ต้องเช็คตัวเองก่อนส่ง (ทุกตาราง ทุก edge function ถูกกล่าวถึง; ทุก endpoint มีตัวอย่าง; ทุก security decision มีเหตุผล; ไม่มี placeholder "TODO")
6. **Deliverable format** — ส่งเป็น 1 ไฟล์ `TECHNICAL_REPORT.md` พร้อม TOC มี anchor links, ประมาณ 8,000–15,000 คำ

## ไฟล์ที่จะสร้าง
- `docs/technical-report-prompt.md` — master prompt (ภาษาไทยเป็นหลัก + คีย์เวิร์ดอังกฤษ) พร้อมใช้งาน คัดลอกวางส่งให้ Claude ได้เลย

## ไม่เปลี่ยนแปลง
ไม่แก้ source code, ไม่ยุ่ง schema, ไม่ deploy อะไร — เป็นเอกสารล้วน

ถ้าโอเค กด Approve เพื่อให้สร้างไฟล์ได้เลยครับ หรือบอกว่าอยากปรับ TOC / เพิ่มหัวข้อ / เปลี่ยนภาษาเป็นอังกฤษล้วน ก็แจ้งได้
