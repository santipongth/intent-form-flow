

# เพิ่มปุ่มสลับภาษา + Dark Mode ในหน้า Landing

## สิ่งที่ต้องทำ

แก้ไขไฟล์เดียว: `src/pages/Landing.tsx`

### รายละเอียด
- เพิ่มปุ่มสลับภาษา (Globe icon + TH/EN) และปุ่ม Dark Mode (Sun/Moon icon) ใน navbar ของหน้า Landing ข้างปุ่ม "เข้าสู่ระบบ"
- Import `useTheme` จาก `ThemeContext` (มีอยู่แล้วใน Landing แต่ยังไม่ได้ใช้)
- เพิ่ม `Globe`, `Sun`, `Moon` icons จาก lucide-react
- วาง 2 ปุ่มใหม่ใน nav bar ก่อนปุ่ม Sign In:
  1. ปุ่มสลับภาษา: แสดง Globe icon + "TH"/"EN" กดแล้วสลับ locale
  2. ปุ่ม Dark Mode: แสดง Sun (dark mode) หรือ Moon (light mode) กดแล้ว toggle theme

### ไฟล์ที่แก้ไข
| ไฟล์ | Action |
|------|--------|
| `src/pages/Landing.tsx` | แก้ไข - เพิ่มปุ่มสลับภาษาและ Dark Mode ใน navbar |

### Technical Details
- Import เพิ่ม: `useTheme` from `@/contexts/ThemeContext`, `Globe`, `Sun`, `Moon` from `lucide-react`
- เพิ่ม `const { theme, toggleTheme } = useTheme()` ใน component
- เพิ่ม `const { locale, setLocale } = useLanguage()` (มี `useLanguage` อยู่แล้ว แค่ destructure เพิ่ม `locale` กับ `setLocale`)
- วางปุ่มใน nav section ก่อนปุ่ม Sign In โดยใช้ `Button variant="ghost"` ให้เข้ากับ style ที่มีอยู่

