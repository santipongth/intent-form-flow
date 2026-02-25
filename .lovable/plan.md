
# Fix: Monitor, Analytics, และ Usage Billing ไม่แสดงข้อมูลจริง

## สาเหตุหลักที่พบ

ปัญหาอยู่ที่ไฟล์ `src/lib/streamChat.ts` -- ตอนเรียก Chat Edge Function จะส่ง **anon key** เป็น Authorization header แทนที่จะส่ง **session token ของผู้ใช้**:

```text
Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}  <-- anon key, ไม่ใช่ user token
```

ทำให้ใน Edge Function เมื่อทำ `supabase.auth.getUser(token)` จะได้ `user = null` และ **ไม่บันทึก analytics event ใดๆ เลย** ส่งผลให้:
- **Monitor**: ไม่มี log แสดง
- **Analytics**: ไม่มี API calls, response time, tokens
- **Usage Billing**: ไม่มี token usage data

นอกจากนี้ Edge Function ยังไม่ได้บันทึก `tokens_used` จาก streaming response ทำให้แม้แก้ auth แล้ว Usage Billing ก็จะแสดง 0 tokens

## แผนการแก้ไข

### 1. แก้ `src/lib/streamChat.ts` -- ส่ง User Session Token
- Import supabase client
- ดึง session token จาก `supabase.auth.getSession()`
- ส่ง user JWT แทน anon key ใน Authorization header

### 2. แก้ `supabase/functions/chat/index.ts` -- บันทึก analytics ให้ครบ
- แก้ error logging ให้ไม่ต้องพึ่ง `conversation_id` (ปัจจุบันต้องมี `conversation_id` ถึงจะ log error)
- เพิ่มการอ่าน `tokens_used` จาก streaming response ก่อนส่งกลับ โดยใช้ TransformStream เพื่อดักจับ usage data จาก chunk สุดท้าย
- บันทึก `tokens_used` ลงใน `agent_analytics_events` ด้วย

### 3. ตรวจสอบ RLS Policies
- RLS policies ปัจจุบันใช้ `RESTRICTIVE` (`Permissive: No`) ซึ่งถูกต้องแล้ว
- Edge Function ใช้ service role key จึงข้าม RLS ได้ -- ไม่มีปัญหา

## รายละเอียดทางเทคนิค

### ไฟล์ที่ต้องแก้ไข

**`src/lib/streamChat.ts`**
- เพิ่ม import `supabase` client
- เปลี่ยน Authorization header จาก anon key เป็น user session token

**`supabase/functions/chat/index.ts`**
- ลบเงื่อนไข `&& conversation_id` ออกจาก error logging (line 92)
- เพิ่ม TransformStream เพื่อดักจับ `usage` object จาก streaming chunks
- อัพเดต analytics insert ให้รวม `tokens_used` ที่ดักจับได้
- ใช้ `waitUntil`-style pattern (fire-and-forget) เพื่อไม่ให้กระทบ response time

### ผลลัพธ์ที่คาดหวัง
- ทุกการ chat จะถูกบันทึกลง `agent_analytics_events` พร้อม response_time_ms และ tokens_used
- หน้า Monitor จะแสดง activity logs จริง
- หน้า Analytics จะแสดง API calls, response time, tokens trend
- หน้า Usage Billing จะแสดง token usage และ cost estimate ที่ถูกต้อง
