
# เพิ่มฟีเจอร์ลบ A/B Test พร้อม Confirmation Dialog

## Overview
เพิ่มปุ่มลบในแต่ละ test card พร้อม AlertDialog ยืนยันก่อนลบ และเพิ่ม i18n รองรับทั้งไทย/อังกฤษ

## Changes

### 1. เพิ่ม `useDeleteABTest` hook (`src/hooks/useABTesting.ts`)
- สร้าง mutation ที่ลบ record จากตาราง `agent_ab_tests` (votes จะถูกลบอัตโนมัติผ่าน ON DELETE CASCADE)
- Invalidate query cache หลังลบสำเร็จ
- แสดง toast แจ้งผลสำเร็จ/ล้มเหลว

### 2. เพิ่มปุ่มลบ + AlertDialog ในหน้า ABTesting (`src/pages/ABTesting.tsx`)
- เพิ่มปุ่มไอคอนถังขยะ (Trash2) ที่มุมขวาบนของแต่ละ test card
- ใช้ AlertDialog จาก shadcn/ui เพื่อยืนยันก่อนลบ
- ป้องกันไม่ให้คลิกปุ่มลบ trigger การนำทางไปหน้า detail (stopPropagation)

### 3. เพิ่ม i18n keys (`src/i18n/en.ts` + `src/i18n/th.ts`)
- `abtest.delete` -- ข้อความปุ่มลบ
- `abtest.deleteConfirmTitle` -- หัวข้อ dialog
- `abtest.deleteConfirmDesc` -- คำอธิบายใน dialog
- `abtest.deleteSuccess` -- toast สำเร็จ
- `abtest.cancel` -- ปุ่มยกเลิก

### Files to Modify
| File | Changes |
|------|---------|
| `src/hooks/useABTesting.ts` | เพิ่ม `useDeleteABTest` mutation |
| `src/pages/ABTesting.tsx` | เพิ่มปุ่มลบ + AlertDialog ในแต่ละ card |
| `src/i18n/en.ts` | เพิ่ม delete-related keys |
| `src/i18n/th.ts` | เพิ่ม delete-related keys |
