

# แผนปรับปรุงระบบครบวงจร

## Overview
ปรับปรุงระบบทั้งหมด 5 ส่วนหลัก: (1) เพิ่มฟีเจอร์แก้ไข Agent (2) ระบบสลับภาษาไทย/อังกฤษ (3) Dark Mode toggle ใน header (4) ปรับปรุง UI ให้สวยขึ้น (5) ทดสอบ end-to-end

---

## 1. ฟีเจอร์แก้ไข Agent (Edit Agent)

### ไฟล์ใหม่: `src/hooks/useUpdateAgent.ts`
- สร้าง mutation hook `useUpdateAgent` ที่เรียก `supabase.from("agents").update(...)` 
- Invalidate query cache หลังอัปเดตสำเร็จ

### แก้ไข: `src/pages/AgentDetail.tsx`
- เพิ่ม tab "Edit" ใน Overview tab หรือเพิ่มปุ่ม "แก้ไข" ที่ header
- เมื่อกด -> แสดง inline form (ชื่อ, objective, model, provider, temperature, max_tokens, system_prompt)
- กด "บันทึก" -> เรียก `useUpdateAgent` mutation
- กด "ยกเลิก" -> กลับไป view mode

### แก้ไข: `src/pages/Dashboard.tsx`
- ปุ่ม "แก้ไข" ใน dropdown menu -> navigate ไป `/agents/:id?tab=edit`

---

## 2. ระบบสลับภาษาไทย/อังกฤษ (i18n)

### ไฟล์ใหม่: `src/contexts/LanguageContext.tsx`
- สร้าง `LanguageProvider` + `useLanguage` hook
- State: `locale` ("th" | "en"), default = "th"
- เก็บค่าใน `localStorage`
- Function: `t(key)` สำหรับแปลข้อความ

### ไฟล์ใหม่: `src/i18n/th.ts` + `src/i18n/en.ts`
- Dictionary ไฟล์สำหรับทั้ง 2 ภาษา
- ครอบคลุมข้อความทุกหน้า: Dashboard, AgentBuilder, AgentDetail, Auth, Settings, Landing, Sidebar, Chat, Monitor, Analytics, UsageBilling, Marketplace

### แก้ไขทุกหน้า
- Import `useLanguage` และเปลี่ยน hardcoded text เป็น `t("key")`
- หน้าที่ต้องแก้: `Dashboard.tsx`, `AgentBuilder.tsx`, `AgentDetail.tsx`, `Auth.tsx`, `ResetPassword.tsx`, `Landing.tsx`, `SettingsPage.tsx`, `ChatConsole.tsx`, `Monitor.tsx`, `Analytics.tsx`, `UsageBilling.tsx`, `Marketplace.tsx`, `AppSidebar.tsx`, `AppLayout.tsx`, `ProtectedRoute.tsx`

### แก้ไข: `src/components/layout/AppLayout.tsx`
- เพิ่มปุ่มสลับภาษา (TH/EN) ใน header ข้าง avatar

---

## 3. Dark Mode Toggle

### ไฟล์ใหม่: `src/contexts/ThemeContext.tsx`
- สร้าง `ThemeProvider` + `useTheme` hook
- State: `theme` ("light" | "dark"), เก็บใน `localStorage`
- Toggle class `dark` บน `document.documentElement`

### แก้ไข: `src/components/layout/AppLayout.tsx`
- เพิ่มปุ่ม Sun/Moon icon ใน header (ข้าง language switcher)

### แก้ไข: `src/components/layout/AppSidebar.tsx`
- เพิ่มปุ่ม dark mode toggle ที่ footer ของ sidebar (เมื่อ collapsed แสดงเป็น icon)

### แก้ไข: `src/pages/SettingsPage.tsx`
- เชื่อม Switch dark mode เข้ากับ ThemeContext แทน local state

### แก้ไข: `src/App.tsx`
- Wrap app ด้วย `ThemeProvider` และ `LanguageProvider`

---

## 4. ปรับปรุง UI ให้สวยขึ้น

### แก้ไข: `src/index.css`
- เพิ่ม subtle animations: hover effects, card transitions
- เพิ่ม glassmorphism effect สำหรับ header
- ปรับ gradient ให้สดใสขึ้น

### แก้ไข: `src/pages/Landing.tsx`
- เพิ่ม animated background particles/gradient blobs
- ปรับ hero section ให้ดูทันสมัยขึ้น ด้วย floating elements
- เพิ่ม footer section

### แก้ไข: `src/pages/Dashboard.tsx`
- เพิ่ม welcome message แบบ personalized
- ปรับ card hover effects ให้มี depth มากขึ้น
- เพิ่ม gradient borders บน stat cards

### แก้ไข: `src/components/layout/AppLayout.tsx`
- Header: glassmorphism effect + gradient border-bottom
- เพิ่ม breadcrumb

### แก้ไข: `src/components/layout/AppSidebar.tsx`
- เพิ่ม hover animation ที่ menu items
- ปรับ active state ให้โดดเด่นขึ้นด้วย gradient indicator

### แก้ไข: `src/pages/Auth.tsx`
- เพิ่ม animated background
- ปรับ card ให้มี glassmorphism effect

---

## 5. สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | Action |
|------|--------|
| `src/contexts/LanguageContext.tsx` | สร้างใหม่ |
| `src/contexts/ThemeContext.tsx` | สร้างใหม่ |
| `src/i18n/th.ts` | สร้างใหม่ |
| `src/i18n/en.ts` | สร้างใหม่ |
| `src/hooks/useUpdateAgent.ts` | สร้างใหม่ |
| `src/App.tsx` | แก้ไข (เพิ่ม providers) |
| `src/index.css` | แก้ไข (เพิ่ม animations) |
| `src/components/layout/AppLayout.tsx` | แก้ไข (header: dark mode, lang, glassmorphism) |
| `src/components/layout/AppSidebar.tsx` | แก้ไข (dark mode, hover effects, i18n) |
| `src/pages/Dashboard.tsx` | แก้ไข (edit agent, UI improvements, i18n) |
| `src/pages/AgentDetail.tsx` | แก้ไข (edit form, i18n) |
| `src/pages/AgentBuilder.tsx` | แก้ไข (i18n) |
| `src/pages/Auth.tsx` | แก้ไข (UI improvements, i18n) |
| `src/pages/ResetPassword.tsx` | แก้ไข (i18n) |
| `src/pages/Landing.tsx` | แก้ไข (UI improvements, i18n) |
| `src/pages/SettingsPage.tsx` | แก้ไข (connect ThemeContext, i18n) |
| `src/pages/ChatConsole.tsx` | แก้ไข (i18n) |
| `src/pages/Monitor.tsx` | แก้ไข (i18n) |
| `src/pages/Analytics.tsx` | แก้ไข (i18n) |
| `src/pages/UsageBilling.tsx` | แก้ไข (i18n) |
| `src/pages/Marketplace.tsx` | แก้ไข (i18n) |
| `src/components/ProtectedRoute.tsx` | แก้ไข (i18n) |

---

## หมายเหตุ
- ค่า default ภาษาเป็น **ภาษาไทย** ตามที่ร้องขอ
- Dark mode จะจำค่าที่เลือกไว้ใน localStorage
- การแก้ไข Agent ใช้ inline editing ในหน้า AgentDetail เพื่อไม่ต้องสร้างหน้าใหม่
- เนื่องจากมีไฟล์จำนวนมากที่ต้องแก้ไข อาจต้องแบ่งทำเป็นหลาย message

