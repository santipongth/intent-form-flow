

# บันทึกผล Vote ของ A/B Test ลงฐานข้อมูล

## Overview
สร้างตาราง `ab_test_votes` เพื่อเก็บผลโหวตแต่ละครั้ง และแก้ไข frontend ให้บันทึกลงฐานข้อมูลแทนการเก็บใน state อย่างเดียว พร้อมโหลดผลโหวตเดิมเมื่อเปิดหน้า

## Changes

### 1. สร้างตาราง `ab_test_votes` (Database Migration)

```sql
CREATE TABLE public.ab_test_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.agent_ab_tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  winner text NOT NULL,  -- 'a', 'b', or 'tie'
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ab_test_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own votes"
  ON public.ab_test_votes
  FOR ALL
  USING (auth.uid() = user_id);
```

### 2. เพิ่ม hooks ใน `src/hooks/useABTesting.ts`

- `useABTestVotes(testId)` -- query ดึงจำนวน vote แยกตาม winner สำหรับ test นั้น
- `useCastVote()` -- mutation สำหรับ insert vote ใหม่ พร้อม invalidate query

### 3. แก้ไข `src/pages/ABTestDetail.tsx`

- ลบ local `votes` state
- ใช้ `useABTestVotes(id)` เพื่อโหลดผลโหวตจากฐานข้อมูล
- แก้ `handleVote` ให้เรียก `useCastVote` mutation แทนการ setState
- ผลโหวตจะคงอยู่เมื่อรีเฟรชหน้าหรือกลับมาดูทีหลัง

### Files to Modify

| File | Changes |
|------|---------|
| Database | สร้างตาราง `ab_test_votes` พร้อม RLS |
| `src/hooks/useABTesting.ts` | เพิ่ม `useABTestVotes` query และ `useCastVote` mutation |
| `src/pages/ABTestDetail.tsx` | ใช้ hooks แทน local state สำหรับ votes |
