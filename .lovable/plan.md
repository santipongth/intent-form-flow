

# Clean Code & Database สำหรับ Production

## สรุปสิ่งที่จะทำ

ทำความสะอาดโค้ดและฐานข้อมูลทั้งหมดเพื่อให้พร้อมสำหรับการใช้งานจริง ครอบคลุม 4 ด้าน:

---

## 1. ลบไฟล์และโค้ดที่ไม่ใช้งาน

- **ลบ `src/pages/Index.tsx`** -- หน้า placeholder "Welcome to Your Blank App" ที่ไม่ได้ใช้ (ไม่มี route ชี้ไป)
- **ลบ `src/App.css`** -- ไม่มีการ import ใช้งานจริง (ใช้ Tailwind ทั้งหมด)
- **ลบ `src/test/example.test.ts`** -- test ตัวอย่างที่ไม่ได้ใช้จริง

## 2. ทำความสะอาด Mock Data

- **Refactor `src/data/mockData.ts`** -- แยกข้อมูลที่ยังใช้งานจริง (TEMPLATES, LLM_MODELS, TOOLS_LIST, MARKETPLACE_TEMPLATES) ออกจาก mock data ที่ไม่ใช้แล้ว
- **ลบ mock data ที่ไม่ถูก import** ทุกที่: `MOCK_AGENTS`, `MOCK_LOGS`, `MOCK_CHAT`, `MOCK_ANALYTICS_DAILY`, `MOCK_AGENT_ANALYTICS`, `MOCK_USAGE_BY_AGENT`, `MOCK_DAILY_USAGE`, `MOCK_BILLING_INFO` และ interfaces ที่เกี่ยวข้อง (`Agent`, `LogEntry`, `ChatMessage`, `AnalyticsDaily`, `AgentAnalytics`, `UsageByAgent`, `DailyUsage`, `BillingInfo`)
- เปลี่ยนชื่อไฟล์เป็น `src/data/constants.ts` เพื่อสะท้อนว่าเป็นข้อมูลคงที่ ไม่ใช่ mock

## 3. แก้ไข Hook ที่อ้างอิงตารางไม่มีอยู่

- **แก้ `src/hooks/useDeployment.ts`** -- อ้างอิงตาราง `agent_deployments` ที่ไม่มีอยู่ในฐานข้อมูล ต้องลบไฟล์นี้ออก หรือสร้างตารางรองรับ (จะลบออกเพราะไม่มีหน้าไหนใช้งานจริง)

## 4. ปรับปรุงคุณภาพโค้ด

- **ลบ `(supabase as any)` pattern** -- ตาราง `message_feedback`, `chat_messages`, `conversations`, `knowledge_files`, `user_api_keys`, `ab_test_votes`, `agent_ab_tests` ทั้งหมดมีอยู่ใน types แล้ว จึงไม่ต้อง cast เป็น `any` อีกต่อไป จะแก้ไขในทุกไฟล์ที่มีปัญหา:
  - `src/hooks/useConversations.ts`
  - `src/hooks/useMessageFeedback.ts`
  - `src/hooks/useKnowledge.ts`
  - `src/hooks/useABTesting.ts`
  - `src/hooks/useFeedbackAnalytics.ts`
  - `src/pages/SettingsPage.tsx`
  - `src/pages/Dashboard.tsx`

- **อัปเดต imports** ในไฟล์ที่อ้างอิง mockData ให้ชี้ไปที่ `constants.ts`:
  - `src/pages/AgentBuilder.tsx`
  - `src/pages/Landing.tsx`
  - `src/pages/Marketplace.tsx`
  - `src/pages/SettingsPage.tsx`

---

## Technical Details

### ไฟล์ที่จะลบ
- `src/pages/Index.tsx`
- `src/App.css`
- `src/test/example.test.ts`
- `src/hooks/useDeployment.ts`

### ไฟล์ที่จะแก้ไข
| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `src/data/mockData.ts` | ลบ mock data + interfaces ที่ไม่ใช้, เปลี่ยนชื่อเป็น constants.ts |
| `src/hooks/useConversations.ts` | ลบ `(supabase as any)` ใช้ `supabase` ตรง |
| `src/hooks/useMessageFeedback.ts` | ลบ `(supabase as any)` |
| `src/hooks/useKnowledge.ts` | ลบ `(supabase as any)` |
| `src/hooks/useABTesting.ts` | ลบ `(supabase as any)` |
| `src/hooks/useFeedbackAnalytics.ts` | ลบ `(supabase as any)` |
| `src/pages/SettingsPage.tsx` | ลบ `(supabase as any)`, อัปเดต import path |
| `src/pages/Dashboard.tsx` | ลบ `(supabase as any)` |
| `src/pages/AgentBuilder.tsx` | อัปเดต import path |
| `src/pages/Landing.tsx` | อัปเดต import path |
| `src/pages/Marketplace.tsx` | อัปเดต import path |

### ไม่มีการเปลี่ยนแปลง Database Schema
ฐานข้อมูลปัจจุบันสะอาดดีอยู่แล้ว -- ตารางทั้งหมดมี RLS policies ครบถ้วน ไม่มีตารางที่ไม่ใช้งาน

