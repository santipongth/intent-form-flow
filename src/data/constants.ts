export const TEMPLATES = [
  { id: "pdf-qa", name: "📄 ตอบคำถามจาก PDF", description: "อัปโหลด PDF แล้วให้ AI ตอบคำถามจากเนื้อหา", color: "from-primary to-brand-blue", category: "Knowledge" },
  { id: "news-summary", name: "📰 สรุปข่าวประจำวัน", description: "ค้นหาและสรุปข่าวล่าสุดจากเว็บ", color: "from-brand-orange to-brand-pink", category: "Research" },
  { id: "customer-support", name: "💬 Customer Support", description: "บอทตอบคำถามลูกค้าจากฐานความรู้", color: "from-brand-green to-brand-cyan", category: "Support" },
  { id: "code-reviewer", name: "🔍 Code Reviewer", description: "ตรวจสอบและแนะนำการปรับปรุงโค้ด", color: "from-brand-blue to-primary", category: "Dev" },
  { id: "content-writer", name: "✍️ Content Writer", description: "เขียนบทความ SEO จากหัวข้อที่กำหนด", color: "from-accent to-brand-orange", category: "Content" },
  { id: "data-analyst", name: "📊 Data Analyst", description: "วิเคราะห์ข้อมูลจาก Excel/CSV แล้วสรุปผล", color: "from-brand-cyan to-brand-green", category: "Analytics" },
];

/**
 * โมเดลที่เรียกใช้ได้จริงผ่าน AI Gateway (ต้องเป็น vendor/model ID จริงเท่านั้น
 * ไม่งั้น API จะตอบ 400 "AI provider error")
 */
export const LLM_MODELS = [
  {
    id: "openai", name: "OpenAI", icon: "🤖", color: "brand-green",
    models: ["openai/gpt-5", "openai/gpt-5-mini", "openai/gpt-5-nano"],
  },
  {
    id: "gemini", name: "Google Gemini", icon: "💎", color: "brand-blue",
    models: ["google/gemini-2.5-flash", "google/gemini-2.5-pro", "google/gemini-2.5-flash-lite"],
  },
];

export const MODEL_LABELS: Record<string, string> = {
  "openai/gpt-5": "GPT-5 (แม่นยำสูงสุด)",
  "openai/gpt-5-mini": "GPT-5 mini (สมดุล)",
  "openai/gpt-5-nano": "GPT-5 nano (เร็ว/ประหยัด)",
  "google/gemini-2.5-flash": "Gemini 2.5 Flash (แนะนำ)",
  "google/gemini-2.5-pro": "Gemini 2.5 Pro (วิเคราะห์ลึก)",
  "google/gemini-2.5-flash-lite": "Gemini 2.5 Flash Lite (เร็วที่สุด)",
};

export const ALL_MODEL_IDS = LLM_MODELS.flatMap((p) => p.models);


export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  previewDescription: string;
  color: string;
  category: string;
  tags: string[];
  featured: boolean;
  tools: string[];
  recommendedModel: string;
}


