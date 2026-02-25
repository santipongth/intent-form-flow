export const TEMPLATES = [
  { id: "pdf-qa", name: "📄 ตอบคำถามจาก PDF", description: "อัปโหลด PDF แล้วให้ AI ตอบคำถามจากเนื้อหา", color: "from-primary to-brand-blue", category: "Knowledge" },
  { id: "news-summary", name: "📰 สรุปข่าวประจำวัน", description: "ค้นหาและสรุปข่าวล่าสุดจากเว็บ", color: "from-brand-orange to-brand-pink", category: "Research" },
  { id: "customer-support", name: "💬 Customer Support", description: "บอทตอบคำถามลูกค้าจากฐานความรู้", color: "from-brand-green to-brand-cyan", category: "Support" },
  { id: "code-reviewer", name: "🔍 Code Reviewer", description: "ตรวจสอบและแนะนำการปรับปรุงโค้ด", color: "from-brand-blue to-primary", category: "Dev" },
  { id: "content-writer", name: "✍️ Content Writer", description: "เขียนบทความ SEO จากหัวข้อที่กำหนด", color: "from-accent to-brand-orange", category: "Content" },
  { id: "data-analyst", name: "📊 Data Analyst", description: "วิเคราะห์ข้อมูลจาก Excel/CSV แล้วสรุปผล", color: "from-brand-cyan to-brand-green", category: "Analytics" },
];

export const LLM_MODELS = [
  { id: "openai", name: "OpenAI", models: ["GPT-4o", "GPT-4o mini", "GPT-4 Turbo"], icon: "🤖", color: "brand-green" },
  { id: "anthropic", name: "Anthropic", models: ["Claude 3.5 Sonnet", "Claude 3 Haiku"], icon: "🧠", color: "brand-orange" },
  { id: "gemini", name: "Google Gemini", models: ["Gemini Pro", "Gemini Flash"], icon: "💎", color: "brand-blue" },
  { id: "groq", name: "Groq", models: ["Llama 3.1 70B", "Mixtral 8x7B"], icon: "⚡", color: "brand-cyan" },
];

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  previewDescription: string;
  color: string;
  category: string;
  author: string;
  rating: number;
  reviewCount: number;
  usageCount: number;
  tags: string[];
  featured: boolean;
  tools: string[];
  recommendedModel: string;
}

