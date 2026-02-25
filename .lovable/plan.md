
# Reset Password + Deploy ย้ายเข้า Agent Detail

## Overview
1. เพิ่มระบบ Reset Password (ลืมรหัสผ่าน + หน้าตั้งรหัสใหม่)
2. ย้าย Deploy Panel จากเมนูแยก เข้าไปอยู่ในหน้า Agent Detail แต่ละตัว โดยเข้าถึงได้จาก Dashboard (คลิกที่ Agent card หรือจุดสามจุด)
3. ลบเมนู Deploy ออกจาก Sidebar

---

## ส่วนที่ 1: Reset Password

### ไฟล์ใหม่: `src/pages/ResetPassword.tsx`
- หน้าสำหรับตั้งรหัสผ่านใหม่หลังจากคลิก link ในอีเมล
- ตรวจสอบ `type=recovery` ใน URL hash
- แสดงฟอร์มกรอกรหัสผ่านใหม่ + ยืนยัน
- เรียก `supabase.auth.updateUser({ password })` เพื่ออัปเดต
- เมื่อสำเร็จ redirect ไป `/dashboard`

### แก้ไข: `src/pages/Auth.tsx`
- เพิ่มลิงก์ "ลืมรหัสผ่าน?" ใต้ฟอร์ม Sign In
- เมื่อกด -> เรียก `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin + '/reset-password' })`
- แสดง toast แจ้งให้ตรวจสอบอีเมล

### แก้ไข: `src/App.tsx`
- เพิ่ม route `/reset-password` -> `<ResetPassword />` (public route ไม่ต้อง ProtectedRoute)

---

## ส่วนที่ 2: Agent Detail + Deploy

### ไฟล์ใหม่: `src/pages/AgentDetail.tsx`
- หน้ารวมรายละเอียด Agent + Deploy Panel
- รับ `agentId` จาก URL params (`/agents/:id`)
- ดึงข้อมูล Agent จาก database ด้วย `useQuery`
- แสดง 2 tabs หลัก:
  - **Overview**: แสดงข้อมูล Agent (ชื่อ, model, status, objective ฯลฯ)
  - **Deploy**: ย้ายเนื้อหา DeployPanel เดิมทั้งหมดมาไว้ที่นี่ (API endpoint, Embed code, Widget preview, API Key)

### แก้ไข: `src/pages/Dashboard.tsx`
- คลิกที่ Agent card -> navigate ไป `/agents/:id`
- เพิ่มตัวเลือก "Deploy" ใน dropdown menu จุดสามจุด -> navigate ไป `/agents/:id?tab=deploy`
- เพิ่มตัวเลือก "ดูรายละเอียด" ใน dropdown menu

### แก้ไข: `src/App.tsx`
- เพิ่ม route `/agents/:id` -> `<AgentDetail />`
- ลบ route `/deploy`

### แก้ไข: `src/components/layout/AppSidebar.tsx`
- ลบเมนู "Deploy" ออกจาก sidebar menu items

### ลบ: `src/pages/DeployPanel.tsx`
- ไม่จำเป็นแล้ว เนื้อหาย้ายเข้า AgentDetail

---

## สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | Action |
|------|--------|
| `src/pages/ResetPassword.tsx` | สร้างใหม่ |
| `src/pages/AgentDetail.tsx` | สร้างใหม่ |
| `src/pages/Auth.tsx` | แก้ไข (เพิ่มลิงก์ลืมรหัสผ่าน) |
| `src/App.tsx` | แก้ไข (เพิ่ม routes, ลบ /deploy) |
| `src/pages/Dashboard.tsx` | แก้ไข (คลิก agent -> detail, เพิ่ม deploy ใน dropdown) |
| `src/components/layout/AppSidebar.tsx` | แก้ไข (ลบเมนู Deploy) |
| `src/pages/DeployPanel.tsx` | ลบ |
