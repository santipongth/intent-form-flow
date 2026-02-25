

# ThoughtMind — "LangFlow สำหรับคนปกติ" 🧠✨

## Design Direction
- **Friendly & Colorful** — สีสันสดใส, มุมโค้ง, ไอคอนน่ารัก, แบบ Notion/Canva
- **Gradient accents** สีม่วง-ฟ้า-ชมพู เป็น brand color หลัก
- **Light mode** เป็นค่าเริ่มต้น พร้อม dark mode support
- **Emoji & illustration** เสริมความเป็นมิตร

---

## Phase 1: Frontend UI ทั้งหมด (Mock Data)

### 1. Layout & Navigation
- **Sidebar** พร้อมโลโก้ ThoughtMind, เมนู Dashboard / Agents / Chat / Monitor / Settings
- ไอคอนสีสันสดใส, active state ชัดเจน
- Responsive — mobile hamburger menu

### 2. Landing / Onboarding Page
- Hero section อธิบาย ThoughtMind แบบสั้นกระชับ
- ปุ่ม "เริ่มสร้าง AI Agent ตัวแรก" เด่นชัด
- Template gallery preview — การ์ด 4-6 แบบ (ตอบคำถาม PDF, สรุปข่าว, Customer Support ฯลฯ)

### 3. Dashboard (ศูนย์บัญชาการ)
- **Stats Cards**: จำนวน Agents, Messages Today, Token Usage (mock data)
- **Agent Grid**: การ์ดแสดง Agent แต่ละตัว พร้อม avatar, ชื่อ, สถานะ (Draft/Published), วันที่สร้าง, ปุ่ม Edit/Chat/Delete
- **Activity Feed**: Timeline ของกิจกรรมล่าสุด (สร้าง Agent, แก้ไข, ตอบข้อความ)
- **Quick Action**: ปุ่ม "+ สร้าง Agent ใหม่" โดดเด่น

### 4. Agent Builder — Wizard 5 ขั้นตอน
- **Stepper UI** แสดง progress (Step 1-5) ด้วย visual progress bar สีสัน

- **Step 1: Intent & Type** — เลือก Template จากการ์ดสวยๆ หรือ "Custom" (เริ่มจากศูนย์)
- **Step 2: Identity & Model** — ฟอร์มตั้งชื่อ, Objective, Output Style dropdown (สุภาพ/เป็นกันเอง/มืออาชีพ), เลือก LLM (OpenAI/Anthropic/Gemini/Groq) พร้อมไอคอน
- **Step 3: Knowledge** — Drag & drop zone สำหรับอัปโหลดไฟล์ + ช่องใส่ URL, แสดงรายการไฟล์ที่อัป
- **Step 4: Tools & Memory** — Toggle switches สวยๆ (ค้นเว็บ, อ่าน Excel, คำนวณ, จำบริบท)
- **Step 5: Advanced & Review** — System Prompt textarea, Temperature slider, Max Tokens input + สรุปการตั้งค่าทั้งหมดในการ์ดสวยๆ พร้อมปุ่ม "🚀 Create Agent"

- ทุก Step มี **Basic/Advanced toggle** (Progressive Disclosure)

### 5. Chat Console (Playground)
- **Split-screen layout**: ซ้าย = Agent config panel (แก้ไขชื่อ, โทน, model ได้ทันที), ขวา = Chat interface
- **Chat bubbles** สีสันแยกระหว่าง user กับ bot
- **Typing animation** จำลอง streaming effect (SSE mock)
- แสดงเวลาตอบ, ปุ่ม copy, ปุ่ม regenerate
- Input area พร้อมปุ่มส่ง + แนบไฟล์

### 6. Monitor (Developer Console ฉบับเข้าใจง่าย)
- **Thought Process Timeline**: แสดง step-by-step ว่า Agent คิดอะไร (mock) เช่น "🔍 กำลังค้นหา..." → "📄 พบ 5 ผลลัพธ์" → "✍️ กำลังสรุป..."
- **Log entries** แสดงเป็น card/timeline สวยๆ ไม่ใช่ raw log
- Filter ตาม Agent, วันที่, ประเภท action

### 7. Settings Page
- **API Keys Management**: ฟอร์มบันทึก API Key ของ OpenAI, Anthropic, Gemini, Groq (mock save)
- **Profile**: ชื่อ, email, avatar
- **Preferences**: ภาษา, theme (light/dark)

---

## ฟีเจอร์เสริมสำหรับ Production 🚀

### 8. Agent Templates Marketplace
- หน้า Gallery ของ Template พร้อม preview, rating, จำนวนผู้ใช้
- กดใช้ Template ได้ทันที (One-click clone)

### 9. Deploy / Publish Panel
- เมื่อ Agent พร้อม กดปุ่ม "Publish" ได้ Embed code, API endpoint, Widget preview
- แสดง iframe preview ของ chat widget

### 10. Usage & Billing Dashboard
- กราฟแสดง token usage ตาม Agent, ตามวัน (Recharts)
- แจ้งเตือนเมื่อใกล้ถึง limit

---

## Technical Notes
- ทุกข้อมูลใช้ **mock data** ในเฟสนี้ เตรียมโครงสร้างให้ต่อ Supabase ได้ง่าย
- ใช้ **React Router** สำหรับ navigation ทุกหน้า
- ใช้ **Shadcn/ui** components + Tailwind สำหรับ UI ทั้งหมด
- ใช้ **Recharts** สำหรับกราฟ stats
- State management ด้วย React Context/hooks