export const MARKETPLACE_TEMPLATES: MarketplaceTemplate[] = [
  {
    id: "pdf-qa", name: "📄 ตอบคำถามจาก PDF", description: "อัปโหลด PDF แล้วให้ AI ตอบคำถามจากเนื้อหา",
    previewDescription: "Agent ที่สามารถอ่านและทำความเข้าใจเอกสาร PDF ได้อย่างลึกซึ้ง รองรับการค้นหาข้อมูลแบบ semantic search ตอบคำถามได้แม่นยำพร้อมอ้างอิงหน้าที่มา เหมาะสำหรับองค์กรที่มีเอกสารจำนวนมาก",
    color: "from-primary to-brand-blue", category: "Knowledge", author: "ThoughtMind Team",
    rating: 4.8, reviewCount: 124, usageCount: 2340, tags: ["RAG", "PDF", "Knowledge Base"],
    featured: true, tools: ["web-search", "read-excel"], recommendedModel: "GPT-4o"
  },
  {
    id: "news-summary", name: "📰 สรุปข่าวประจำวัน", description: "ค้นหาและสรุปข่าวล่าสุดจากเว็บ",
    previewDescription: "Agent สรุปข่าวอัตโนมัติที่ค้นหาข่าวจากแหล่งข่าวชั้นนำ สรุปเป็น bullet points อ่านง่าย พร้อมลิงก์ต้นฉบับ ตั้งเวลาสรุปรายวันได้",
    color: "from-brand-orange to-brand-pink", category: "Research", author: "NewsBot Lab",
    rating: 4.5, reviewCount: 89, usageCount: 1560, tags: ["News", "Summary", "Automation"],
    featured: true, tools: ["web-search"], recommendedModel: "Claude 3.5 Sonnet"
  },
  {
    id: "customer-support", name: "💬 Customer Support", description: "บอทตอบคำถามลูกค้าจากฐานความรู้",
    previewDescription: "ระบบ Customer Support อัจฉริยะที่ตอบคำถามลูกค้าได้ตลอด 24 ชั่วโมง เรียนรู้จาก FAQ และฐานความรู้ขององค์กร ส่งต่อเคสซับซ้อนให้ทีมงานอัตโนมัติ",
    color: "from-brand-green to-brand-cyan", category: "Support", author: "SupportAI",
    rating: 4.7, reviewCount: 203, usageCount: 4120, tags: ["Chatbot", "Support", "FAQ"],
    featured: true, tools: ["web-search", "email"], recommendedModel: "GPT-4o"
  },
  {
    id: "code-reviewer", name: "🔍 Code Reviewer", description: "ตรวจสอบและแนะนำการปรับปรุงโค้ด",
    previewDescription: "Agent ตรวจสอบโค้ดอัตโนมัติที่วิเคราะห์ code quality, security vulnerabilities, performance issues และแนะนำ best practices พร้อมตัวอย่างโค้ดที่ปรับปรุงแล้ว",
    color: "from-brand-blue to-primary", category: "Dev", author: "DevTools Pro",
    rating: 4.6, reviewCount: 156, usageCount: 2890, tags: ["Code Review", "Dev", "Security"],
    featured: false, tools: ["code-exec", "web-search"], recommendedModel: "GPT-4o"
  },
  {
    id: "content-writer", name: "✍️ Content Writer", description: "เขียนบทความ SEO จากหัวข้อที่กำหนด",
    previewDescription: "Agent เขียนบทความ SEO-optimized ที่วิเคราะห์ keyword, สร้าง outline, และเขียนเนื้อหาคุณภาพสูง รองรับหลายภาษา ปรับโทนเสียงได้ตามแบรนด์",
    color: "from-accent to-brand-orange", category: "Content", author: "ContentCraft",
    rating: 4.3, reviewCount: 67, usageCount: 980, tags: ["SEO", "Writing", "Marketing"],
    featured: false, tools: ["web-search"], recommendedModel: "Claude 3.5 Sonnet"
  },
  {
    id: "data-analyst", name: "📊 Data Analyst", description: "วิเคราะห์ข้อมูลจาก Excel/CSV แล้วสรุปผล",
    previewDescription: "Agent วิเคราะห์ข้อมูลที่อ่านไฟล์ Excel/CSV สร้างกราฟและ insight อัตโนมัติ รองรับ pivot table, trend analysis และ anomaly detection",
    color: "from-brand-cyan to-brand-green", category: "Analytics", author: "DataWizard",
    rating: 4.4, reviewCount: 91, usageCount: 1340, tags: ["Analytics", "Excel", "Visualization"],
    featured: false, tools: ["read-excel", "calculator", "code-exec"], recommendedModel: "GPT-4o"
  },
  {
    id: "meeting-assistant", name: "🎙️ Meeting Assistant", description: "สรุปการประชุมและสร้าง action items",
    previewDescription: "Agent สรุปการประชุมที่แปลงบันทึกเสียง/ข้อความเป็นสรุปประเด็นสำคัญ action items พร้อมกำหนดผู้รับผิดชอบและ deadline อัตโนมัติ",
    color: "from-brand-pink to-primary", category: "Content", author: "MeetBot",
    rating: 4.2, reviewCount: 45, usageCount: 670, tags: ["Meeting", "Summary", "Productivity"],
    featured: false, tools: ["email", "calculator"], recommendedModel: "Gemini Pro"
  },
  {
    id: "social-monitor", name: "📱 Social Media Monitor", description: "ติดตามและวิเคราะห์ sentiment บนโซเชียล",
    previewDescription: "Agent ติดตามการกล่าวถึงแบรนด์บนโซเชียลมีเดีย วิเคราะห์ sentiment แจ้งเตือนเมื่อมีวิกฤต และสร้างรายงานสรุปรายสัปดาห์อัตโนมัติ",
    color: "from-brand-orange to-brand-cyan", category: "Analytics", author: "SocialAI",
    rating: 4.1, reviewCount: 38, usageCount: 520, tags: ["Social Media", "Sentiment", "Monitoring"],
    featured: false, tools: ["web-search", "calculator"], recommendedModel: "GPT-4o mini"
  },
  {
    id: "email-responder", name: "📧 Email Auto-Responder", description: "ตอบอีเมลอัตโนมัติตามรูปแบบที่กำหนด",
    previewDescription: "Agent ตอบอีเมลอัตโนมัติที่เรียนรู้สไตล์การเขียนของคุณ จัดหมวดหมู่อีเมล ร่าง draft ให้ตรวจก่อนส่ง รองรับหลายภาษาและหลายบัญชี",
    color: "from-primary to-brand-green", category: "Support", author: "MailGenius",
    rating: 4.0, reviewCount: 52, usageCount: 780, tags: ["Email", "Automation", "Productivity"],
    featured: false, tools: ["email", "web-search"], recommendedModel: "GPT-4o mini"
  },
];

export const TOOLS_LIST = [
  { id: "web-search", name: "🌐 ค้นหาเว็บ", description: "ค้นหาข้อมูลจากอินเทอร์เน็ต" },
  { id: "read-excel", name: "📊 อ่าน Excel/CSV", description: "อ่านและวิเคราะห์ไฟล์ตาราง" },
  { id: "calculator", name: "🔢 คำนวณ", description: "คำนวณตัวเลขและสูตร" },
  { id: "code-exec", name: "💻 รันโค้ด", description: "เรียกใช้ Python code" },
  { id: "email", name: "📧 ส่งอีเมล", description: "ส่งอีเมลอัตโนมัติ" },
];
