

# เพิ่มระบบ Upload Knowledge Files จริงไปยัง Cloud Storage

## Overview
เปลี่ยนระบบ Upload ไฟล์ใน AgentBuilder Step 3 (Knowledge) จาก mock (เพิ่มชื่อไฟล์ปลอม) เป็นการอัพโหลดไฟล์จริงไปยัง Cloud Storage พร้อมแสดงสถานะ upload และเชื่อมโยง URL ไฟล์กับ Agent

---

## ขั้นตอนที่ 1: สร้าง Storage Bucket

สร้าง migration เพื่อสร้าง bucket `knowledge-files` พร้อม RLS policies:
- Bucket แบบ private (ไม่เป็น public)
- Users สามารถ upload, view, delete เฉพาะไฟล์ของตัวเอง
- โครงสร้างไฟล์: `{user_id}/{filename}`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('knowledge-files', 'knowledge-files', false);

CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'knowledge-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ขั้นตอนที่ 2: แก้ไข AgentBuilder.tsx

### เปลี่ยน state จาก `string[]` เป็น `UploadedFile[]`
```typescript
interface UploadedFile {
  name: string;
  path: string;       // path ใน storage
  size: number;
  uploading: boolean;
}
```

### เพิ่ม hidden file input + drag-and-drop
- ใช้ `<input type="file" accept=".pdf,.doc,.docx,.txt" multiple>` แบบซ่อน
- ปุ่ม "เลือกไฟล์" trigger input click
- รองรับ drag & drop บน Card (onDragOver, onDrop)
- จำกัดขนาดไฟล์ 20MB

### Upload logic
- เมื่อเลือกไฟล์ -> upload ทันทีไปยัง `knowledge-files/{user_id}/{filename}`
- แสดง uploading state (spinner/progress) ระหว่าง upload
- เมื่อสำเร็จ -> เพิ่มเข้า files state พร้อม path
- เมื่อ error -> แสดง toast error

### ลบไฟล์
- กดปุ่ม X -> ลบไฟล์จาก storage จริง + ลบออกจาก state

### เชื่อมกับ handleCreate
- ตอนสร้าง Agent -> บันทึก file paths ลงใน `knowledge_urls` ของ agents table (รวมกับ URL ที่เพิ่มด้วยมือ)

---

## ขั้นตอนที่ 3: แสดงขนาดไฟล์ + สถานะ

- แสดงชื่อไฟล์ + ขนาด (เช่น "document.pdf - 2.4 MB")
- แสดง Loader icon ระหว่าง uploading
- ปุ่มลบจะ disabled ระหว่าง uploading

---

## สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | Action |
|------|--------|
| Database migration (storage bucket) | สร้างใหม่ |
| `src/pages/AgentBuilder.tsx` | แก้ไข |

