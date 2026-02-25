

# เชื่อมต่อ Lovable Cloud - Authentication + Database + Storage

## Overview
เชื่อมต่อ Supabase ผ่าน Lovable Cloud เพื่อเปลี่ยนจาก mock data เป็นระบบจริง: Authentication (Email + Google + GitHub), Database สำหรับเก็บข้อมูล Agents, User Profiles, และ Storage สำหรับ Knowledge files

---

## ขั้นตอนที่ 1: เชื่อมต่อ Supabase

ก่อนเริ่มเขียนโค้ด ต้องเชื่อมต่อ Lovable Cloud (Supabase) กับโปรเจคก่อน โดยไปที่ Cloud view แล้วเปิดใช้งาน Supabase

---

## ขั้นตอนที่ 2: Database Schema (Migrations)

### ตาราง `profiles`
```sql
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  display_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### ตาราง `agents`
```sql
create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  avatar text default '🤖',
  objective text,
  status text default 'draft' check (status in ('draft', 'published')),
  model text,
  provider text,
  template text,
  output_style text default 'friendly',
  system_prompt text,
  temperature numeric default 0.7,
  max_tokens integer default 2048,
  tools jsonb default '{}',
  memory_enabled boolean default true,
  knowledge_urls text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.agents enable row level security;

create policy "Users can CRUD own agents" on public.agents
  for all using (auth.uid() = user_id);
```

### Storage Bucket `knowledge-files`
```sql
insert into storage.buckets (id, name, public)
values ('knowledge-files', 'knowledge-files', false);

create policy "Users can upload own files" on storage.objects
  for insert with check (bucket_id = 'knowledge-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own files" on storage.objects
  for select using (bucket_id = 'knowledge-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files" on storage.objects
  for delete using (bucket_id = 'knowledge-files' and auth.uid()::text = (storage.foldername(name))[1]);
```

---

## ขั้นตอนที่ 3: Authentication Pages

### ไฟล์ใหม่: `src/pages/Auth.tsx`
- หน้า Login/Register แบบ Tab (Sign In / Sign Up)
- Email + Password form
- ปุ่ม "Sign in with Google" และ "Sign in with GitHub"
- ใช้ `supabase.auth.signInWithPassword()`, `signUp()`, `signInWithOAuth()`
- Redirect ไป `/dashboard` หลัง login สำเร็จ

### ไฟล์ใหม่: `src/contexts/AuthContext.tsx`
- React Context สำหรับ auth state
- `onAuthStateChange` listener (ตั้งก่อน `getSession`)
- Export `useAuth()` hook ให้ `user`, `loading`, `signOut()`

### ไฟล์ใหม่: `src/components/ProtectedRoute.tsx`
- Wrapper component ตรวจ auth state
- Redirect ไป `/auth` ถ้ายังไม่ login

---

## ขั้นตอนที่ 4: Supabase Client + Types

### ไฟล์ใหม่: `src/integrations/supabase/client.ts`
- สร้าง Supabase client (จะถูก generate อัตโนมัติจาก Lovable Cloud)

### ไฟล์ใหม่: `src/hooks/useAgents.ts`
- Custom hooks สำหรับ CRUD agents ผ่าน `@tanstack/react-query`:
  - `useAgents()` - fetch agents ของ user
  - `useCreateAgent()` - insert agent ใหม่
  - `useUpdateAgent()` - update agent
  - `useDeleteAgent()` - delete agent

### ไฟล์ใหม่: `src/hooks/useProfile.ts`
- `useProfile()` - fetch profile ของ user ปัจจุบัน
- `useUpdateProfile()` - update display name / avatar

---

## ขั้นตอนที่ 5: แก้ไขไฟล์ที่มีอยู่

### `src/App.tsx`
- Wrap ด้วย `AuthProvider`
- เพิ่ม route `/auth` -> `<Auth />`
- Wrap routes ที่ต้อง login ด้วย `<ProtectedRoute>`
- Landing page (`/`) ยังเปิดได้โดยไม่ต้อง login

### `src/pages/Landing.tsx`
- เปลี่ยนปุ่ม "เข้าสู่ Dashboard" เป็น redirect ไป `/auth` หรือ `/dashboard` ตาม auth state

### `src/pages/Dashboard.tsx`
- เปลี่ยนจาก `MOCK_AGENTS` เป็น `useAgents()` hook
- แสดง agents จริงจาก database
- ปุ่ม Delete ทำงานจริงผ่าน `useDeleteAgent()`

### `src/pages/AgentBuilder.tsx`
- `handleCreate` เปลี่ยนเป็น `useCreateAgent()` mutation
- Upload files จริงไปยัง Supabase Storage bucket `knowledge-files`
- บันทึก tools, system prompt, temperature ลง database

### `src/components/layout/AppSidebar.tsx`
- เพิ่มปุ่ม Logout ที่ footer
- แสดง user avatar + display name (จาก `useAuth()`)

### `src/components/layout/AppLayout.tsx`
- แสดง user info ที่ header

---

## ขั้นตอนที่ 6: Google + GitHub OAuth

หลังจาก deploy โค้ดแล้ว ผู้ใช้ต้องตั้งค่า OAuth providers ใน Supabase Dashboard:
1. ไปที่ Authentication > Providers
2. เปิด Google provider - ใส่ Client ID + Secret จาก Google Cloud Console
3. เปิด GitHub provider - ใส่ Client ID + Secret จาก GitHub Developer Settings
4. ตั้ง Site URL และ Redirect URLs

---

## Technical Details

- ใช้ `@supabase/supabase-js` (ถูกติดตั้งอัตโนมัติเมื่อเชื่อมต่อ Lovable Cloud)
- Auth state ใช้ `onAuthStateChange` + React Context
- Data fetching ใช้ `@tanstack/react-query` ที่มีอยู่แล้ว
- File upload ใช้ `supabase.storage.from('knowledge-files').upload()`
- โครงสร้างไฟล์ใน storage: `{user_id}/{agent_id}/{filename}`
- Mock data ยังคงใช้สำหรับ Analytics, Usage, Marketplace (ยังไม่ต้องเปลี่ยน)
- ไม่มี dependency ใหม่ที่ต้องติดตั้งเอง

---

## สรุปไฟล์ที่เปลี่ยนแปลง

| ไฟล์ | Action |
|------|--------|
| Database migrations (3 migrations) | สร้างใหม่ |
| `src/pages/Auth.tsx` | สร้างใหม่ |
| `src/contexts/AuthContext.tsx` | สร้างใหม่ |
| `src/components/ProtectedRoute.tsx` | สร้างใหม่ |
| `src/hooks/useAgents.ts` | สร้างใหม่ |
| `src/hooks/useProfile.ts` | สร้างใหม่ |
| `src/App.tsx` | แก้ไข |
| `src/pages/Landing.tsx` | แก้ไข |
| `src/pages/Dashboard.tsx` | แก้ไข |
| `src/pages/AgentBuilder.tsx` | แก้ไข |
| `src/components/layout/AppSidebar.tsx` | แก้ไข |
| `src/components/layout/AppLayout.tsx` | แก้ไข |

