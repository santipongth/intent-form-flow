

# ลบ Recent Activity ออกจาก Dashboard และ Clean Up

## สิ่งที่จะทำ

### 1. `src/pages/Dashboard.tsx`
- ลบ import `MOCK_ACTIVITY` ออก
- ลบตัวแปร `activityIcons` ออก
- ลบ section "Activity Feed" ทั้งหมด (คอลัมน์ขวาที่แสดง Recent Activity)
- เปลี่ยน grid layout จาก `lg:grid-cols-3` เป็นไม่ต้องแบ่งคอลัมน์ (Agent Grid เต็มหน้า) โดยลบ `lg:col-span-2` ออกด้วย

### 2. `src/data/mockData.ts`
- ลบ interface `ActivityItem` (บรรทัด 14-20)
- ลบ `MOCK_ACTIVITY` array (บรรทัด 57-63)

## ผลลัพธ์
- หน้า Dashboard จะแสดงเฉพาะ Stats และ Agent Grid เต็มความกว้าง
- ไม่มี mock data ที่ไม่ได้ใช้หลงเหลืออยู่

