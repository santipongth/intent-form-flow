

# สร้างตาราง agent_ab_tests เพื่อให้ฟีเจอร์ A/B Testing ใช้งานได้

## สาเหตุของปัญหา
ตาราง `agent_ab_tests` ยังไม่ได้สร้างในฐานข้อมูล ทำให้หน้า A/B Testing แสดง error 404 ทุกครั้งที่โหลด

## สิ่งที่ต้องทำ

### 1. สร้างตาราง `agent_ab_tests` ในฐานข้อมูล
สร้างตารางด้วยคอลัมน์ตามที่โค้ดฝั่ง frontend ใช้งานอยู่แล้ว:
- `id` (uuid, primary key)
- `user_id` (uuid, not null)
- `agent_a_id` (uuid, not null)
- `agent_b_id` (uuid, not null)
- `name` (text, not null)
- `status` (text, default 'active')
- `created_at`, `updated_at` (timestamptz)

### 2. เพิ่ม RLS Policy
- เปิด RLS บนตาราง
- เพิ่ม policy ให้ผู้ใช้จัดการได้เฉพาะ test ของตัวเอง (`auth.uid() = user_id`)

### 3. ไม่ต้องแก้ไขโค้ด frontend
โค้ดในไฟล์ `src/pages/ABTesting.tsx`, `src/pages/ABTestDetail.tsx`, และ `src/hooks/useABTesting.ts` พร้อมใช้งานอยู่แล้ว -- แค่สร้างตารางก็จะทำงานได้ทันที

## Technical Details

### SQL Migration

```sql
CREATE TABLE public.agent_ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  agent_a_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  agent_b_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.agent_ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ab tests"
  ON public.agent_ab_tests
  FOR ALL
  USING (auth.uid() = user_id);
```

### ผลลัพธ์หลังทำเสร็จ
- หน้า A/B Testing จะโหลดได้โดยไม่ error
- สามารถสร้าง test ใหม่ เลือก Agent 2 ตัวเปรียบเทียบ แล้วส่งข้อความทดสอบได้

