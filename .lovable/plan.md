

# แก้ไขปัญหา PDF/DOCX Text Extraction และปรับปรุง Drag-and-Drop

## ปัญหาที่พบ

จากการตรวจสอบ logs พบว่าไฟล์ PDF (Recap.pdf) ค้างอยู่ในสถานะ "processing" เนื่องจาก extract-text function เกิด error:

```text
"unsupported Unicode escape sequence" -- \u0000 cannot be converted to text
```

สาเหตุ: ข้อความที่ extract จาก PDF มีตัวอักษร null byte (`\0`) ซึ่ง PostgreSQL ไม่รองรับในคอลัมน์ประเภท text

## แผนการแก้ไข

### 1. แก้ไข extract-text Edge Function

**ไฟล์:** `supabase/functions/extract-text/index.ts`

- เพิ่มฟังก์ชัน `sanitizeText()` เพื่อลบ null bytes และ control characters ที่ไม่สามารถเก็บใน PostgreSQL ได้
- เรียก `sanitizeText()` ก่อนบันทึกลงฐานข้อมูลทุกครั้ง ไม่ว่าจะเป็นไฟล์ประเภทใด
- ปรับปรุง error handling ให้อัปเดตสถานะเป็น "error" เมื่อเกิดข้อผิดพลาดระหว่าง extraction

### 2. ปรับปรุง PDF Text Extraction

- ปรับ `extractTextFromPdf()` ให้ลบ null bytes ออกจาก raw binary ก่อนประมวลผล
- เพิ่มการ decode octal escape sequences (เช่น `\050`, `\051`) ที่พบในไฟล์ PDF บางประเภท
- ปรับปรุง regex ให้จับข้อความได้ครอบคลุมมากขึ้น

### 3. ปรับปรุง DOCX Text Extraction

- เพิ่มการจัดการ paragraph breaks (`</w:p>`) ให้แยกเป็นบรรทัดใหม่อย่างถูกต้อง
- เพิ่มการลบ null bytes จากผลลัพธ์

## รายละเอียดทางเทคนิค

### ฟังก์ชัน sanitizeText

```text
function sanitizeText(text: string): string
  - ลบ \u0000 (null byte) ทั้งหมด
  - ลบ control characters ช่วง \u0001-\u0008, \u000B, \u000C, \u000E-\u001F
  - คงไว้เฉพาะ \t (tab), \n (newline), \r (carriage return)
```

### Flow การทำงานหลังแก้ไข

```text
Extract text from file
  --> sanitizeText() ลบอักขระที่ PostgreSQL ไม่รองรับ
  --> Truncate ถ้าเกิน 100,000 ตัวอักษร
  --> บันทึกลงฐานข้อมูล (status: ready)
  --> หากเกิด error ใดๆ --> อัปเดต status เป็น "error"
```

### ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `supabase/functions/extract-text/index.ts` | เพิ่ม sanitizeText, ปรับปรุง PDF/DOCX extraction, แก้ error handling |

