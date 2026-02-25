

# ปรับปรุง Knowledge Step ในหน้าสร้าง Agent ให้มี Features ครบเหมือน Knowledge Tab

## สิ่งที่จะทำ

ปัจจุบันหน้าสร้าง Agent (`/agents/new`) ขั้นตอน Knowledge (Step 3) มีฟีเจอร์พื้นฐานมาก เพียงแค่เลือกไฟล์ทีละไฟล์และใส่ URL ในขณะที่ Knowledge Tab ในหน้า Agent Detail มีฟีเจอร์ครบถ้วนกว่ามาก จะปรับปรุงให้เหมือนกัน:

### ฟีเจอร์ที่จะเพิ่มใน AgentBuilder Step Knowledge

| ฟีเจอร์ | สถานะปัจจุบัน | หลังปรับปรุง |
|---------|-------------|------------|
| Drag and Drop | ไม่มี | มี - ลากไฟล์วางได้ |
| เลือกหลายไฟล์พร้อมกัน | เลือกทีละไฟล์ | รองรับ multiple files |
| ตรวจสอบประเภทไฟล์ | ไม่มี | แจ้ง error ถ้าไฟล์ไม่รองรับ |
| จำกัดจำนวนไฟล์ | ไม่มี | แสดง X/10 ไฟล์ |
| จำกัดขนาดรวม | ไม่มี | แสดง Progress bar ขนาดรวม / 50MB |
| แสดงขนาดไฟล์ | แสดงเป็น KB | แสดงแบบ auto (B/KB/MB) |
| แสดง Badge ประเภทไฟล์ | ไม่มี | แสดง Badge นามสกุลไฟล์ |
| UI Drag-over effect | ไม่มี | เปลี่ยนสี border เมื่อลากไฟล์เข้ามา |

### ไฟล์ที่ต้องแก้ไข

| ไฟล์ | การเปลี่ยนแปลง |
|------|---------------|
| `src/pages/AgentBuilder.tsx` | ปรับปรุง Step 2 (Knowledge) ให้มี drag-drop, multi-upload, storage indicators, file validation เหมือน KnowledgeTab ใน AgentDetail |

### หมายเหตุ
- เนื่องจากในขั้นตอนสร้าง Agent ยังไม่มี agent id ไฟล์จะถูกเก็บใน state เป็น File objects ก่อน แล้วอัปโหลดจริงหลังสร้าง Agent สำเร็จ (เหมือนเดิม)
- ส่วน URL input จะคงไว้เหมือนเดิม

