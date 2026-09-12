# Technical Report (ไม่เกิน 10 หน้า) — ไฟล์ DOCX ดาวน์โหลดได้

## เป้าหมาย
สร้างรายงานเชิงเทคนิคของ ThoughtMind แบบกระชับ ความยาวไม่เกิน 10 หน้า ภาษาไทย (ศัพท์เทคนิคคงภาษาอังกฤษ) ส่งเป็นไฟล์ `.docx` ที่ดาวน์โหลดได้ทันทีจากแชท พร้อมไฟล์ `.pdf` ไว้เปิดอ่านเร็ว ๆ (ไฟล์คู่มือเดิมไม่ถูกแตะต้อง)

## โครงรายงาน (ประมาณหน้า)
1. หน้าปก + สรุปผู้บริหาร (1 หน้า) — ระบบคืออะไร ใครใช้ สถานะปัจจุบัน
2. ภาพรวมสถาปัตยกรรม (1.5 หน้า) — แผนภาพ Browser → Auth / DB / Storage / Edge Functions → AI Gateway, Tavily, Webhooks, Widget iframe
3. Tech stack และเหตุผลการเลือก (0.5 หน้า) — ตารางสั้น
4. โครงสร้างข้อมูล (1.5 หน้า) — ตารางหลัก (agents, conversations, chat_messages, knowledge_files, knowledge_chunks, agent_api_keys, api_key_usage, agent_traces, webhooks, budgets, skills, profiles ฯลฯ) แบบสรุป + หลัก RLS/GRANT
5. ความสามารถหลักของระบบ (1.5 หน้า) — Agent Builder, Chat Console, Knowledge/RAG, Marketplace/Showcase, Monitor, Analytics/Compare, Guardrails, Budgets, Custom tools/MCP
6. Edge Functions และ Public API (2 หน้า) — ตารางฟังก์ชัน, auth model, `/agent-api` (x-api-key, session memory, reset, streaming, rate limit) + ตัวอย่าง cURL 1 ชุด และ Widget embed
7. AI layer (0.5 หน้า) — โมเดลที่รองรับ, normalize model id, tool-calling loop, citations, verify-answer
8. ความปลอดภัยและการติดตามผล (0.5 หน้า) — RLS, hash API key, SSRF guard, rate limit, traces/error logs
9. ข้อจำกัดและแผนพัฒนาต่อ (0.5 หน้า)

## วิธีทำ
- อ่านไฟล์จริงในโปรเจกต์ก่อนเขียนทุกหัวข้อ: `src/App.tsx`, `src/integrations/supabase/types.ts`, `supabase/functions/**`, `supabase/config.toml`, หน้า `src/pages/**` ที่เกี่ยวข้อง — ไม่ใส่ข้อมูลที่ยังไม่ได้ยืนยัน
- ใช้สคริปต์สร้างเอกสาร (`docx` ผ่าน Node หรือ `python-docx`) เขียนไปที่ `/mnt/documents/ThoughtMind-Technical-Report-TH.docx`
- แปลงเป็น PDF แล้วตรวจ **ทุกหน้า** เป็นภาพ: ฟอนต์ไทยถูกต้อง ไม่มีข้อความล้น/ถูกตัด ตารางไม่เพี้ยน และ **นับหน้าไม่เกิน 10** ถ้าเกินให้ตัดเนื้อหาแล้วสร้างใหม่
- ไม่มีคีย์ลับ ไม่มี dashboard URL ในเอกสาร

## หมายเหตุทางเทคนิค
- ไม่แก้ไฟล์โค้ดของแอปเลย งานนี้เป็นการสร้างเอกสารอย่างเดียว
- หน้ากระดาษ A4 ขอบ 1 นิ้ว ฟอนต์ไทยที่รองรับ (เช่น Noto Sans Thai/Sarabun) ขนาด 10–11 pt เพื่อให้เนื้อหาพอดี 10 หน้า
- แผนภาพสถาปัตยกรรมใช้แบบ ASCII/กล่องข้อความในเอกสาร เพื่อให้แก้ไขต่อได้ใน Word
