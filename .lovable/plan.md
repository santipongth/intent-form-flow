

# Agent Templates Marketplace

## Overview
เพิ่มหน้า Marketplace สำหรับ browse, ให้คะแนน, และ clone template ได้ในคลิกเดียว พร้อม gallery view, category filter, search, และ rating system

---

## Changes

### 1. Mock Data - เพิ่ม Marketplace Templates
**File:** `src/data/mockData.ts`

เพิ่ม interface `MarketplaceTemplate` และ mock data array `MARKETPLACE_TEMPLATES` ขยายจาก TEMPLATES เดิม โดยเพิ่มฟิลด์:
- `author` - ชื่อผู้สร้าง
- `rating` - คะแนน (1-5)
- `reviewCount` - จำนวนรีวิว
- `usageCount` - จำนวนคนที่ใช้
- `tags` - แท็กเช่น "RAG", "Chatbot", "Automation"
- `featured` - boolean สำหรับ template แนะนำ
- `previewDescription` - คำอธิบายยาวขึ้น

Mock data 8-10 templates ครอบคลุมหลาย category

### 2. Marketplace Page
**File:** `src/pages/Marketplace.tsx`

Layout ประกอบด้วย:
- **Header** - ชื่อ "Template Marketplace" + คำอธิบาย
- **Search bar** - ค้นหา template ตามชื่อ/คำอธิบาย
- **Category filter** - ปุ่ม pill สำหรับกรอง (All, Knowledge, Research, Support, Dev, Content, Analytics)
- **Featured section** - แถว template แนะนำ (1-2 การ์ดใหญ่)
- **Template Grid** - การ์ดแสดง template ทั้งหมดในรูปแบบ grid

**Template Card แต่ละใบ:**
- Gradient header ตาม category color
- ชื่อ + emoji icon
- คำอธิบายสั้น
- Star rating (แสดงดาวสี + คะแนน)
- จำนวนผู้ใช้ (เช่น "2.3K ใช้งาน")
- ชื่อผู้สร้าง
- Tags
- ปุ่ม "ใช้ Template นี้" (One-click clone) -> navigate ไป `/agents/new?template={id}`

**Interactions:**
- Search filter แบบ real-time
- Category filter toggle
- คลิก card เปิด detail dialog
- ปุ่ม clone navigate ไป Agent Builder พร้อม pre-fill template

### 3. Template Detail Dialog
อยู่ใน Marketplace page เป็น Dialog/Sheet:
- รายละเอียดเต็มของ template
- Preview description ยาว
- Tools ที่ใช้
- Model ที่แนะนำ
- ปุ่ม "ใช้ Template นี้" ขนาดใหญ่

### 4. Route & Navigation
**File:** `src/App.tsx` - เพิ่ม route `/marketplace`

**File:** `src/components/layout/AppSidebar.tsx` - เพิ่มเมนู "Marketplace" ด้วยไอคอน `Store` จาก lucide-react ระหว่าง Agents กับ Chat

---

## Technical Details

- ใช้ `framer-motion` สำหรับ card entrance animations (ตาม pattern ใน Dashboard)
- ใช้ Shadcn Dialog สำหรับ template detail popup
- Star rating ใช้ lucide `Star` icon render ตามคะแนน
- Category filter ใช้ state toggle ธรรมดา
- Search ใช้ `useMemo` filter จาก mock data
- ปุ่ม clone ใช้ `useNavigate` ส่ง query param `?template=xxx` ไปหน้า Agent Builder
