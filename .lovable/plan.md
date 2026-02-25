

# แก้ไข DOCX Extraction และเพิ่ม XLSX/XLS ใน Knowledge Tab

## ปัญหาที่พบ

จาก Edge Function logs พบว่า Gemini API ไม่รองรับไฟล์ DOCX ผ่าน `image_url` -- ตอบกลับ error: `Unsupported MIME type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` หลังจากนั้น fallback ไปใช้ basic regex extractor ซึ่งไม่สามารถอ่านภาษาไทยจาก DOCX ที่ถูกบีบอัดได้ ปัญหาเดียวกันเกิดกับ XLSX ด้วย

## วิธีแก้ไข

### 1. ปรับปรุง `supabase/functions/extract-text/index.ts`

**แนวทาง:** สำหรับ DOCX และ XLSX ให้แยก XML/text content จาก ZIP archive ก่อน แล้วส่ง text content (ไม่ใช่ binary) ไปให้ AI แปลงเป็นข้อความที่อ่านได้

- **DOCX:** ใช้ ZIP parsing เพื่อหาไฟล์ `word/document.xml` จาก DOCX (ซึ่งเป็น ZIP format) แล้วส่ง raw XML ไปให้ AI ทำ text extraction แทนการส่ง binary
- **XLSX:** ใช้ ZIP parsing เพื่อหาไฟล์ `xl/sharedStrings.xml` และ `xl/worksheets/sheet*.xml` แล้วส่ง XML ไปให้ AI แปลงเป็น markdown table
- เปลี่ยนจาก `image_url` เป็นส่ง raw XML text ใน message content ธรรมดา ซึ่ง Gemini รองรับได้ดี
- คงไว้ซึ่ง fallback to basic extraction หาก AI ไม่พร้อมใช้งาน

**ฟังก์ชันใหม่ที่จะเพิ่ม:**
- `extractXmlFromZip(blob, targetPath)` -- ใช้ manual ZIP parsing (Local File Header signature) เพื่อ decompress ไฟล์จาก ZIP archive โดยใช้ DecompressionStream API ของ Deno
- ปรับ `extractTextWithAI` ให้รับ parameter เพิ่มเติมเป็น pre-extracted text content สำหรับกรณี DOCX/XLSX

### 2. เพิ่ม `.xlsx` / `.xls` ใน ALLOWED_EXTS ของ Knowledge Tab

ใน `src/pages/AgentDetail.tsx` บรรทัด 81 เพิ่ม `"xlsx"`, `"xls"` เข้าไปใน `ALLOWED_EXTS` array เพื่อให้ UI ยอมรับไฟล์ Excel ด้วย (ตอนนี้มีแค่ใน Agent Builder)

### ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `supabase/functions/extract-text/index.ts` | เพิ่ม ZIP parser, ส่ง XML text แทน binary ไป AI สำหรับ DOCX/XLSX |
| `src/pages/AgentDetail.tsx` | เพิ่ม xlsx, xls ใน ALLOWED_EXTS |

### รายละเอียดเทคนิค

**ZIP Parsing สำหรับ DOCX/XLSX:**

DOCX และ XLSX เป็นไฟล์ ZIP ที่มีโครงสร้าง XML ภายใน วิธีที่จะใช้:
1. อ่าน Central Directory ของ ZIP เพื่อหาตำแหน่งไฟล์
2. Extract ไฟล์ XML ที่ต้องการ (เช่น `word/document.xml` สำหรับ DOCX)
3. Decompress ด้วย DecompressionStream (raw deflate)
4. ส่ง XML text ไปให้ AI model เพื่อแปลงเป็นข้อความสะอาด

**AI Prompt สำหรับ XML-based extraction:**

แทนที่จะส่ง binary ผ่าน `image_url` จะส่ง XML content เป็น text message ธรรมดา พร้อม prompt ให้ AI ดึงข้อความออกมาอย่างถูกต้อง รวมถึงรักษาภาษาไทยและโครงสร้างเดิม

