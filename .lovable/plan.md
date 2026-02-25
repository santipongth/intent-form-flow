

# เพิ่มปุ่ม Clear Chat + หน้าสรุปผล A/B Test พร้อมกราฟ

## Overview
เพิ่ม 2 ฟีเจอร์หลัก: (1) ปุ่ม Clear Chat ในหน้า ABTestDetail และ (2) หน้าสรุปผล A/B Test ทั้งหมดพร้อมกราฟเปรียบเทียบ

## Changes

### 1. เพิ่มปุ่ม Clear Chat ในหน้า ABTestDetail (`src/pages/ABTestDetail.tsx`)
- เพิ่มปุ่ม "Clear Chat" ข้างหัวข้อ test (บริเวณ header) พร้อมไอคอน Trash2
- เมื่อกดจะล้าง `messagesA` และ `messagesB` ทั้งหมด เพื่อเริ่มทดสอบรอบใหม่
- ปุ่มจะ disabled ระหว่างที่กำลัง streaming อยู่

### 2. สร้างหน้าสรุปผล A/B Test (`src/pages/ABTestResults.tsx`)
- หน้าใหม่แสดงภาพรวมผลโหวตของทุก test
- ใช้ BarChart จาก recharts แสดงกราฟแท่งเปรียบเทียบ votes ของ Agent A vs Agent B vs Tie สำหรับแต่ละ test
- แสดงตารางสรุปด้วย: ชื่อ test, จำนวน vote แต่ละฝ่าย, เปอร์เซ็นต์, ผู้ชนะ
- ดึงข้อมูลจาก `agent_ab_tests` + `ab_test_votes` ผ่าน hook ใหม่

### 3. เพิ่ม hook สำหรับดึงผลรวม (`src/hooks/useABTesting.ts`)
- เพิ่ม `useAllABTestVotes()` -- ดึง votes ทั้งหมดแล้ว group ตาม test_id

### 4. เพิ่ม route และ navigation
- เพิ่ม route `/ab-testing/results` ใน `src/App.tsx`
- เพิ่มปุ่ม "View Results" ในหน้า ABTesting list เพื่อลิงก์ไปหน้าสรุป

### 5. ไม่ต้องแก้ database
ข้อมูลทั้งหมดอยู่ในตาราง `ab_test_votes` และ `agent_ab_tests` แล้ว

## Technical Details

### Files to Create
| File | Description |
|------|-------------|
| `src/pages/ABTestResults.tsx` | หน้าสรุปผลพร้อม BarChart จาก recharts |

### Files to Modify
| File | Changes |
|------|---------|
| `src/pages/ABTestDetail.tsx` | เพิ่มปุ่ม Clear Chat ที่ header |
| `src/hooks/useABTesting.ts` | เพิ่ม `useAllABTestVotes` hook |
| `src/App.tsx` | เพิ่ม route `/ab-testing/results` |
| `src/pages/ABTesting.tsx` | เพิ่มปุ่ม "View Results" |

### กราฟที่จะแสดง
- BarChart แนวตั้ง: แกน X = ชื่อ test, แกน Y = จำนวน votes
- 3 แท่งต่อ test: Agent A (สีฟ้า), Agent B (สีม่วง), Tie (สีเทา)
- ใช้ recharts ที่ติดตั้งอยู่แล้ว + ChartContainer จาก `@/components/ui/chart`
