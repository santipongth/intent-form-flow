

# ระบบ Knowledge Base สำหรับ Agent -- อัปโหลดไฟล์จริง + ใช้เป็นข้อมูลอ้างอิง

## Overview
สร้างระบบ Knowledge Base แบบครบวงจร: อัปโหลดไฟล์ PDF/TXT ไปยัง Storage จริง, บันทึก metadata ในฐานข้อมูล, แสดง UI จัดการไฟล์ในหน้า Agent Detail, และให้ chat edge function ดึงเนื้อหาไฟล์มาใส่ใน context ก่อนส่งให้ AI ตอบ

## Changes

### 1. สร้าง Storage Bucket "knowledge-files" (Database Migration)
- สร้าง bucket `knowledge-files` แบบ private
- เพิ่ม RLS policies ให้ผู้ใช้อัปโหลด/อ่าน/ลบเฉพาะไฟล์ของตัวเอง (path pattern: `{user_id}/{agent_id}/{filename}`)

### 2. สร้างตาราง `knowledge_files` (Database Migration)
- Columns: `id`, `agent_id`, `user_id`, `file_name`, `file_path`, `file_size`, `file_type`, `content` (text -- เนื้อหาที่ extract แล้ว), `status`, `created_at`
- RLS policy: users manage own files (`auth.uid() = user_id`)

### 3. สร้าง Edge Function `extract-text` สำหรับ extract เนื้อหาจากไฟล์
- รับ `file_path` และ `knowledge_file_id`
- ดาวน์โหลดไฟล์จาก storage
- Extract text (TXT อ่านตรง, PDF ใช้ basic text extraction)
- อัปเดตคอลัมน์ `content` และ `status` = 'ready'

### 4. อัปเดต Hook `useKnowledge.ts`
- เพิ่ม `useUploadKnowledgeFile` mutation: อัปโหลดไฟล์ไป storage, insert metadata ลง DB, เรียก extract-text function
- ลบไฟล์: ลบทั้งจาก storage และ DB

### 5. เพิ่มแท็บ Knowledge ในหน้า Agent Detail (`src/pages/AgentDetail.tsx`)
- เพิ่มแท็บที่ 3 "Knowledge" ใน TabsList
- แสดงรายการไฟล์ที่อัปโหลดแล้ว พร้อมสถานะ (processing/ready/error)
- ปุ่มอัปโหลดไฟล์ใหม่ (รองรับ PDF, TXT)
- ปุ่มลบไฟล์แต่ละตัว
- แสดง file size และวันที่อัปโหลด

### 6. อัปเดต AgentBuilder Knowledge step (step 2)
- เปลี่ยนจาก mock file upload เป็นอัปโหลดจริงผ่าน input[type=file]
- ใช้ `useUploadKnowledgeFile` หลังสร้าง agent สำเร็จ (หรือเก็บไฟล์ไว้ก่อนแล้วอัปโหลดทีหลัง)

### 7. อัปเดต Chat Edge Function ให้ใช้ Knowledge
- เมื่อมี `agent_id`: ดึง `knowledge_files` ที่ `status = 'ready'` ของ agent นั้น
- นำ `content` มาต่อเข้ากับ system prompt เป็น context
- จำกัดขนาด context เพื่อไม่ให้เกิน token limit (ตัดที่ ~50,000 ตัวอักษร)

### 8. เพิ่ม i18n keys
- เพิ่ม keys สำหรับ Knowledge tab, upload, status, delete ทั้งภาษาไทยและอังกฤษ

## Technical Details

### Files to Create
| File | Description |
|------|-------------|
| `supabase/functions/extract-text/index.ts` | Edge function สำหรับ extract text จากไฟล์ |

### Files to Modify
| File | Changes |
|------|---------|
| Database migration | สร้าง bucket + ตาราง knowledge_files + RLS |
| `src/hooks/useKnowledge.ts` | เพิ่ม upload mutation, แก้ delete ให้ลบ storage ด้วย |
| `src/pages/AgentDetail.tsx` | เพิ่มแท็บ Knowledge พร้อม UI อัปโหลด/จัดการไฟล์ |
| `src/pages/AgentBuilder.tsx` | เปลี่ยน Knowledge step ให้อัปโหลดจริง |
| `supabase/functions/chat/index.ts` | ดึง knowledge content มาใส่ system prompt |
| `src/i18n/en.ts` | เพิ่ม knowledge-related keys |
| `src/i18n/th.ts` | เพิ่ม knowledge-related keys |

### Flow การทำงาน
```text
User uploads file
  --> Storage (knowledge-files bucket)
  --> Insert metadata to knowledge_files table (status: 'processing')
  --> Call extract-text edge function
      --> Download file from storage
      --> Extract text content
      --> Update knowledge_files.content + status = 'ready'

User chats with agent
  --> Chat edge function
      --> Query knowledge_files WHERE agent_id = X AND status = 'ready'
      --> Append file contents to system prompt as reference context
      --> Send to AI gateway
```

### Context Injection Format (ใน system prompt)
```text
{original system prompt}

---
Reference Documents:
[Document: filename.pdf]
{extracted text content}

[Document: notes.txt]
{extracted text content}
---

Use the above documents as reference to answer questions accurately.
```

