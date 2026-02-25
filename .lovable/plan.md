
# Pre-fill Agent Builder from Template Query Param

## Overview
เมื่อผู้ใช้กด "ใช้ Template นี้" จาก Marketplace จะ navigate มาที่ `/agents/new?template=xxx` ระบบจะอ่าน query param แล้ว pre-fill ฟอร์มทั้งหมดจาก `MARKETPLACE_TEMPLATES` อัตโนมัติ พร้อมข้ามไป Step 2 (Identity & Model) เลย

## Changes

### File: `src/pages/AgentBuilder.tsx`

1. **Import เพิ่ม**: เพิ่ม `useSearchParams` จาก `react-router-dom` และ import `MARKETPLACE_TEMPLATES` จาก mockData

2. **useEffect สำหรับ pre-fill**: เมื่อ component mount จะอ่าน `?template=xxx` จาก URL แล้ว:
   - ค้นหา template จาก `MARKETPLACE_TEMPLATES` ด้วย id
   - ถ้าเจอ จะ pre-fill ค่าต่อไปนี้:
     - `selectedTemplate` = template id
     - `name` = ชื่อ template (ตัด emoji ออก)
     - `objective` = description
     - `tools` = เปิด tools ตามที่ template กำหนด
     - `selectedModel` + `selectedProvider` = จับคู่จาก `recommendedModel` กับ `LLM_MODELS`
   - ข้าม Step 1 ไปที่ Step 2 (Identity) โดยอัตโนมัติ เพราะ template ถูกเลือกแล้ว
   - แสดง toast แจ้งว่าโหลด template สำเร็จ

3. **แสดง banner เล็กๆ** ที่ Step 1 ว่ามี template ถูกเลือกจาก Marketplace แล้ว (ถ้ามี query param)

---

### Technical Details

- ใช้ `useSearchParams` แทน manual parsing ของ `window.location`
- `useEffect` รันครั้งเดียวตอน mount (dependency: `searchParams`)
- จับคู่ `recommendedModel` กับ provider โดย loop หา model ใน `LLM_MODELS` array
- ไม่มี dependency ใหม่ ใช้ของที่มีอยู่แล้วทั้งหมด
