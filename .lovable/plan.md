

# Refactor Dashboard.tsx -- แยก Component ย่อย

ปัจจุบัน Dashboard.tsx มี 310 บรรทัด รวม logic + UI ทั้งหมดไว้ในไฟล์เดียว จะแยกออกเป็น 3 component ย่อย

## ไฟล์ใหม่ที่จะสร้าง

### 1. `src/components/dashboard/StatsRow.tsx`
- รับ props: `stats` array (label, value, icon, color, bg)
- แสดง grid 3 คอลัมน์ พร้อม motion animation
- ย้ายจากบรรทัด 122-138 ของ Dashboard.tsx

### 2. `src/components/dashboard/AgentFilters.tsx`
- รับ props: searchQuery, setSearchQuery, statusFilter, setStatusFilter, modelFilter, setModelFilter, sortBy, setSortBy, availableModels, hasActiveFilters, clearFilters
- ย้าย search bar + select dropdowns + clear filters button (บรรทัด 142-198)

### 3. `src/components/dashboard/AgentCard.tsx`
- รับ props: agent, index, knowledgeStats, onDelete
- ย้าย Card + DropdownMenu + Knowledge stats + Badge (บรรทัด 215-284)
- รวม `formatSize`, `MAX_FILES`, `MAX_TOTAL_SIZE` ไว้ในไฟล์นี้

## ไฟล์ที่แก้ไข

### `src/pages/Dashboard.tsx`
- ลบ code ที่ย้ายออกไป
- Import 3 component ใหม่
- คงไว้เฉพาะ: hooks, data fetching, filtering/sorting logic, และ layout structure
- ขนาดจะลดลงจาก ~310 บรรทัดเหลือ ~120 บรรทัด

## ผลลัพธ์
- ไม่มีการเปลี่ยนแปลง UI หรือ behavior ใดๆ
- แต่ละ component มีหน้าที่ชัดเจน แก้ไขง่ายขึ้น

