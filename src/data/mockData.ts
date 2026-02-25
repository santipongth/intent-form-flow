export interface Agent {
  id: string;
  name: string;
  avatar: string;
  objective: string;
  status: "draft" | "published";
  model: string;
  createdAt: string;
  messagesCount: number;
  tokensUsed: number;
  template: string;
}

export interface ActivityItem {
  id: string;
  type: "created" | "edited" | "message" | "published";
  agentName: string;
  description: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  icon: string;
  detail: string;
  timestamp: string;
  duration: number;
  status: "success" | "processing" | "error";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export const TEMPLATES = [
  { id: "pdf-qa", name: "📄 ตอบคำถามจาก PDF", description: "อัปโหลด PDF แล้วให้ AI ตอบคำถามจากเนื้อหา", color: "from-primary to-brand-blue", category: "Knowledge" },
  { id: "news-summary", name: "📰 สรุปข่าวประจำวัน", description: "ค้นหาและสรุปข่าวล่าสุดจากเว็บ", color: "from-brand-orange to-brand-pink", category: "Research" },
  { id: "customer-support", name: "💬 Customer Support", description: "บอทตอบคำถามลูกค้าจากฐานความรู้", color: "from-brand-green to-brand-cyan", category: "Support" },
  { id: "code-reviewer", name: "🔍 Code Reviewer", description: "ตรวจสอบและแนะนำการปรับปรุงโค้ด", color: "from-brand-blue to-primary", category: "Dev" },
  { id: "content-writer", name: "✍️ Content Writer", description: "เขียนบทความ SEO จากหัวข้อที่กำหนด", color: "from-accent to-brand-orange", category: "Content" },
  { id: "data-analyst", name: "📊 Data Analyst", description: "วิเคราะห์ข้อมูลจาก Excel/CSV แล้วสรุปผล", color: "from-brand-cyan to-brand-green", category: "Analytics" },
];

export const MOCK_AGENTS: Agent[] = [
  { id: "1", name: "Nong Support", avatar: "💬", objective: "ตอบคำถามลูกค้า", status: "published", model: "GPT-4o", createdAt: "2026-02-20", messagesCount: 1247, tokensUsed: 450000, template: "customer-support" },
  { id: "2", name: "News Bot", avatar: "📰", objective: "สรุปข่าวประจำวัน", status: "published", model: "Claude 3.5", createdAt: "2026-02-18", messagesCount: 523, tokensUsed: 180000, template: "news-summary" },
  { id: "3", name: "Doc Reader", avatar: "📄", objective: "อ่านและตอบจาก PDF", status: "draft", model: "Gemini Pro", createdAt: "2026-02-22", messagesCount: 89, tokensUsed: 35000, template: "pdf-qa" },
  { id: "4", name: "Code Helper", avatar: "🔍", objective: "Review โค้ดและแนะนำ", status: "draft", model: "GPT-4o", createdAt: "2026-02-24", messagesCount: 34, tokensUsed: 12000, template: "code-reviewer" },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  { id: "1", type: "message", agentName: "Nong Support", description: "ตอบลูกค้าไป 12 ข้อความ", timestamp: "5 นาทีที่แล้ว" },
  { id: "2", type: "edited", agentName: "News Bot", description: "อัปเดต System Prompt", timestamp: "1 ชั่วโมงที่แล้ว" },
  { id: "3", type: "created", agentName: "Code Helper", description: "สร้าง Agent ใหม่", timestamp: "2 ชั่วโมงที่แล้ว" },
  { id: "4", type: "published", agentName: "Doc Reader", description: "เผยแพร่เป็น API", timestamp: "เมื่อวาน" },
  { id: "5", type: "message", agentName: "News Bot", description: "สรุปข่าว 5 บทความ", timestamp: "เมื่อวาน" },
];

export const MOCK_LOGS: LogEntry[] = [
  { id: "1", agentId: "1", agentName: "Nong Support", action: "🔍 กำลังค้นหาในฐานความรู้...", icon: "search", detail: "ค้นหาคำว่า 'การคืนสินค้า' ใน knowledge base", timestamp: "14:32:01", duration: 120, status: "success" },
  { id: "2", agentId: "1", agentName: "Nong Support", action: "📄 พบ 3 เอกสารที่เกี่ยวข้อง", icon: "file", detail: "return_policy.pdf (p.12), faq.pdf (p.5), terms.pdf (p.8)", timestamp: "14:32:02", duration: 80, status: "success" },
  { id: "3", agentId: "1", agentName: "Nong Support", action: "✍️ กำลังสรุปคำตอบ...", icon: "edit", detail: "สร้างคำตอบจาก 3 แหล่งข้อมูล ด้วยโทนสุภาพ", timestamp: "14:32:03", duration: 1500, status: "success" },
  { id: "4", agentId: "1", agentName: "Nong Support", action: "✅ ส่งคำตอบสำเร็จ", icon: "check", detail: "ความยาว 156 คำ, ใช้ 234 tokens", timestamp: "14:32:05", duration: 50, status: "success" },
  { id: "5", agentId: "2", agentName: "News Bot", action: "🌐 กำลังค้นหาข่าวจากเว็บ...", icon: "globe", detail: "Search query: 'AI news Thailand 2026'", timestamp: "13:15:00", duration: 2000, status: "success" },
  { id: "6", agentId: "2", agentName: "News Bot", action: "📰 พบ 8 บทความข่าว", icon: "newspaper", detail: "จาก Bangkok Post, The Nation, Techsauce", timestamp: "13:15:02", duration: 300, status: "success" },
  { id: "7", agentId: "2", agentName: "News Bot", action: "✍️ กำลังสรุปเนื้อหา...", icon: "edit", detail: "สรุป 8 บทความเป็น bullet points", timestamp: "13:15:03", duration: 3000, status: "processing" },
];

export const MOCK_CHAT: ChatMessage[] = [
  { id: "1", role: "user", content: "สวัสดีครับ อยากทราบนโยบายการคืนสินค้าครับ", timestamp: "14:31:50" },
  { id: "2", role: "assistant", content: "สวัสดีค่ะ! 😊 ยินดีช่วยเลยค่ะ\n\nนโยบายการคืนสินค้าของเรามีดังนี้:\n\n1. **คืนได้ภายใน 30 วัน** นับจากวันที่ได้รับสินค้า\n2. **สินค้าต้องอยู่ในสภาพสมบูรณ์** ไม่ผ่านการใช้งาน พร้อมแท็กและบรรจุภัณฑ์เดิม\n3. **คืนเงินภายใน 5-7 วันทำการ** หลังจากได้รับสินค้าคืน\n\nต้องการทราบรายละเอียดเพิ่มเติมไหมคะ?", timestamp: "14:32:05" },
  { id: "3", role: "user", content: "ถ้าสินค้ามีตำหนิจากโรงงานล่ะครับ?", timestamp: "14:33:10" },
  { id: "4", role: "assistant", content: "สำหรับสินค้าที่มีตำหนิจากโรงงาน เรามีนโยบายพิเศษค่ะ:\n\n🔄 **เปลี่ยนสินค้าใหม่ฟรี** หรือ **คืนเงินเต็มจำนวน**\n📅 ไม่จำกัดระยะเวลา (ภายในระยะประกัน)\n🚚 **ส่งคืนฟรี** ไม่เสียค่าจัดส่ง\n\nเพียงถ่ายรูปตำหนิส่งมาทางแชทนี้เลยค่ะ แล้วทีมงานจะดำเนินการให้ภายใน 24 ชั่วโมงค่ะ ✨", timestamp: "14:33:25" },
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
