

# Usage & Billing Dashboard

## Overview
เพิ่มหน้า Usage & Billing Dashboard แสดง token usage แยกตาม Agent และตามวัน พร้อมข้อมูล billing plan และ cost estimation

---

## Changes

### 1. Mock Data: `src/data/mockData.ts`
เพิ่ม mock data ใหม่:
- `MOCK_USAGE_BY_AGENT` - token usage แยกตาม Agent (agentName, tokensUsed, cost, percentage)
- `MOCK_DAILY_USAGE` - token usage รายวัน 7 วัน แยกเป็น prompt tokens / completion tokens
- `MOCK_BILLING_INFO` - ข้อมูล plan (plan name, token limit, tokens used, billing period, cost per 1k tokens)

### 2. New Page: `src/pages/UsageBilling.tsx`

**Header:** ชื่อ "Usage & Billing" + billing period + plan badge

**Overview Cards (3 ใบ):**
- Tokens Used / Limit (progress bar แสดง % ที่ใช้ไป)
- Estimated Cost (ประมาณค่าใช้จ่ายเดือนนี้)
- Current Plan (ชื่อ plan + ปุ่ม Upgrade)

**Charts:**
- **Stacked Bar Chart** - Daily Token Usage แยก Prompt vs Completion tokens (7 วัน) ใช้ 2 สี stack กัน
- **Pie Chart (Recharts PieChart)** - Token Usage by Agent แสดงสัดส่วนการใช้ token ของแต่ละ Agent

**Usage Breakdown Table:**
- ตาราง Agent แต่ละตัว แสดง tokens used, % of total, estimated cost
- แถว Total ด้านล่าง

ใช้ pattern เดียวกับ Analytics: framer-motion animations, Card rounded-2xl, recharts

### 3. Route: `src/App.tsx`
เพิ่ม route `/usage` -> `<AppLayout><UsageBilling /></AppLayout>`

### 4. Sidebar: `src/components/layout/AppSidebar.tsx`
เพิ่มเมนู "Usage & Billing" ด้วยไอคอน `CreditCard` จาก lucide-react ระหว่าง Analytics กับ Deploy

---

## Technical Details
- ใช้ `recharts` สำหรับ BarChart (stacked), PieChart
- Stacked BarChart ใช้ `<Bar stackId="tokens">` สำหรับ prompt/completion
- PieChart ใช้ `<Pie>` + `<Cell>` กำหนดสีแต่ละ agent
- Progress bar ใช้ Shadcn `Progress` component
- ไม่มี dependency ใหม่

