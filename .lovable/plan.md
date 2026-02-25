

# Deploy / Publish Panel

## Overview
เพิ่มหน้า Deploy/Publish สำหรับ Agent ที่สร้างเสร็จแล้ว แสดง embed code, API endpoint, widget preview และ API key พร้อม copy-to-clipboard

---

## Changes

### 1. New Page: `src/pages/DeployPanel.tsx`

หน้า Deploy แสดงข้อมูลสำหรับ agent ที่เลือก (ใช้ query param `?agent=xxx` หรือ default agent) ประกอบด้วย:

**Header Section:**
- ชื่อ Agent + สถานะ (Draft/Published) พร้อมปุ่ม "Publish" toggle
- Badge แสดง model ที่ใช้

**4 Tabs (ใช้ Shadcn Tabs):**

**Tab 1 - API Endpoint:**
- แสดง mock API URL: `https://api.thoughtmind.ai/v1/agents/{agent-id}/chat`
- Code block แสดงตัวอย่าง cURL request
- ปุ่ม Copy สำหรับ endpoint และ cURL

**Tab 2 - Embed Code:**
- Code block แสดง iframe/script embed snippet
- ปรับขนาด widget (width/height) ด้วย input fields
- ปุ่ม Copy embed code

**Tab 3 - Widget Preview:**
- แสดง mock iframe preview ของ chat widget ในกรอบโทรศัพท์/browser frame
- ปรับธีม light/dark ได้

**Tab 4 - API Key:**
- แสดง mock API key แบบ masked (sk-xxxx...xxxx) พร้อมปุ่ม show/hide
- ปุ่ม Copy key
- ปุ่ม Regenerate key (mock - แสดง toast)
- คำเตือนว่าอย่าแชร์ key

### 2. Route: `src/App.tsx`
- เพิ่ม route `/deploy` -> `<AppLayout><DeployPanel /></AppLayout>`

### 3. Sidebar: `src/components/layout/AppSidebar.tsx`
- เพิ่มเมนู "Deploy" ด้วยไอคอน `Rocket` จาก lucide-react ระหว่าง Monitor กับ Settings

### 4. Agent Builder Integration
- แก้ `handleCreate` ใน `AgentBuilder.tsx` ให้ navigate ไป `/deploy?agent=new-agent` แทน `/dashboard` เพื่อให้ผู้ใช้เห็นหน้า deploy ทันทีหลังสร้าง

---

## Technical Details

- ใช้ Shadcn `Tabs` สำหรับ section switching
- ใช้ `useState` สำหรับ show/hide API key และ widget size
- Copy-to-clipboard ใช้ `navigator.clipboard.writeText()` + toast notification
- Mock API key สร้างจาก random string
- Widget preview ใช้ Card + mock chat UI (ไม่ใช่ iframe จริง)
- ไม่มี dependency ใหม่

