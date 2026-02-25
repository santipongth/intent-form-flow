

# Analytics Dashboard - สถิติการใช้งาน Agent

## Overview
เพิ่มหน้า Analytics Dashboard แสดงสถิติเชิงลึกของ Agent ทั้งหมด ได้แก่ API calls, response time, active sessions, token usage พร้อมกราฟ recharts และตารางสรุป

---

## Changes

### 1. Mock Data: `src/data/mockData.ts`
เพิ่ม mock data สำหรับ analytics:
- `MOCK_ANALYTICS_DAILY` - ข้อมูลรายวัน 7 วัน (date, apiCalls, avgResponseTime, activeSessions, tokensUsed)
- `MOCK_AGENT_ANALYTICS` - สถิติต่อ Agent (agentId, agentName, totalCalls, avgResponseTime, errorRate, successRate)

### 2. New Page: `src/pages/Analytics.tsx`
Layout ประกอบด้วย:

**Header:** ชื่อ "Analytics" + คำอธิบาย + ตัวเลือกช่วงเวลา (7 วัน / 30 วัน / 90 วัน)

**Stats Cards (4 ใบ):**
- Total API Calls (จำนวนรวม + % เปลี่ยนแปลง)
- Avg Response Time (ms)
- Active Sessions (ปัจจุบัน)
- Success Rate (%)

**Charts Section (ใช้ recharts ที่ติดตั้งแล้ว):**
- **Line Chart** - API Calls per day (7 วัน)
- **Bar Chart** - Response Time per day
- **Area Chart** - Token Usage trend

**Agent Performance Table:**
- ตารางแสดง Agent แต่ละตัว พร้อม total calls, avg response time, error rate, success rate
- เรียงตาม total calls

ใช้ pattern เดียวกับ Dashboard: `framer-motion` animations, `Card` rounded-2xl, gradient colors

### 3. Route: `src/App.tsx`
เพิ่ม route `/analytics` -> `<AppLayout><Analytics /></AppLayout>`

### 4. Sidebar: `src/components/layout/AppSidebar.tsx`
เพิ่มเมนู "Analytics" ด้วยไอคอน `BarChart3` จาก lucide-react ระหว่าง Monitor กับ Deploy

---

## Technical Details
- ใช้ `recharts` (มีอยู่แล้ว) สำหรับ LineChart, BarChart, AreaChart
- ใช้ `ResponsiveContainer` ขนาด `width="100%"` `height={250}`
- Chart theme ใช้ HSL colors จาก CSS variables: primary, brand-green, brand-orange, brand-blue
- ตัวเลือกช่วงเวลาใช้ `useState` filter mock data (แสดงข้อมูลเดียวกันในทุกช่วงเป็น mock)
- ไม่มี dependency ใหม่