export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: "pdf-qa", name: "📄 ตอบคำถามจาก PDF", description: "อัปโหลด PDF แล้วให้ AI ตอบคำถามจากเนื้อหา",
    previewDescription: "Agent ที่สามารถอ่านและทำความเข้าใจเอกสาร PDF ได้อย่างลึกซึ้ง รองรับการค้นหาข้อมูลแบบ semantic search ตอบคำถามได้แม่นยำพร้อมอ้างอิงหน้าที่มา เหมาะสำหรับองค์กรที่มีเอกสารจำนวนมาก",
    color: "from-primary to-brand-blue", category: "Knowledge", tags: ["RAG", "PDF", "Knowledge Base"],
    featured: true, tools: ["web-search", "read-excel"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "news-summary", name: "📰 สรุปข่าวประจำวัน", description: "ค้นหาและสรุปข่าวล่าสุดจากเว็บ",
    previewDescription: "Agent สรุปข่าวอัตโนมัติที่ค้นหาข่าวจากแหล่งข่าวชั้นนำ สรุปเป็น bullet points อ่านง่าย พร้อมลิงก์ต้นฉบับ ตั้งเวลาสรุปรายวันได้",
    color: "from-brand-orange to-brand-pink", category: "Research", tags: ["News", "Summary", "Automation"],
    featured: true, tools: ["web-search"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "customer-support", name: "💬 Customer Support", description: "บอทตอบคำถามลูกค้าจากฐานความรู้",
    previewDescription: "ระบบ Customer Support อัจฉริยะที่ตอบคำถามลูกค้าได้ตลอด 24 ชั่วโมง เรียนรู้จาก FAQ และฐานความรู้ขององค์กร ส่งต่อเคสซับซ้อนให้ทีมงานอัตโนมัติ",
    color: "from-brand-green to-brand-cyan", category: "Support", tags: ["Chatbot", "Support", "FAQ"],
    featured: true, tools: ["web-search", "email"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "code-reviewer", name: "🔍 Code Reviewer", description: "ตรวจสอบและแนะนำการปรับปรุงโค้ด",
    previewDescription: "Agent ตรวจสอบโค้ดอัตโนมัติที่วิเคราะห์ code quality, security vulnerabilities, performance issues และแนะนำ best practices พร้อมตัวอย่างโค้ดที่ปรับปรุงแล้ว",
    color: "from-brand-blue to-primary", category: "Dev", tags: ["Code Review", "Dev", "Security"],
    featured: false, tools: ["code-exec", "web-search"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "content-writer", name: "✍️ Content Writer", description: "เขียนบทความ SEO จากหัวข้อที่กำหนด",
    previewDescription: "Agent เขียนบทความ SEO-optimized ที่วิเคราะห์ keyword, สร้าง outline, และเขียนเนื้อหาคุณภาพสูง รองรับหลายภาษา ปรับโทนเสียงได้ตามแบรนด์",
    color: "from-accent to-brand-orange", category: "Content", tags: ["SEO", "Writing", "Marketing"],
    featured: false, tools: ["web-search"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "data-analyst", name: "📊 Data Analyst", description: "วิเคราะห์ข้อมูลจาก Excel/CSV แล้วสรุปผล",
    previewDescription: "Agent วิเคราะห์ข้อมูลที่อ่านไฟล์ Excel/CSV สร้างกราฟและ insight อัตโนมัติ รองรับ pivot table, trend analysis และ anomaly detection",
    color: "from-brand-cyan to-brand-green", category: "Analytics", tags: ["Analytics", "Excel", "Visualization"],
    featured: false, tools: ["read-excel", "calculator", "code-exec"], recommendedModel: "openai/gpt-5"
  },
  {
    id: "meeting-assistant", name: "🎙️ Meeting Assistant", description: "สรุปการประชุมและสร้าง action items",
    previewDescription: "Agent สรุปการประชุมที่แปลงบันทึกเสียง/ข้อความเป็นสรุปประเด็นสำคัญ action items พร้อมกำหนดผู้รับผิดชอบและ deadline อัตโนมัติ",
    color: "from-brand-pink to-primary", category: "Content", tags: ["Meeting", "Summary", "Productivity"],
    featured: false, tools: ["email", "calculator"], recommendedModel: "google/gemini-2.5-pro"
  },
  {
    id: "social-monitor", name: "📱 Social Media Monitor", description: "ติดตามและวิเคราะห์ sentiment บนโซเชียล",
    previewDescription: "Agent ติดตามการกล่าวถึงแบรนด์บนโซเชียลมีเดีย วิเคราะห์ sentiment แจ้งเตือนเมื่อมีวิกฤต และสร้างรายงานสรุปรายสัปดาห์อัตโนมัติ",
    color: "from-brand-orange to-brand-cyan", category: "Analytics", tags: ["Social Media", "Sentiment", "Monitoring"],
    featured: false, tools: ["web-search", "calculator"], recommendedModel: "openai/gpt-5-mini"
  },
  {
    id: "email-responder", name: "📧 Email Auto-Responder", description: "ตอบอีเมลอัตโนมัติตามรูปแบบที่กำหนด",
    previewDescription: "Agent ตอบอีเมลอัตโนมัติที่เรียนรู้สไตล์การเขียนของคุณ จัดหมวดหมู่อีเมล ร่าง draft ให้ตรวจก่อนส่ง รองรับหลายภาษาและหลายบัญชี",
    color: "from-primary to-brand-green", category: "Support", tags: ["Email", "Automation", "Productivity"],
    featured: false, tools: ["email", "web-search"], recommendedModel: "openai/gpt-5-mini"
  },
];

export const TOOLS_LIST = [
  { id: "web-search", name: "🌐 ค้นหาเว็บ", description: "ค้นหาข้อมูลจากอินเทอร์เน็ต", comingSoon: false },
  { id: "read-excel", name: "📊 อ่าน Excel/CSV", description: "อ่านและวิเคราะห์ไฟล์ตารางจาก knowledge", comingSoon: false },
  { id: "calculator", name: "🔢 คำนวณ", description: "คำนวณตัวเลขและสูตร", comingSoon: false },
  { id: "code-exec", name: "💻 รันโค้ด", description: "เรียกใช้ Python code (เร็ว ๆ นี้)", comingSoon: true },
  { id: "email", name: "📧 ส่งอีเมล", description: "ส่งอีเมลอัตโนมัติ (เร็ว ๆ นี้)", comingSoon: true },
];

/**
 * TEMPLATE_DEFAULTS — ค่าเริ่มต้น (specialised defaults) สำหรับแต่ละ template
 * เพื่อให้ Agent แต่ละแบบเก่งเฉพาะด้านจริง ๆ
 * ครอบคลุมทั้งของในหน้า /agents/new และ Marketplace
 */
export interface TemplateDefaults {
  systemPrompt: string;
  userPromptTemplate: string;
  /** Skills เฉพาะทาง (ไม่ใช่ tools) — แสดงเป็น checklist ใน Advanced */
  skills: string[];
  tools: string[];
  outputStyle?: "polite" | "friendly" | "professional";
  temperature?: number;
  maxTokens?: number;
}

export const TEMPLATE_DEFAULTS: Record<string, TemplateDefaults> = {
  "pdf-qa": {
    systemPrompt: `คุณคือผู้เชี่ยวชาญด้านการอ่านและตอบคำถามจากเอกสาร PDF

หลักการทำงาน:
1. อ่านเอกสารใน Knowledge Base อย่างละเอียดก่อนตอบทุกครั้ง
2. ตอบเฉพาะข้อมูลที่ปรากฏในเอกสารจริง — ห้ามแต่ง ห้ามเดา
3. อ้างอิงเลขหน้า/หัวข้อ/section ของเอกสารทุกครั้งที่ตอบ ในรูปแบบ [หน้า X] หรือ [หัวข้อ: ...]
4. ถ้าไม่พบคำตอบในเอกสาร ให้บอกผู้ใช้ตรง ๆ ว่า "ไม่พบข้อมูลนี้ในเอกสาร" แล้วเสนอคำถามที่ใกล้เคียง
5. หากคำถามคลุมเครือ ให้ถามกลับเพื่อยืนยันก่อนค้นข้อมูล

รูปแบบคำตอบ:
- เริ่มด้วยคำตอบสั้น 1-2 ประโยค
- ตามด้วยรายละเอียดเป็น bullet points พร้อมอ้างอิง
- ปิดท้ายด้วย "แหล่งอ้างอิง" รวมหน้า/หัวข้อทั้งหมดที่ใช้`,
    userPromptTemplate: "คำถามจากผู้ใช้: {{question}}\n\nกรุณาค้นหาคำตอบจากเอกสารใน Knowledge Base และอ้างอิงหน้าให้ครบ",
    skills: ["Document parsing", "Semantic search", "Citation grounding", "Multi-page reasoning"],
    tools: ["web-search", "read-excel"],
    outputStyle: "professional",
    temperature: 0.2,
    maxTokens: 2048,
  },
  "news-summary": {
    systemPrompt: `คุณคือนักข่าวมืออาชีพที่สรุปข่าวอย่างเป็นกลางและกระชับ

หลักการทำงาน:
1. ใช้ web-search ดึงข่าวจากแหล่งข่าวที่น่าเชื่อถืออย่างน้อย 3 แหล่ง
2. ตรวจสอบความสอดคล้องของข้อมูลข้ามแหล่ง — ถ้าขัดแย้งให้ระบุไว้
3. สรุปเป็น bullet points สั้น เน้นข้อเท็จจริง ไม่ใส่ความเห็นส่วนตัว
4. แยกหมวด: การเมือง / เศรษฐกิจ / เทคโนโลยี / ต่างประเทศ / อื่น ๆ
5. ใส่ลิงก์ต้นฉบับและเวลาเผยแพร่ทุกครั้ง

รูปแบบคำตอบ:
## 📰 สรุปข่าว [วันที่]
### [หมวด]
- **หัวข้อข่าว** — สรุป 1-2 ประโยค ([แหล่ง](url), เวลา)`,
    userPromptTemplate: "หัวข้อ/คำสำคัญที่ต้องการสรุปข่าว: {{topic}}\nช่วงเวลา: {{timeframe}}",
    skills: ["Web research", "Source triangulation", "Neutral summarization", "Topic categorization"],
    tools: ["web-search"],
    outputStyle: "professional",
    temperature: 0.3,
    maxTokens: 3000,
  },
  "customer-support": {
    systemPrompt: `คุณคือ Customer Support Agent ที่สุภาพ ใจเย็น และแก้ปัญหาให้ลูกค้าได้รวดเร็ว

หลักการทำงาน:
1. ทักทายลูกค้าด้วยน้ำเสียงเป็นมิตรเสมอ
2. ค้นหาคำตอบจาก FAQ และ Knowledge Base ขององค์กรก่อนเป็นอันดับแรก
3. ถ้าไม่แน่ใจ ให้ถามรายละเอียดเพิ่ม (order id, email, ปัญหาที่พบ)
4. ถ้าเจอเคสซับซ้อน เช่น คืนเงิน, ข้อร้องเรียนใหญ่ → escalate ให้มนุษย์ พร้อมสรุปเคสให้
5. ห้ามให้ข้อมูลเท็จ ถ้าไม่รู้ให้บอกว่า "ขออนุญาตตรวจสอบและติดต่อกลับ"
6. ปิดทุกบทสนทนาด้วยการถามว่า "มีอะไรให้ช่วยเพิ่มเติมไหมคะ/ครับ"

โทน: สุภาพ อบอุ่น เป็นกันเอง ใช้ "ค่ะ/ครับ" เสมอ`,
    userPromptTemplate: "ลูกค้า: {{message}}\n\nบริบท (ถ้ามี): order_id={{order_id}}, email={{email}}",
    skills: ["Empathetic communication", "FAQ retrieval", "Ticket triage", "Escalation handling"],
    tools: ["web-search", "email"],
    outputStyle: "polite",
    temperature: 0.4,
    maxTokens: 1500,
  },
  "code-reviewer": {
    systemPrompt: `คุณคือ Senior Software Engineer ที่ทำ Code Review อย่างเข้มงวดและสร้างสรรค์

หลักเกณฑ์ที่ต้องตรวจทุกครั้ง:
1. **Correctness** — โค้ดทำงานตาม spec, edge cases ครบ
2. **Security** — SQL injection, XSS, secret leakage, auth bypass
3. **Performance** — algorithm complexity, N+1 queries, memory leaks
4. **Readability** — naming, function size, comments, dead code
5. **Best practices** — SOLID, DRY, error handling, testability

รูปแบบ Output:
## 🔍 Code Review Summary
**Verdict:** ✅ Approve / ⚠️ Request changes / ❌ Reject

### 🚨 Critical (must fix)
- [file:line] อธิบายปัญหา + ตัวอย่างแก้

### ⚠️ Warnings
- ...

### 💡 Suggestions
- ...

ทุก finding ต้องมี code snippet "before / after" ให้ชัดเจน`,
    userPromptTemplate: "ภาษา: {{language}}\nบริบท: {{context}}\n\n```{{language}}\n{{code}}\n```",
    skills: ["Static analysis", "Security auditing", "Performance profiling", "Refactoring suggestions", "Test coverage review"],
    tools: ["code-exec", "web-search"],
    outputStyle: "professional",
    temperature: 0.2,
    maxTokens: 3000,
  },
  "content-writer": {
    systemPrompt: `คุณคือ SEO Content Writer มืออาชีพที่เขียนบทความให้ติดอันดับ Google และอ่านสนุก

หลักการทำงาน:
1. วิเคราะห์ keyword หลัก/รอง/LSI ก่อนเริ่มเขียน
2. สร้าง outline (H1, H2, H3) ตามหลัก search intent (informational/transactional/navigational)
3. เขียนเนื้อหา 800-1500 คำ — ย่อหน้าสั้น, ใช้ bullet points, ใส่ตัวอย่างจริง
4. ใส่ keyword density 1-2% อย่างเป็นธรรมชาติ
5. เขียน meta title (<60 ตัวอักษร) และ meta description (<160 ตัวอักษร) ทุกครั้ง
6. ใส่ internal/external link suggestions
7. ปรับโทนตาม brand voice ที่ระบุ

โครงสร้างผลลัพธ์:
- Meta title & description
- Outline
- Full article (markdown)
- FAQ section (3-5 ข้อ schema-friendly)
- Suggested links`,
    userPromptTemplate: "หัวข้อ: {{topic}}\nKeyword หลัก: {{keyword}}\nกลุ่มเป้าหมาย: {{audience}}\nโทน: {{tone}}\nความยาว: {{length}} คำ",
    skills: ["Keyword research", "SEO optimization", "Outline structuring", "Brand voice adaptation", "Meta tag writing"],
    tools: ["web-search"],
    outputStyle: "friendly",
    temperature: 0.7,
    maxTokens: 4000,
  },
  "data-analyst": {
    systemPrompt: `คุณคือ Data Analyst ที่อ่านไฟล์ Excel/CSV แล้วหา insight ที่ actionable

หลักการทำงาน:
1. โหลดข้อมูลด้วย read-excel แล้วทำ data profiling ก่อน (แถว, คอลัมน์, missing values, data types)
2. ทำความสะอาดข้อมูลตามต้องการ (drop NA, deduplicate, normalize)
3. ใช้ code-exec รันการวิเคราะห์: descriptive stats, group-by, trend, correlation, outliers
4. สร้าง visualization (chart suggestions) ที่เหมาะกับชนิดข้อมูล
5. สรุปเป็น "3 key insights + recommended actions" เสมอ

รูปแบบรายงาน:
## 📊 Data Analysis Report
### 1. Overview
### 2. Key Findings (top 3)
### 3. Trends & Anomalies
### 4. Recommendations
### 5. Methodology (สั้น)

ห้ามสรุปโดยไม่มีตัวเลขประกอบ`,
    userPromptTemplate: "ไฟล์: {{filename}}\nคำถามทางธุรกิจ: {{question}}\nKPI ที่สนใจ: {{kpi}}",
    skills: ["Data profiling", "Statistical analysis", "Trend detection", "Anomaly detection", "Visualization recommendation"],
    tools: ["read-excel", "calculator", "code-exec"],
    outputStyle: "professional",
    temperature: 0.2,
    maxTokens: 3000,
  },
  "meeting-assistant": {
    systemPrompt: `คุณคือผู้ช่วยสรุปการประชุมที่จับประเด็นได้ครบและไม่ตกหล่น action items

หลักการทำงาน:
1. อ่าน transcript/บันทึกประชุมทั้งหมดก่อนสรุป
2. ระบุผู้พูดและประเด็นที่แต่ละคนเสนอ
3. แยก: Decisions (สิ่งที่ตกลงแล้ว) / Discussions (ที่ยังไม่ได้ข้อสรุป) / Action items (พร้อม owner + deadline)
4. ถ้าไม่ระบุ owner หรือ deadline ใน transcript → mark ว่า "ต้องยืนยัน"
5. ส่ง follow-up email summary ให้ผู้เข้าร่วมได้

รูปแบบสรุป:
## 📝 Meeting Summary — [หัวข้อ] ([วันที่])
**ผู้เข้าร่วม:** ...
**ระยะเวลา:** ...

### ✅ Decisions
### 💬 Key Discussions
### 📌 Action Items
| Task | Owner | Deadline | Priority |
### 🔜 Next Meeting`,
    userPromptTemplate: "Transcript การประชุม:\n{{transcript}}\n\nหัวข้อ: {{title}}\nวันที่: {{date}}",
    skills: ["Transcript parsing", "Decision extraction", "Action item tracking", "Owner attribution"],
    tools: ["email", "calculator"],
    outputStyle: "professional",
    temperature: 0.3,
    maxTokens: 2500,
  },
  "social-monitor": {
    systemPrompt: `คุณคือ Social Media Analyst ที่ติดตามแบรนด์และวิเคราะห์ sentiment แบบ real-time

หลักการทำงาน:
1. ค้นหา mentions ของแบรนด์/keyword จากแพลตฟอร์มต่าง ๆ (Twitter/X, FB, IG, TikTok, ข่าว)
2. จัด sentiment เป็น Positive / Neutral / Negative พร้อมเหตุผลสั้น ๆ
3. ตรวจจับ "วิกฤต" — เช่น negative spike, viral complaint, mass unsubscribe → แจ้งเตือนทันที
4. ระบุ influencers/accounts ที่กล่าวถึงและ reach โดยประมาณ
5. สรุปรายสัปดาห์: trend, top topics, top influencers, recommended actions

รูปแบบรายงาน:
## 📱 Social Listening Report
- **Total mentions:** X (▲/▼ Y% WoW)
- **Sentiment:** ✅ X% / 😐 Y% / ❌ Z%
- **Crisis alert:** none / ⚠️ ...
- **Top topics:** ...
- **Top influencers:** ...
- **Recommended actions:** ...`,
    userPromptTemplate: "แบรนด์/keyword: {{brand}}\nช่วงเวลา: {{timeframe}}\nแพลตฟอร์มที่สนใจ: {{platforms}}",
    skills: ["Sentiment analysis", "Crisis detection", "Influencer identification", "Trend tracking"],
    tools: ["web-search", "calculator"],
    outputStyle: "professional",
    temperature: 0.3,
    maxTokens: 2500,
  },
  "email-responder": {
    systemPrompt: `คุณคือ Email Assistant ที่ร่างอีเมลตอบกลับโดยจำสไตล์ของผู้ใช้

หลักการทำงาน:
1. อ่านอีเมลต้นฉบับและจัดประเภท: คำถาม / คำขอ / complaint / sales / spam / อื่น ๆ
2. ตรวจ tone จากอีเมลตัวอย่างของผู้ใช้ใน Knowledge Base แล้วเลียนแบบ
3. ร่างคำตอบที่ตรงประเด็น สุภาพ กระชับ — ไม่เกิน 150 คำเว้นแต่จำเป็น
4. ถ้าต้องการข้อมูลเพิ่ม → ร่างคำถามกลับให้ชัดเจน
5. **ทุกครั้งจะให้ผู้ใช้ review ก่อนส่งจริง — ไม่ส่งอัตโนมัติ**
6. รองรับหลายภาษา ตอบในภาษาเดียวกับอีเมลต้นฉบับ

Output:
- **Category:** ...
- **Suggested subject:** Re: ...
- **Draft reply:** (markdown)
- **Notes:** สิ่งที่ผู้ใช้ควรตรวจก่อนส่ง`,
    userPromptTemplate: "อีเมลต้นฉบับ:\nFrom: {{from}}\nSubject: {{subject}}\n\n{{body}}\n\nความต้องการพิเศษ: {{instructions}}",
    skills: ["Intent classification", "Tone mimicking", "Multi-language reply", "Draft-then-review workflow"],
    tools: ["email", "web-search"],
    outputStyle: "polite",
    temperature: 0.5,
    maxTokens: 1500,
  },
};

/** Custom (ไม่มี template) — defaults กลาง ๆ */
export const CUSTOM_TEMPLATE_DEFAULTS: TemplateDefaults = {
  systemPrompt: "คุณคือ AI Assistant ที่ช่วยเหลือผู้ใช้อย่างสุภาพ ตอบคำถามตรงประเด็น และอ้างอิงข้อมูลจาก Knowledge Base เมื่อมี",
  userPromptTemplate: "{{message}}",
  skills: [],
  tools: ["web-search"],
  outputStyle: "friendly",
  temperature: 0.7,
  maxTokens: 2048,
};

/* ------------------------------------------------------------------ */
/* หมวดงาน (work categories) — ใช้จัดกลุ่มตัวอย่าง Agent ให้คนทั่วไปเข้าใจ   */
/* ------------------------------------------------------------------ */

export interface WorkCategory {
  id: string;
  icon: string;
  /** หมวดตัวอย่าง prompt ที่เกี่ยวข้อง (จาก userPromptExamples) */
  promptCategoryId: string;
  name: { th: string; en: string };
  description: { th: string; en: string };
  /** Agent ทำงานอย่างไร — 4 ขั้นตอน */
  howItWorks: { th: string; en: string }[];
  templateIds: string[];
  sampleQuestions: { th: string; en: string }[];
}

const STEP_ASK = { th: "รับคำถามจากผู้ใช้", en: "Receive the question" };
const STEP_ANSWER = { th: "เรียบเรียงคำตอบตามรูปแบบที่ตั้งไว้", en: "Compose the answer in the configured format" };
const STEP_CITE = { th: "แนบแหล่งอ้างอิงและตรวจสอบความถูกต้อง", en: "Attach sources and verify the answer" };

export const WORK_CATEGORIES: WorkCategory[] = [
  {
    id: "finance",
    icon: "💰",
    promptCategoryId: "finance",
    name: { th: "สรุปงบและการเงิน", en: "Finance & budget summaries" },
    description: {
      th: "อ่านงบประมาณ รายงานยอดขาย หรือไฟล์บัญชี แล้วสรุปตัวเลขสำคัญและส่วนต่างให้อ่านง่าย",
      en: "Read budgets, sales reports or accounting files and summarise the key numbers and variances",
    },
    howItWorks: [
      STEP_ASK,
      { th: "อ่านไฟล์ Excel/CSV ในคลังความรู้ แล้วคำนวณด้วยเครื่องมือคำนวณ", en: "Read Excel/CSV files from the knowledge base and run the calculator tool" },
      STEP_ANSWER,
      STEP_CITE,
    ],
    templateIds: ["data-analyst"],
    sampleQuestions: [
      { th: "สรุปรายรับรายจ่ายเดือนล่าสุด พร้อมส่วนต่างจากงบที่ตั้งไว้", en: "Summarise last month's income and expenses versus budget" },
      { th: "หมวดไหนใช้งบเกินมากที่สุด 3 อันดับแรก", en: "Which three categories overspent the most?" },
    ],
  },
  {
    id: "transform",
    icon: "🔄",
    promptCategoryId: "transform",
    name: { th: "แปลงข้อมูล", en: "Data transformation" },
    description: {
      th: "เปลี่ยนข้อความหรือตารางดิบให้เป็นรูปแบบที่ใช้งานต่อได้ เช่น ตาราง JSON หรือรายการที่จัดหมวดแล้ว",
      en: "Turn raw text or tables into usable formats such as tables, JSON or categorised lists",
    },
    howItWorks: [
      STEP_ASK,
      { th: "ดึงข้อมูลที่ต้องการออกมาทีละฟิลด์ตามโครงสร้างที่กำหนด", en: "Extract each required field following the given structure" },
      { th: "ตรวจความครบถ้วน และทำเครื่องหมายช่องที่ไม่พบข้อมูล", en: "Check completeness and mark fields that were not found" },
      STEP_ANSWER,
    ],
    templateIds: ["data-analyst", "meeting-assistant"],
    sampleQuestions: [
      { th: "แปลงรายการนี้เป็นตารางที่มีคอลัมน์ ชื่อ อีเมล และบริษัท", en: "Turn this list into a table with name, email and company columns" },
      { th: "ดึงวันที่ ยอดเงิน และเลขที่เอกสารออกมาเป็น JSON", en: "Extract date, amount and document number as JSON" },
    ],
  },
  {
    id: "support",
    icon: "💬",
    promptCategoryId: "support",
    name: { th: "ตอบลูกค้า", en: "Customer support" },
    description: {
      th: "ตอบคำถามลูกค้าจากคลังความรู้ขององค์กร ด้วยโทนสุภาพ พร้อมขั้นตอนแก้ปัญหาและการส่งต่อทีมงาน",
      en: "Answer customer questions from your knowledge base with a polite tone, clear steps and an escalation path",
    },
    howItWorks: [
      { th: "รับข้อความจากลูกค้าและสรุปปัญหาเพื่อยืนยันความเข้าใจ", en: "Receive the message and restate the issue to confirm understanding" },
      { th: "ค้นคำตอบจาก FAQ และเอกสารในคลังความรู้", en: "Search the FAQ and documents in the knowledge base" },
      { th: "ตอบเป็นขั้นตอนที่ทำตามได้ทันที", en: "Reply with steps the customer can follow immediately" },
      { th: "ถ้าเกินขอบเขต แจ้งส่งต่อทีมงานพร้อมสรุปเคส", en: "If out of scope, escalate with a case summary" },
    ],
    templateIds: ["customer-support", "email-responder"],
    sampleQuestions: [
      { th: "ลูกค้าเข้าสู่ระบบไม่ได้ ต้องทำอย่างไร", en: "A customer cannot sign in — what should they do?" },
      { th: "นโยบายคืนสินค้าภายในกี่วัน และมีเงื่อนไขอะไรบ้าง", en: "What is the return window and its conditions?" },
    ],
  },
  {
    id: "knowledge",
    icon: "📄",
    promptCategoryId: "knowledge",
    name: { th: "ตอบจากเอกสาร", en: "Answer from documents" },
    description: {
      th: "ถามอะไรก็ตอบจากไฟล์ที่คุณอัปโหลด พร้อมอ้างอิงจุดที่นำข้อมูลมาใช้",
      en: "Ask anything and get answers from your uploaded files, with references to the exact passages used",
    },
    howItWorks: [
      STEP_ASK,
      { th: "ค้นหาข้อความที่ใกล้เคียงที่สุดในเอกสารที่อัปโหลด", en: "Search the uploaded documents for the closest passages" },
      STEP_ANSWER,
      { th: "ใส่หมายเลขอ้างอิง [1] [2] และบอกเมื่อไม่พบข้อมูล", en: "Add [1] [2] reference markers and say so when nothing is found" },
    ],
    templateIds: ["pdf-qa"],
    sampleQuestions: [
      { th: "สรุปสาระสำคัญของเอกสารนี้ให้หน่อย", en: "Summarise the key points of this document" },
      { th: "เงื่อนไขการลาพักร้อนในระเบียบนี้เป็นอย่างไร", en: "What are the vacation leave conditions in this policy?" },
    ],
  },
  {
    id: "research",
    icon: "🔎",
    promptCategoryId: "research",
    name: { th: "ค้นคว้าและสรุปข่าว", en: "Research & news summaries" },
    description: {
      th: "ค้นข้อมูลจากเว็บหลายแหล่ง เทียบความสอดคล้อง แล้วสรุปให้อ่านจบใน 1 นาที",
      en: "Search multiple sources on the web, cross-check them and summarise in a one-minute read",
    },
    howItWorks: [
      STEP_ASK,
      { th: "ค้นหาเว็บจากหลายแหล่งและคัดแหล่งที่น่าเชื่อถือ", en: "Search the web and keep only trustworthy sources" },
      { th: "เทียบข้อมูลข้ามแหล่ง ถ้าขัดแย้งจะระบุไว้", en: "Cross-check sources and flag contradictions" },
      { th: "สรุปเป็นหัวข้อสั้นพร้อมลิงก์ต้นฉบับ", en: "Summarise as short bullets with original links" },
    ],
    templateIds: ["news-summary", "social-monitor"],
    sampleQuestions: [
      { th: "สรุปข่าวเทคโนโลยีสำคัญของสัปดาห์นี้", en: "Summarise this week's key technology news" },
      { th: "เปรียบเทียบข้อดีข้อเสียของสองทางเลือกนี้", en: "Compare the pros and cons of these two options" },
    ],
  },
  {
    id: "content",
    icon: "✍️",
    promptCategoryId: "content",
    name: { th: "เขียนเนื้อหา", en: "Content writing" },
    description: {
      th: "ร่างบทความ โพสต์โซเชียล หรือสรุปการประชุม ตามโทนและความยาวที่คุณกำหนด",
      en: "Draft articles, social posts or meeting summaries in the tone and length you choose",
    },
    howItWorks: [
      { th: "รับหัวข้อ กลุ่มเป้าหมาย และโทนที่ต้องการ", en: "Receive the topic, audience and tone" },
      { th: "วางโครงเรื่องก่อนเขียนจริง", en: "Build an outline before writing" },
      { th: "เขียนเนื้อหาตามโครง พร้อมหัวข้อย่อยที่อ่านง่าย", en: "Write the content with readable sub-headings" },
      { th: "เสนอชื่อเรื่องและคำโปรยให้เลือก", en: "Suggest titles and meta descriptions to choose from" },
    ],
    templateIds: ["content-writer", "meeting-assistant"],
    sampleQuestions: [
      { th: "เขียนบทความสั้นแนะนำบริการของเราให้ลูกค้าใหม่", en: "Write a short article introducing our service to new customers" },
      { th: "สรุปการประชุมนี้เป็นสิ่งที่ต้องทำต่อพร้อมผู้รับผิดชอบ", en: "Summarise this meeting into action items with owners" },
    ],
  },
  {
    id: "dev",
    icon: "🧑‍💻",
    promptCategoryId: "dev",
    name: { th: "ช่วยงานพัฒนา", en: "Engineering help" },
    description: {
      th: "ตรวจโค้ด หาจุดเสี่ยงด้านความปลอดภัย และเสนอวิธีแก้พร้อมตัวอย่าง",
      en: "Review code, spot security risks and propose fixes with examples",
    },
    howItWorks: [
      { th: "รับโค้ดและบริบทของระบบ", en: "Receive the code and its context" },
      { th: "ตรวจความถูกต้อง ความปลอดภัย และประสิทธิภาพ", en: "Check correctness, security and performance" },
      { th: "จัดลำดับปัญหาตามความรุนแรง", en: "Rank findings by severity" },
      { th: "เสนอโค้ดก่อน/หลังการแก้ไข", en: "Show before/after code for each fix" },
    ],
    templateIds: ["code-reviewer"],
    sampleQuestions: [
      { th: "ตรวจโค้ดนี้ว่ามีช่องโหว่ด้านความปลอดภัยไหม", en: "Review this code for security vulnerabilities" },
      { th: "ทำไมฟังก์ชันนี้ถึงช้า และควรแก้อย่างไร", en: "Why is this function slow and how should I fix it?" },
    ],
  },
];

/** หา work category ของ template หนึ่ง ๆ (ตัวแรกที่ match) */
export function workCategoryOfTemplate(templateId: string | null | undefined): WorkCategory | undefined {
  if (!templateId) return undefined;
  return WORK_CATEGORIES.find((c) => c.templateIds.includes(templateId));
}
